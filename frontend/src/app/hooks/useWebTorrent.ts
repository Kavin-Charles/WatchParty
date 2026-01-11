import { useState, useEffect, useRef, useCallback } from 'react';

interface TorrentFile {
    index: number;
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    isVideo?: boolean;
}

interface TorrentState {
    isLoading: boolean;
    isReady: boolean;
    error: string | null;
    files: TorrentFile[];
    selectedFile: TorrentFile | null;
    videoUrl: string | null;
    infoHash: string | null;
    downloadSpeed: number;
    peers: number;
}

const API_URL = 'http://localhost:3001';

/**
 * Hook to manage torrent streaming with native Node.js backend
 * Flow: Add magnet → Get files → Stream with transcoding
 */
export function useWebTorrent(magnetUri: string | null) {
    const [state, setState] = useState<TorrentState>({
        isLoading: false,
        isReady: false,
        error: null,
        files: [],
        selectedFile: null,
        videoUrl: null,
        infoHash: null,
        downloadSpeed: 0,
        peers: 0
    });

    const statusInterval = useRef<NodeJS.Timeout | null>(null);

    // Add torrent and get file list
    useEffect(() => {
        if (!magnetUri) {
            setState(s => ({ ...s, videoUrl: null, isReady: false, files: [], infoHash: null }));
            return;
        }

        const addTorrent = async () => {
            setState(s => ({ ...s, isLoading: true, error: null }));

            try {
                console.log('[Torrent] Adding magnet...');

                const response = await fetch(`${API_URL}/api/stream/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ magnet: magnetUri })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to add torrent');
                }

                const data = await response.json();
                console.log('[Torrent] Added:', data);

                if (!data.files || data.files.length === 0) {
                    throw new Error('No video files found in torrent');
                }

                // Find largest video file
                const videoFiles = data.files.filter((f: TorrentFile) =>
                    f.isVideo || /\.(mkv|mp4|avi|webm)$/i.test(f.name)
                );

                if (videoFiles.length === 0) {
                    throw new Error('No video files found in torrent');
                }

                // Select the largest video file
                const selectedFile = videoFiles.reduce((a: TorrentFile, b: TorrentFile) =>
                    a.size > b.size ? a : b
                );

                // Construct stream URL with transcoding
                const streamUrl = `${API_URL}/api/stream/${data.infoHash}/${selectedFile.index}?transcode=true`;

                console.log('[Torrent] Stream URL:', streamUrl);

                setState(s => ({
                    ...s,
                    isLoading: false,
                    isReady: true,
                    files: data.files,
                    selectedFile,
                    videoUrl: streamUrl,
                    infoHash: data.infoHash
                }));

                // Start polling for status
                startStatusPolling(data.infoHash);

            } catch (err) {
                console.error('[Torrent] Error:', err);
                setState(s => ({
                    ...s,
                    isLoading: false,
                    isReady: false,
                    error: err instanceof Error ? err.message : 'Failed to add torrent'
                }));
            }
        };

        addTorrent();

        return () => {
            if (statusInterval.current) {
                clearInterval(statusInterval.current);
            }
        };
    }, [magnetUri]);

    // Poll for download status
    const startStatusPolling = (infoHash: string) => {
        if (statusInterval.current) {
            clearInterval(statusInterval.current);
        }

        statusInterval.current = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/stream/status/${infoHash}`);
                if (response.ok) {
                    const data = await response.json();
                    setState(s => ({
                        ...s,
                        downloadSpeed: data.downloadSpeed || 0,
                        peers: data.peers || 0
                    }));
                }
            } catch (e) {
                // Ignore polling errors
            }
        }, 2000);
    };

    // Select a different file
    const selectFile = useCallback((file: TorrentFile) => {
        if (!state.infoHash) return;

        const streamUrl = `${API_URL}/api/stream/${state.infoHash}/${file.index}?transcode=true`;
        setState(s => ({
            ...s,
            selectedFile: file,
            videoUrl: streamUrl
        }));
    }, [state.infoHash]);

    // Format download speed
    const downloadSpeedFormatted = state.downloadSpeed > 0
        ? `${(state.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`
        : '0 MB/s';

    return {
        isLoading: state.isLoading,
        isReady: state.isReady,
        error: state.error,
        files: state.files,
        selectedFile: state.selectedFile,
        videoUrl: state.videoUrl,
        torrentName: state.selectedFile?.name || '',
        downloadSpeed: state.downloadSpeed,
        downloadSpeedFormatted,
        peers: state.peers,
        selectFile
    };
}

// Keep for backward compatibility
export const useVideoSource = useWebTorrent;
