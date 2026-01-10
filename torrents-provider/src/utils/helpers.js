const axios = require('axios');
const cheerio = require('cheerio');

// Default headers to mimic browser requests
const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

/**
 * Fetch HTML content from a URL
 */
async function fetchPage(url, customHeaders = {}) {
    try {
        const response = await axios.get(url, {
            headers: { ...defaultHeaders, ...customHeaders },
            timeout: 15000,
            maxRedirects: 5
        });
        return cheerio.load(response.data);
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error.message);
        throw error;
    }
}

/**
 * Parse file size string to bytes for sorting
 */
function parseSizeToBytes(sizeStr) {
    if (!sizeStr) return 0;

    const cleanStr = sizeStr.toString().trim().toUpperCase();
    const match = cleanStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB|KIB|MIB|GIB|TIB)?/i);

    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    const multipliers = {
        'B': 1,
        'KB': 1024,
        'KIB': 1024,
        'MB': 1024 * 1024,
        'MIB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'GIB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024,
        'TIB': 1024 * 1024 * 1024 * 1024
    };

    return value * (multipliers[unit] || 1);
}

/**
 * Filter results by quality
 */
function filterResults(results, quality) {
    const qualityLower = quality.toLowerCase();
    const qualityPatterns = {
        '4k': /4k|2160p|uhd/i,
        '2160p': /2160p|4k|uhd/i,
        '1080p': /1080p|fhd/i,
        '720p': /720p|hd/i,
        '480p': /480p|sd/i
    };

    const pattern = qualityPatterns[qualityLower];
    if (!pattern) return results;

    return results.filter(item => {
        const name = item.Name || item.name || '';
        return pattern.test(name);
    });
}

/**
 * Sort results by specified field
 */
function sortResults(results, sortBy, order = 'desc') {
    const sortField = sortBy.toLowerCase();

    return results.sort((a, b) => {
        let valA, valB;

        switch (sortField) {
            case 'seeders':
            case 'seeds':
                valA = parseInt(a.Seeders || a.seeders || 0);
                valB = parseInt(b.Seeders || b.seeders || 0);
                break;
            case 'leechers':
            case 'leech':
                valA = parseInt(a.Leechers || a.leechers || 0);
                valB = parseInt(b.Leechers || b.leechers || 0);
                break;
            case 'size':
                valA = parseSizeToBytes(a.Size || a.size);
                valB = parseSizeToBytes(b.Size || b.size);
                break;
            case 'date':
            case 'uploaded':
                valA = new Date(a.DateUploaded || a.date || 0).getTime();
                valB = new Date(b.DateUploaded || b.date || 0).getTime();
                break;
            case 'name':
                valA = (a.Name || a.name || '').toLowerCase();
                valB = (b.Name || b.name || '').toLowerCase();
                return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            default:
                return 0;
        }

        return order === 'asc' ? valA - valB : valB - valA;
    });
}

/**
 * Limit results count
 */
function limitResults(results, limit) {
    return results.slice(0, limit);
}

/**
 * Clean and normalize torrent name
 */
function cleanName(name) {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ');
}

/**
 * Extract quality from torrent name
 */
function extractQuality(name) {
    const qualityMatch = name.match(/(4k|2160p|1080p|720p|480p|HDRip|BRRip|BluRay|WEBRip|HDTV)/i);
    return qualityMatch ? qualityMatch[1].toUpperCase() : null;
}

module.exports = {
    fetchPage,
    parseSizeToBytes,
    filterResults,
    sortResults,
    limitResults,
    cleanName,
    extractQuality,
    defaultHeaders
};
