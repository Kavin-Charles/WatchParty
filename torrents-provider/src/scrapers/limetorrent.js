const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://www.limetorrents.lol';

const scraper = {
    name: 'LimeTorrent',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/search/all/${encodeURIComponent(query)}/seeds/${page}/`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table.table2 tr').each((i, element) => {
                if (i === 0) return; // Skip header row

                const $el = $(element);
                const cells = $el.find('td');

                if (cells.length < 5) return;

                const nameLink = cells.eq(0).find('a.cspill_nfo');
                const name = cleanName(nameLink.text());
                const url = nameLink.attr('href');
                const fullUrl = url?.startsWith('http') ? url : BASE_URL + url;

                const torrentLink = cells.eq(0).find('a.cspill_dl');
                const torrentHref = torrentLink.attr('href');

                const size = cells.eq(2).text().trim();
                const seeds = cells.eq(3).text().trim();
                const leeches = cells.eq(4).text().trim();
                const date = cells.eq(1).text().trim();

                if (name && fullUrl) {
                    results.push({
                        Name: name,
                        Url: fullUrl,
                        Torrent: torrentHref,
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
            console.error('LimeTorrent scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
