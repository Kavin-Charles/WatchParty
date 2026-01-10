const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://www.torrentfunk.com';

const scraper = {
    name: 'TorrentFunk',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/all/torrents/${encodeURIComponent(query)}.html?page=${page}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table.tmain tbody tr').each((i, element) => {
                const $el = $(element);
                const cells = $el.find('td');

                if (cells.length < 5) return;

                const nameLink = cells.eq(0).find('a.tt');
                const name = cleanName(nameLink.text());
                const url = nameLink.attr('href');
                const fullUrl = url?.startsWith('http') ? url : BASE_URL + url;
                const verified = cells.eq(0).find('.verified').length > 0;
                const size = cells.eq(2).text().trim();
                const seeds = cells.eq(3).text().trim();
                const leeches = cells.eq(4).text().trim();
                const date = cells.eq(1).text().trim();

                if (name && fullUrl) {
                    results.push({
                        Name: name,
                        Url: fullUrl,
                        Size: size,
                        DateUploaded: date,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0',
                        Verified: verified,
                        Magnet: null
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('TorrentFunk scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
