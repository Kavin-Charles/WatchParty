const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://www.torlock.com';

const scraper = {
    name: 'Torlock',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/all/torrents/${encodeURIComponent(query)}.html?page=${page}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table tbody tr').each((i, element) => {
                const $el = $(element);
                const cells = $el.find('td');

                if (cells.length < 5) return;

                const nameLink = cells.eq(0).find('a').eq(0);
                const name = cleanName(nameLink.text());
                const url = BASE_URL + nameLink.attr('href');
                const size = cells.eq(2).text().trim();
                const date = cells.eq(1).text().trim();
                const seeds = cells.eq(3).text().trim();
                const leeches = cells.eq(4).text().trim();

                if (name && url) {
                    results.push({
                        Name: name,
                        Url: url,
                        Size: size,
                        DateUploaded: date,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0',
                        Magnet: null // Need to fetch from detail page
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Torlock scraper error:', error.message);
            return [];
        }
    },

    async getDetails(url) {
        try {
            const $ = await fetchPage(url);
            const magnet = $('a[href^="magnet:"]').attr('href');
            return { magnet };
        } catch (error) {
            console.error('Torlock detail error:', error.message);
            return {};
        }
    }
};

module.exports = scraper;
