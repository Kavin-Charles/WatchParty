const { cleanName } = require('../utils/helpers');

// Note: RARBG is offline as of May 2023. This scraper is kept for historical purposes
// and may work with mirror sites if they exist.

const BASE_URL = 'https://rarbg.to';

const scraper = {
    name: 'RARBG',
    url: BASE_URL,

    async search(query, page = 1) {
        // RARBG has been shut down. Return empty results with a notice.
        console.warn('RARBG is offline since May 2023. This scraper returns empty results.');

        // You could potentially use a RARBG mirror or alternative API here
        // For now, return an empty array
        return [];

        /*
        // Original implementation (for reference if mirrors become available):
        const searchUrl = `${BASE_URL}/torrents.php?search=${encodeURIComponent(query)}&page=${page}`;
        
        try {
          const $ = await fetchPage(searchUrl);
          const results = [];
          
          $('tr.lista2').each((i, element) => {
            const $el = $(element);
            const nameLink = $el.find('td').eq(1).find('a').eq(0);
            const name = cleanName(nameLink.text());
            const url = BASE_URL + nameLink.attr('href');
            
            if (name && url) {
              results.push({
                Name: name,
                Url: url,
                Magnet: null
              });
            }
          });
          
          return results;
        } catch (error) {
          console.error('RARBG scraper error:', error.message);
          return [];
        }
        */
    }
};

module.exports = scraper;
