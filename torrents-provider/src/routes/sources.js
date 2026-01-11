/**
 * Sources Router - Magnet-only support
 * This module is deprecated as the application now only supports magnet links.
 * All video sources are obtained via torrent/magnet links through the torrent scrapers.
 */

const express = require('express');
const router = express.Router();

/**
 * Info endpoint - explains magnet-only support
 * GET /api/sources/info
 */
router.get('/info', (req, res) => {
    res.json({
        message: 'This endpoint only supports magnet links',
        supported: ['magnet'],
        deprecated: ['embed', 'hls', 'm3u8'],
        instructions: 'Use /api/torrent endpoints to search for magnet links'
    });
});

/**
 * Deprecated: Movie sources endpoint
 * GET /api/sources/movie/:tmdbId
 */
router.get('/movie/:tmdbId', (req, res) => {
    res.status(410).json({
        error: 'Embed sources deprecated',
        message: 'Only magnet links are supported. Use /api/torrent/movie/:title to search for torrents.',
        tmdbId: req.params.tmdbId
    });
});

/**
 * Deprecated: TV sources endpoint
 * GET /api/sources/tv/:tmdbId/:season/:episode
 */
router.get('/tv/:tmdbId/:season/:episode', (req, res) => {
    res.status(410).json({
        error: 'Embed sources deprecated',
        message: 'Only magnet links are supported. Use /api/torrent/tv/:title/:season/:episode to search for torrents.',
        tmdbId: req.params.tmdbId,
        season: req.params.season,
        episode: req.params.episode
    });
});

module.exports = router;
