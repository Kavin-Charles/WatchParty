const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://yts.mx';

const scraper = {
    name: 'YTS',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&page=${page}&limit=50`;

        try {
            const axios = require('axios');
            const response = await axios.get(searchUrl, { timeout: 15000 });
            const data = response.data;

            if (!data.data || !data.data.movies) {
                return [];
            }

            const results = [];

            data.data.movies.forEach(movie => {
                movie.torrents?.forEach(torrent => {
                    results.push({
                        Name: `${movie.title} (${movie.year}) [${torrent.quality}] [${torrent.type}]`,
                        Url: movie.url,
                        Magnet: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://p4p.arenabg.com:1337&tr=udp://tracker.leechers-paradise.org:6969`,
                        Torrent: torrent.url,
                        Poster: movie.medium_cover_image,
                        Size: torrent.size,
                        Quality: torrent.quality,
                        Type: torrent.type,
                        Seeders: torrent.seeds?.toString() || '0',
                        Leechers: torrent.peers?.toString() || '0',
                        DateUploaded: torrent.date_uploaded,
                        Year: movie.year,
                        Rating: movie.rating,
                        Genre: movie.genres?.join(', '),
                        Runtime: movie.runtime,
                        Synopsis: movie.synopsis
                    });
                });
            });

            return results;
        } catch (error) {
            console.error('YTS scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
