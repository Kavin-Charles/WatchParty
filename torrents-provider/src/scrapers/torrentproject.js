const axios = require('axios');
const { cleanName } = require('../utils/helpers');

const BASE_URL = 'https://torrentproject2.com';

const scraper = {
    name: 'TorrentProject',
    url: BASE_URL,

    async search(query, page = 1) {
        // TorrentProject has an API endpoint
        const offset = (page - 1) * 20;
        const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}&out=json&num=20&start=${offset}`;

        try {
            const response = await axios.get(searchUrl, { timeout: 15000 });
            const data = response.data;

            if (!data || typeof data !== 'object') {
                return [];
            }

            const results = [];

            // Skip the first key 'total_found'
            Object.keys(data).forEach(key => {
                if (key === 'total_found') return;

                const item = data[key];
                if (!item || !item.title) return;

                const trackers = [
                    'udp://tracker.opentrackr.org:1337/announce',
                    'udp://open.stealth.si:80/announce',
                    'udp://tracker.torrent.eu.org:451/announce',
                    'udp://tracker.bittor.pw:1337/announce',
                    'udp://public.popcorn-tracker.org:6969/announce'
                ];

                const magnet = item.torrent_hash ?
                    `magnet:?xt=urn:btih:${item.torrent_hash}&dn=${encodeURIComponent(item.title)}${trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('')}` :
                    null;

                results.push({
                    Name: cleanName(item.title),
                    Url: item.url || `${BASE_URL}/${key}`,
                    Magnet: magnet,
                    InfoHash: item.torrent_hash,
                    Size: formatSize(item.torrent_size),
                    Seeders: item.seeds?.toString() || '0',
                    Leechers: item.leechs?.toString() || '0'
                });
            });

            return results;
        } catch (error) {
            console.error('TorrentProject scraper error:', error.message);
            return [];
        }
    }
};

function formatSize(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = scraper;
