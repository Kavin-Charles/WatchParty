const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://torrentgalaxy.to';

const scraper = {
    name: 'TorrentGalaxy',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/torrents.php?search=${encodeURIComponent(query)}&page=${page - 1}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('div.tgxtablerow').each((i, element) => {
                const $el = $(element);
                const nameLink = $el.find('div.tgxtablecell a.txlight').eq(0);
                const name = cleanName(nameLink.text());
                const url = BASE_URL + nameLink.attr('href');
                const poster = $el.find('img.img-fluid').attr('src');
                const magnet = $el.find('a[href^="magnet:"]').attr('href');
                const torrent = $el.find('a[href$=".torrent"]').attr('href');
                const category = $el.find('div.tgxtablecell a[href*="cat="]').text().trim();
                const size = $el.find('div.tgxtablecell span.badge').eq(0).text().trim();
                const uploader = $el.find('div.tgxtablecell a.username').text().trim();
                const seeds = $el.find('div.tgxtablecell span[title="Seeders/Leechers"] font').eq(0).text().trim();
                const leeches = $el.find('div.tgxtablecell span[title="Seeders/Leechers"] font').eq(1).text().trim();
                const date = $el.find('div.tgxtablecell').eq(11).text().trim();

                if (name && magnet) {
                    results.push({
                        Name: name,
                        Url: url,
                        Poster: poster,
                        Magnet: magnet,
                        Torrent: torrent ? (torrent.startsWith('http') ? torrent : BASE_URL + torrent) : null,
                        Category: category,
                        Size: size,
                        UploadedBy: uploader,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0',
                        DateUploaded: date
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('TorrentGalaxy scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
