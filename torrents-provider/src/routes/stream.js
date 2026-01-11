/**
 * Native Torrent Streaming with FFmpeg Transcoding
 * Pure Node.js solution - no TorrServer needed
 * 
 * Flow: Magnet → torrent-stream → FFmpeg → Browser (MP4)
 */

const express = require('express');
const torrentStream = require('torrent-stream');
const { spawn, execSync } = require('child_process');
const path = require('path');
const router = express.Router();

// Store active torrent engines
const activeEngines = new Map();
const activeStreams = new Map();

// Enhanced trackers list
const TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.tracker.cl:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://open.demonii.com:1337/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://tracker.moeking.me:6969/announce',
    'udp://explodie.org:6969/announce',
    'udp://tracker.theoks.net:6969/announce',
    'udp://tracker1.bt.moack.co.kr:80/announce',
    'http://tracker.openbittorrent.com:80/announce',
    'http://tracker.files.fm:6969/announce'
];

// Find FFmpeg path
function getFFmpegPath() {
    try {
        const result = execSync('where ffmpeg', { encoding: 'utf-8' });
        return result.trim().split('\n')[0].trim();
    } catch (e) {
        const paths = [
            'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe',
            'C:\\ffmpeg\\bin\\ffmpeg.exe'
        ];
        for (const p of paths) {
            try {
                require('fs').accessSync(p);
                return p;
            } catch (e) { }
        }
    }
    return 'ffmpeg'; // Assume in PATH
}

/**
 * Add a torrent and get file list
 * POST /api/stream/add
 * Body: { magnet: "magnet:?..." }
 */
router.post('/add', async (req, res) => {
    const { magnet } = req.body;

    if (!magnet) {
        return res.status(400).json({ error: 'magnet is required' });
    }

    // Extract infohash from magnet
    const match = magnet.match(/btih:([a-fA-F0-9]{40})/i);
    if (!match) {
        return res.status(400).json({ error: 'Invalid magnet link' });
    }
    const infoHash = match[1].toLowerCase();

    console.log(`[Stream] Adding torrent: ${infoHash}`);

    // Check if already active
    if (activeEngines.has(infoHash)) {
        const engine = activeEngines.get(infoHash);
        const files = engine.files.map((f, i) => ({
            index: i,
            name: f.name,
            path: f.path,
            size: f.length,
            sizeFormatted: formatSize(f.length)
        }));
        return res.json({ infoHash, files, status: 'already_active' });
    }

    try {
        // Add trackers to magnet
        let enhancedMagnet = magnet;
        TRACKERS.forEach(tr => {
            if (!enhancedMagnet.includes(tr)) {
                enhancedMagnet += `&tr=${encodeURIComponent(tr)}`;
            }
        });

        const engine = torrentStream(enhancedMagnet, {
            path: path.join(__dirname, '../../downloads'),
            trackers: TRACKERS,
            dht: true,
            verify: true
        });

        // Wait for metadata
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for metadata')), 60000);

            engine.on('ready', () => {
                clearTimeout(timeout);
                resolve();
            });

            engine.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        activeEngines.set(infoHash, engine);

        // Get video files
        const files = engine.files
            .map((f, i) => ({
                index: i,
                name: f.name,
                path: f.path,
                size: f.length,
                sizeFormatted: formatSize(f.length),
                isVideo: /\.(mkv|mp4|avi|webm|mov|m4v)$/i.test(f.name)
            }))
            .filter(f => f.isVideo || f.size > 50 * 1024 * 1024); // Include videos and large files

        console.log(`[Stream] Torrent ready: ${files.length} files`);

        res.json({
            infoHash,
            files,
            status: 'ready'
        });

    } catch (error) {
        console.error('[Stream] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Stream a file from torrent with FFmpeg transcoding
 * GET /api/stream/:infoHash/:fileIndex
 * Query: ?transcode=true to force transcoding
 */
router.get('/:infoHash/:fileIndex', async (req, res) => {
    const { infoHash, fileIndex } = req.params;
    const { transcode } = req.query;

    const engine = activeEngines.get(infoHash.toLowerCase());
    if (!engine) {
        return res.status(404).json({ error: 'Torrent not found. Add it first via POST /api/stream/add' });
    }

    const file = engine.files[parseInt(fileIndex)];
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    console.log(`[Stream] Starting stream: ${file.name} (${formatSize(file.length)})`);

    // Check if file needs transcoding (MKV files)
    const needsTranscode = transcode === 'true' || /\.(mkv|avi|wmv)$/i.test(file.name);
    const ffmpegPath = getFFmpegPath();

    try {
        // Select the file for download
        file.select();

        // Create read stream
        const stream = file.createReadStream();

        if (needsTranscode) {
            console.log(`[Stream] Transcoding ${file.name} with FFmpeg`);

            // Set headers for transcoded stream
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader('Accept-Ranges', 'none');

            // FFmpeg transcoding to fragmented MP4
            const ffmpeg = spawn(ffmpegPath, [
                '-i', 'pipe:0',                          // Input from stdin
                '-c:v', 'copy',                          // Copy video (no re-encode if H.264)
                '-c:a', 'aac',                           // Convert audio to AAC
                '-movflags', 'frag_keyframe+empty_moov+faststart',
                '-f', 'mp4',
                'pipe:1'                                 // Output to stdout
            ]);

            // Pipe: torrent → ffmpeg → response
            stream.pipe(ffmpeg.stdin);
            ffmpeg.stdout.pipe(res);

            // Handle errors
            ffmpeg.stderr.on('data', (data) => {
                const msg = data.toString();
                if (msg.includes('error') || msg.includes('Error')) {
                    console.error('[FFmpeg]', msg.trim());
                }
            });

            ffmpeg.on('error', (err) => {
                console.error('[FFmpeg] Spawn error:', err.message);
            });

            ffmpeg.on('close', (code) => {
                console.log(`[FFmpeg] Exited with code ${code}`);
            });

            // Handle client disconnect
            req.on('close', () => {
                console.log('[Stream] Client disconnected');
                ffmpeg.kill('SIGKILL');
                stream.destroy();
            });

        } else {
            // Direct streaming for MP4 files
            console.log(`[Stream] Direct streaming ${file.name}`);

            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Length', file.length);
            res.setHeader('Accept-Ranges', 'bytes');

            stream.pipe(res);

            req.on('close', () => {
                console.log('[Stream] Client disconnected');
                stream.destroy();
            });
        }

    } catch (error) {
        console.error('[Stream] Error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

/**
 * Get stream status
 * GET /api/stream/status/:infoHash
 */
router.get('/status/:infoHash', (req, res) => {
    const engine = activeEngines.get(req.params.infoHash.toLowerCase());
    if (!engine) {
        return res.status(404).json({ error: 'Torrent not found' });
    }

    const swarm = engine.swarm;
    res.json({
        infoHash: req.params.infoHash,
        downloadSpeed: swarm.downloadSpeed(),
        uploadSpeed: swarm.uploadSpeed(),
        peers: swarm.wires.length,
        downloaded: swarm.downloaded,
        uploaded: swarm.uploaded
    });
});

/**
 * Remove a torrent
 * DELETE /api/stream/:infoHash
 */
router.delete('/:infoHash', (req, res) => {
    const infoHash = req.params.infoHash.toLowerCase();
    const engine = activeEngines.get(infoHash);

    if (engine) {
        engine.destroy();
        activeEngines.delete(infoHash);
        res.json({ message: 'Torrent removed' });
    } else {
        res.status(404).json({ error: 'Torrent not found' });
    }
});

// Helper function
function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return bytes.toFixed(2) + ' ' + units[i];
}

module.exports = router;
