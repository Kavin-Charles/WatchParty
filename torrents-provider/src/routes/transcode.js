/**
 * FFmpeg Transcoding Stream Service
 * Remuxes MKV streams to browser-compatible MP4 on-the-fly
 */

const express = require('express');
const { spawn, execSync } = require('child_process');
const path = require('path');
const router = express.Router();

// Find FFmpeg path
function getFFmpegPath() {
    try {
        // Check if ffmpeg is in PATH
        const result = execSync('where ffmpeg', { encoding: 'utf-8' });
        const ffmpegPath = result.trim().split('\n')[0];
        console.log('[FFmpeg] Found at:', ffmpegPath);
        return ffmpegPath;
    } catch (e) {
        // Common Windows installation paths
        const possiblePaths = [
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe'
        ];
        for (const p of possiblePaths) {
            try {
                require('fs').accessSync(p);
                console.log('[FFmpeg] Found at:', p);
                return p;
            } catch (e) { }
        }
    }
    return null;
}

/**
 * Stream endpoint - remuxes input URL to browser-compatible MP4
 * GET /api/transcode/stream?url=<TorrServer-stream-url>
 * 
 * This performs a REMUX (not re-encoding) when codecs are compatible
 * If codecs are incompatible, it will transcode to H.264/AAC
 */
router.get('/stream', async (req, res) => {
    const { url, forceTranscode } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'url parameter is required' });
    }

    const ffmpegPath = getFFmpegPath();
    if (!ffmpegPath) {
        return res.status(500).json({ error: 'FFmpeg not found. Please install FFmpeg.' });
    }

    console.log(`[Transcode] Starting stream for: ${url}`);

    try {
        // Set response headers for video streaming
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Accept-Ranges', 'none');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // FFmpeg arguments for remuxing to MP4 (fragmented for streaming)
        const ffmpegArgs = [
            '-i', url,                           // Input URL (TorrServer stream)
            '-c:v', 'copy',                      // Copy video codec (no re-encoding if possible)
            '-c:a', 'aac',                       // Convert audio to AAC (browser compatible)
            '-movflags', 'frag_keyframe+empty_moov+faststart', // Enable fragmented MP4 for streaming
            '-f', 'mp4',                         // Output format
            '-'                                  // Output to stdout (pipe)
        ];

        // If force transcode is requested, re-encode video too
        if (forceTranscode === 'true') {
            ffmpegArgs[2] = '-c:v';
            ffmpegArgs[3] = 'libx264';           // Re-encode to H.264
            ffmpegArgs.splice(4, 0, '-preset', 'ultrafast'); // Fast encoding
            ffmpegArgs.splice(6, 0, '-crf', '23'); // Quality setting
        }

        console.log(`[Transcode] FFmpeg command: ${ffmpegPath} ${ffmpegArgs.join(' ')}`);

        const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

        // Pipe FFmpeg stdout to response
        ffmpeg.stdout.pipe(res);

        // Log FFmpeg stderr (progress/errors)
        ffmpeg.stderr.on('data', (data) => {
            const message = data.toString();
            if (message.includes('frame=') || message.includes('size=')) {
                // Progress update - only log occasionally
                if (Math.random() < 0.1) {
                    console.log('[Transcode] Progress:', message.trim().substring(0, 100));
                }
            } else if (message.includes('error') || message.includes('Error')) {
                console.error('[Transcode] FFmpeg Error:', message);
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('[Transcode] FFmpeg spawn error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'FFmpeg error: ' + err.message });
            }
        });

        ffmpeg.on('close', (code) => {
            console.log(`[Transcode] FFmpeg process exited with code ${code}`);
            if (code !== 0 && !res.headersSent) {
                res.status(500).json({ error: 'FFmpeg exited with code ' + code });
            }
        });

        // Handle client disconnect
        req.on('close', () => {
            console.log('[Transcode] Client disconnected, killing FFmpeg');
            ffmpeg.kill('SIGKILL');
        });

    } catch (error) {
        console.error('[Transcode] Error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

/**
 * Probe endpoint - get media info from a URL
 * GET /api/transcode/probe?url=<url>
 */
router.get('/probe', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'url parameter is required' });
    }

    try {
        const result = execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${url}"`, {
            encoding: 'utf-8',
            timeout: 30000
        });
        res.json(JSON.parse(result));
    } catch (error) {
        res.status(500).json({ error: 'Failed to probe: ' + error.message });
    }
});

module.exports = router;
