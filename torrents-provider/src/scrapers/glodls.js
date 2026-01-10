const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://glodls.to';

const scraper = {
    name: 'GLODLS',
    url: BASE_URL,

    async search(query, page = 1) {
        const offset = (page - 1) * 50;
        const searchUrl = `${BASE_URL}/search_results.php?search=${encodeURIComponent(query)}&sort=seeders&order=desc&start=${offset}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table.ttable_headinner tr:not(:first-child)').each((i, element) => {
                const $el = $(element);
                const cells = $el.find('td');

                if (cells.length < 7) return;

                const nameLink = cells.eq(1).find('a').eq(0);
                const name = cleanName(nameLink.text());
                const url = nameLink.attr('href');
                const fullUrl = url?.startsWith('http') ? url : BASE_URL + '/' + url;
                const magnet = cells.eq(3).find('a[href^="magnet:"]').attr('href');
                const torrent = cells.eq(3).find('a[href$=".torrent"]').attr('href');
                const size = cells.eq(4).text().trim();
                const seeds = cells.eq(5).find('font').text().trim();
                const leeches = cells.eq(6).find('font').text().trim();

                if (name && (magnet || torrent)) {
                    results.push({
                        Name: name,
                        Url: fullUrl,
                        Magnet: magnet,
                        Torrent: torrent ? BASE_URL + '/' + torrent : null,
                        Size: size,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('GLODLS scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
