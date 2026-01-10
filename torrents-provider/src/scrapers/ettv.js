const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://www.ettvcentral.com';

const scraper = {
    name: 'ETTV',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/torrents-search.php?search=${encodeURIComponent(query)}&page=${page}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table.table tbody tr').each((i, element) => {
                const $el = $(element);
                const cells = $el.find('td');

                if (cells.length < 5) return;

                const nameLink = cells.eq(1).find('a').eq(0);
                const name = cleanName(nameLink.text());
                const url = nameLink.attr('href');
                const fullUrl = url?.startsWith('http') ? url : BASE_URL + url;
                const size = cells.eq(2).text().trim();
                const seeds = cells.eq(4).text().trim();
                const leeches = cells.eq(5).text().trim();
                const date = cells.eq(3).text().trim();

                if (name && url) {
                    results.push({
                        Name: name,
                        Url: fullUrl,
                        Size: size,
                        DateUploaded: date,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0',
                        Magnet: null
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('ETTV scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
