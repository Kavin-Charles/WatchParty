const { fetchPage, cleanName } = require('../utils/helpers');

const BASE_URL = 'https://bitsearch.to';

const scraper = {
    name: 'BitSearch',
    url: BASE_URL,

    async search(query, page = 1) {
        const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`;

        try {
            const $ = await fetchPage(searchUrl);
            const results = [];

            $('li.search-result').each((i, element) => {
                const $el = $(element);
                const nameLink = $el.find('h5.title a');
                const name = cleanName(nameLink.text());
                const url = nameLink.attr('href');
                const fullUrl = url?.startsWith('http') ? url : BASE_URL + url;
                const magnet = $el.find('a[href^="magnet:"]').attr('href');
                const category = $el.find('.category').text().trim();
                const size = $el.find('.stats div').eq(2).text().trim();
                const seeds = $el.find('.stats div').eq(0).text().replace('Seeders', '').trim();
                const leeches = $el.find('.stats div').eq(1).text().replace('Leechers', '').trim();
                const date = $el.find('.stats div').eq(3).text().trim();

                if (name && magnet) {
                    results.push({
                        Name: name,
                        Url: fullUrl,
                        Magnet: magnet,
                        Category: category,
                        Size: size,
                        DateUploaded: date,
                        Seeders: seeds || '0',
                        Leechers: leeches || '0'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('BitSearch scraper error:', error.message);
            return [];
        }
    }
};

module.exports = scraper;
