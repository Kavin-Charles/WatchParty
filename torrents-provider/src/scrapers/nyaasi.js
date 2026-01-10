const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://nyaa.si';

const scraper = {
    name: 'Nyaa.si',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/?f=0&c=0_0&q=${encodeURIComponent(query)}&p=${page}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('table.torrent-list tbody tr').each((i, element) => {
                const $el = $(element);
                const cells = $el.find('td');

                const category = cells.eq(0).find('a').attr('title');
                const nameLink = cells.eq(1).find('a:not(.comments)').last();
                const name = cleanName(nameLink.text());
                const url = BASE_URL + nameLink.attr('href');
                const torrent = cells.eq(2).find('a[href$=".torrent"]').attr('href');
                const magnet = cells.eq(2).find('a[href^="magnet:"]').attr('href');
                const size = cells.eq(3).text().trim();
                const date = cells.eq(4).text().trim();
                const seeds = cells.eq(5).text().trim();
                const leeches = cells.eq(6).text().trim();
                const downloads = cells.eq(7).text().trim();

                if (name && (magnet || torrent)) {
                    results.push({
                        Name: name,
                        Url: url,
                        Category: category,
                        Torrent: torrent ? BASE_URL + torrent : null,
                        Magnet: magnet,
                        Size: size,
                        DateUploaded: date,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0',
                        Downloads: downloads || '0'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Nyaa.si scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
