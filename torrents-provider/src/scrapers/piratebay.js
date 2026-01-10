const axios = require('axios');
const { cleanName } = require('../utils/helpers');

// PirateBay API endpoint (uses apibay.org which is the official API)
const BASE_URL = 'https://apibay.org';

const scraper = {
    name: 'PirateBay',
    url: 'https://thepiratebay.org',

    async search(query, page = 1) {
        // PirateBay API doesn't support pagination, returns top 100
        const searchUrl = `${BASE_URL}/q.php?q=${encodeURIComponent(query)}&cat=`;

        try {
            const response = await axios.get(searchUrl, { timeout: 15000 });
            const data = response.data;

            if (!Array.isArray(data) || data.length === 0 || data[0].name === 'No results returned') {
                return [];
            }

            const results = data.map(item => {
                const trackers = [
                    'udp://tracker.coppersurfer.tk:6969/announce',
                    'udp://tracker.openbittorrent.com:6969/announce',
                    'udp://tracker.opentrackr.org:1337',
                    'udp://tracker.leechers-paradise.org:6969/announce',
                    'udp://tracker.dler.org:6969/announce',
                    'udp://opentracker.i2p.rocks:6969/announce',
                    'udp://47.ip-51-68-199.eu:6969/announce'
                ];

                const magnetUrl = `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}${trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('')}`;

                return {
                    Name: cleanName(item.name),
                    Url: `https://thepiratebay.org/description.php?id=${item.id}`,
                    Magnet: magnetUrl,
                    InfoHash: item.info_hash,
                    Size: formatBytes(parseInt(item.size)),
                    SizeBytes: item.size,
                    Seeders: item.seeders,
                    Leechers: item.leechers,
                    DateUploaded: new Date(item.added * 1000).toISOString(),
                    Category: getCategoryName(item.category),
                    UploadedBy: item.username,
                    Status: item.status
                };
            });

            return results;
        } catch (error) {
            console.error('PirateBay scraper error:', error.message);
            return [];
        }
    }
};

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getCategoryName(catId) {
    const categories = {
        '100': 'Audio',
        '101': 'Music',
        '102': 'Audio books',
        '103': 'Sound clips',
        '104': 'FLAC',
        '199': 'Other Audio',
        '200': 'Video',
        '201': 'Movies',
        '202': 'Movies DVDR',
        '203': 'Music videos',
        '204': 'Movie clips',
        '205': 'TV shows',
        '206': 'Handheld',
        '207': 'HD - Movies',
        '208': 'HD - TV shows',
        '209': '3D',
        '210': 'CAM/TS',
        '211': 'UHD/4k - Movies',
        '212': 'UHD/4k - TV shows',
        '299': 'Other Video',
        '300': 'Applications',
        '400': 'Games',
        '500': 'Porn',
        '600': 'Other'
    };
    return categories[catId] || 'Unknown';
}

module.exports = scraper;
