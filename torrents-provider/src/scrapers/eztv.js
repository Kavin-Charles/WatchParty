const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://eztv.re';

const scraper = {
    name: 'EZTV',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('tr.forum_header_border').each((i, element) => {
                const $el = $(element);
                const nameLink = $el.find('td').eq(1).find('a').eq(0);
                const name = cleanName(nameLink.text());
                const url = BASE_URL + nameLink.attr('href');
                const magnet = $el.find('a.magnet').attr('href');
                const torrent = $el.find('a.download_1').attr('href');
                const size = $el.find('td').eq(3).text().trim();
                const date = $el.find('td').eq(4).text().trim();
                const seeds = $el.find('td').eq(5).find('font').text().trim();

                if (name && (magnet || torrent)) {
                    results.push({
                        Name: name,
                        Url: url,
                        Magnet: magnet,
                        Torrent: torrent ? (torrent.startsWith('http') ? torrent : BASE_URL + torrent) : null,
                        Size: size,
                        DateUploaded: date,
                        Seeders: seeds || '0',
                        Leechers: '0'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('EZTV scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
