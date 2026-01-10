const express = require('express');
const router = express.Router();

// Import all scrapers
const scrapers = require('../scrapers');
const { filterResults, sortResults, limitResults } = require('../utils/helpers');

// Get list of available sites
router.get('/sites', (req, res) => {
    const sites = Object.keys(scrapers).map(key => ({
        id: key,
        name: scrapers[key].name,
        url: scrapers[key].url
    }));

    res.json({
        count: sites.length,
        sites
    });
});

// Search all sites at once
router.get('/all/:query/:page?', async (req, res) => {
    const { query, page = 1 } = req.params;
    const { quality, sortBy, order, limit } = req.query;

    try {
        const searchPromises = Object.keys(scrapers).map(async (siteKey) => {
            try {
                const results = await scrapers[siteKey].search(query, parseInt(page));
                return results.map(r => ({ ...r, source: siteKey }));
            } catch (error) {
                console.error(`Error searching ${siteKey}:`, error.message);
                return [];
            }
        });

        const allResults = await Promise.all(searchPromises);
        let results = allResults.flat();

        // Apply filters
        if (quality) {
            results = filterResults(results, quality);
        }

        // Apply sorting
        if (sortBy) {
            results = sortResults(results, sortBy, order || 'desc');
        }

        // Apply limit
        if (limit) {
            results = limitResults(results, parseInt(limit));
        }

        res.json({
            query,
            page: parseInt(page),
            total: results.length,
            results
        });
    } catch (error) {
        console.error('Error searching all sites:', error);
        res.status(500).json({
            error: 'Failed to search all sites',
            message: error.message
        });
    }
});

// Search specific site
router.get('/:site/:query/:page?', async (req, res) => {
    const { site, query, page = 1 } = req.params;
    const { quality, sortBy, order, limit } = req.query;

    const siteLower = site.toLowerCase();

    if (!scrapers[siteLower]) {
        return res.status(400).json({
            error: `Site '${site}' not supported`,
            availableSites: Object.keys(scrapers)
        });
    }

    try {
        let results = await scrapers[siteLower].search(query, parseInt(page));

        // Add source to each result
        results = results.map(r => ({ ...r, source: siteLower }));

        // Apply filters
        if (quality) {
            results = filterResults(results, quality);
        }

        // Apply sorting
        if (sortBy) {
            results = sortResults(results, sortBy, order || 'desc');
        }

        // Apply limit
        if (limit) {
            results = limitResults(results, parseInt(limit));
        }

        res.json({
            site: siteLower,
            query,
            page: parseInt(page),
            total: results.length,
            results
        });
    } catch (error) {
        console.error(`Error searching ${site}:`, error);
        res.status(500).json({
            error: `Failed to search ${site}`,
            message: error.message
        });
    }
});

module.exports = router;
