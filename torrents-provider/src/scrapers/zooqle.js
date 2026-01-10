const { cleanName } = require('../utils/helpers');

// Note: Zooqle has been offline for a while. This scraper is kept for reference.

const BASE_URL = 'https://zooqle.com';

const scraper = {
    name: 'Zooqle',
    url: BASE_URL,

    async search(query, page = 1) {
        // Zooqle is largely offline. Return empty results.
        console.warn('Zooqle is offline. This scraper returns empty results.');
        return [];

        /*
        // Original implementation (for reference):
        const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}&pg=${page}`;
        
        try {
          const $ = await fetchPage(searchUrl);
          const results = [];
          
          $('tr').each((i, element) => {
            const $el = $(element);
            const nameLink = $el.find('td').eq(1).find('a').eq(0);
            const name = cleanName(nameLink.text());
            const url = BASE_URL + nameLink.attr('href');
            const magnet = $el.find('a[href^="magnet:"]').attr('href');
            
            if (name && url) {
              results.push({
                Name: name,
                Url: url,
                Magnet: magnet
              });
            }
          });
          
          return results;
        } catch (error) {
          console.error('Zooqle scraper error:', error.message);
          return [];
        }
        */
    }
};

module.exports = scraper;
