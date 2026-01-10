import type { TorrentSearchResponse, SitesResponse } from '../types';

const TORRENTS_API_URL = 'http://localhost:3001';

interface SearchOptions {
    quality?: string;
    sortBy?: 'seeders' | 'leechers' | 'size' | 'date';
    order?: 'asc' | 'desc';
    limit?: number;
    page?: number;
}

/**
 * Search all torrent sites
 */
export async function searchAllSites(
    query: string,
    options: SearchOptions = {}
): Promise<TorrentSearchResponse> {
    const { quality, sortBy = 'seeders', order = 'desc', limit = 20, page = 1 } = options;

    const params = new URLSearchParams({
        sortBy,
        order,
        limit: limit.toString(),
    });

    if (quality) params.append('quality', quality);

    const url = `${TORRENTS_API_URL}/api/all/${encodeURIComponent(query)}/${page}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Search error:', error);
        return { query, page, total: 0, results: [] };
    }
}

/**
 * Search a specific torrent site
 */
export async function searchSite(
    site: string,
    query: string,
    options: SearchOptions = {}
): Promise<TorrentSearchResponse> {
    const { quality, sortBy = 'seeders', order = 'desc', limit = 20, page = 1 } = options;

    const params = new URLSearchParams({
        sortBy,
        order,
        limit: limit.toString(),
    });

    if (quality) params.append('quality', quality);

    const url = `${TORRENTS_API_URL}/api/${site}/${encodeURIComponent(query)}/${page}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Search ${site} error:`, error);
        return { site, query, page, total: 0, results: [] };
    }
}

/**
 * Get list of available torrent sites
 */
export async function getSites(): Promise<SitesResponse> {
    try {
        const response = await fetch(`${TORRENTS_API_URL}/api/sites`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Get sites error:', error);
        return { count: 0, sites: [] };
    }
}

/**
 * Search for movies (for content discovery)
 */
export async function searchMovies(query: string, limit = 10) {
    // Search multiple sites and aggregate results
    const response = await searchAllSites(query, {
        sortBy: 'seeders',
        limit,
    });

    // Filter to likely movie content (has seeders, reasonable size)
    return response.results.filter(r =>
        parseInt(r.Seeders) > 0 &&
        r.Magnet
    );
}

/**
 * Get best source for a movie
 */
export async function getBestSource(movieTitle: string) {
    const results = await searchAllSites(movieTitle, {
        sortBy: 'seeders',
        limit: 1,
        quality: '1080p',
    });

    return results.results[0] || null;
}
