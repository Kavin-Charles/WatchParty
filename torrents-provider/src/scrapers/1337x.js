const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://1337x.to';

const scraper = {
    name: '1337x',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}/${page}/`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('tbody tr').each((i, element) => {
                const $el = $(element);
                const nameLink = $el.find('.name a').eq(1);
                const name = cleanName(nameLink.text());
                const url = BASE_URL + nameLink.attr('href');
                const seeds = $el.find('.seeds').text().trim();
                const leeches = $el.find('.leeches').text().trim();
                const size = $el.find('.size').text().replace(/[\d.]+\s*[KMGT]?B$/i, '').trim();
                const sizeClean = $el.find('.size').clone().children().remove().end().text().trim();
                const date = $el.find('.coll-date').text().trim();
                const uploader = $el.find('.coll-5 a').text().trim();

                if (name && url) {
                    results.push({
                        Name: name,
                        Url: url,
                        Seeders: seeds,
                        Leechers: leeches,
                        Size: sizeClean || size,
                        DateUploaded: date,
                        UploadedBy: uploader,
                        Magnet: null // Will be fetched from detail page if needed
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('1337x scraper error:', error.message);
            return [];
        }
    },

    async getDetails(url) {
        try {
            const $ = await fetchPage(url);
            const magnet = $('a[href^="magnet:"]').attr('href');
            const poster = $('.torrent-image img').attr('src');
            const category = $('.torrent-category span').text().trim();

            return { magnet, poster, category };
        } catch (error) {
            console.error('1337x detail error:', error.message);
            return {};
        }
    }
};

module.exports = scraper;
