const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://kickasstorrents.to';

const scraper = {
    name: 'KickAss',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/usearch/${encodeURIComponent(query)}/${page}/`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table.data tr:not(.firstr)').each((i, element) => {
                const $el = $(element);
                const nameLink = $el.find('a.cellMainLink');
                const name = cleanName(nameLink.text());
                const url = nameLink.attr('href');
                const fullUrl = url?.startsWith('http') ? url : BASE_URL + url;
                const magnet = $el.find('a[href^="magnet:"]').attr('href');
                const size = $el.find('td').eq(1).text().trim();
                const seeds = $el.find('td').eq(4).text().trim();
                const leeches = $el.find('td').eq(5).text().trim();
                const date = $el.find('td').eq(3).text().trim();

                if (name && (magnet || url)) {
                    results.push({
                        Name: name,
                        Url: fullUrl,
                        Magnet: magnet,
                        Size: size,
                        DateUploaded: date,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('KickAss scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
