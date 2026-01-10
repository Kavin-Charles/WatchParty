const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://www.magnetdl.com';

const scraper = {
    name: 'MagnetDL',
    url: BASE_URL,

    async search(query, page = 1) {
        // MagnetDL uses first letter of query in URL
        const firstLetter = query.charAt(0).toLowerCase();
        const searchUrl = `${BASE_URL}/${firstLetter}/${encodeURIComponent(query.replace(/\s+/g, '-'))}/`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table.download tbody tr').each((i, element) => {
                const $el = $(element);
                const cells = $el.find('td');

                if (cells.length < 6) return;

                const magnet = cells.eq(0).find('a[href^="magnet:"]').attr('href');
                const nameLink = cells.eq(1).find('a');
                const name = cleanName(nameLink.text());
                const url = nameLink.attr('href');
                const fullUrl = url?.startsWith('http') ? url : BASE_URL + url;
                const size = cells.eq(5).text().trim();
                const seeds = cells.eq(6).text().trim();
                const leeches = cells.eq(7).text().trim();

                if (name && magnet) {
                    results.push({
                        Name: name,
                        Url: fullUrl,
                        Magnet: magnet,
                        Size: size,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('MagnetDL scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
