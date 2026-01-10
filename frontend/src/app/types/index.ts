// Torrent search result from torrents-provider API
export interface TorrentResult {
    Name: string;
    Url: string;
    Magnet: string | null;
    Torrent?: string | null;
    InfoHash?: string;
    Poster?: string | null;
    Size: string;
    SizeBytes?: string | number;
    Quality?: string;
    Seeders: string;
    Leechers: string;
    DateUploaded?: string;
    Category?: string;
    UploadedBy?: string;
    source: string;
}

export interface TorrentSearchResponse {
    site?: string;
    query: string;
    page: number;
    total: number;
    results: TorrentResult[];
}

export interface TorrentSite {
    id: string;
    name: string;
    url: string;
}

export interface SitesResponse {
    count: number;
    sites: TorrentSite[];
}

// Movie data for display
export interface Movie {
    id: string;
    title: string;
    year: string;
    genre: string;
    rating: string;
    image: string;
    synopsis?: string;
    runtime?: string;
    cast?: { name: string; role: string; image: string }[];
}

// Watch Party types
export interface WatchPartyRoom {
    id: string;
    code: string;
    hostId: string;
    movieTitle: string;
    magnet: string;
    participants: Participant[];
    playbackState: PlaybackState;
}

export interface Participant {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
}

export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    lastUpdated: number;
}

export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    avatar: string;
    message: string;
    timestamp: number;
    isSystem?: boolean;
}
