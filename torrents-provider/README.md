# WatchParty Torrents Provider

A custom Torrents API for the WatchParty application. Scrapes 17 torrent sites to provide content sources.

## Features

- ✅ **17 Torrent Sites** - PirateBay, YTS, 1337x, EZTV, Nyaa.si, TorrentGalaxy, and more
- ✅ **Search All Sites** - Single endpoint to search across all sites
- ✅ **Quality Filtering** - Filter by 720p, 1080p, 4K
- ✅ **Smart Sorting** - Sort by seeders, size, date
- ✅ **Rate Limiting** - 100 req/min per IP
- ✅ **CORS Enabled** - Ready for frontend integration

## Quick Start

```bash
npm install
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/sites` | List all sites |
| `GET /api/:site/:query/:page?` | Search specific site |
| `GET /api/all/:query/:page?` | Search all sites |

### Query Parameters

- `?quality=1080p` - Filter by quality
- `?sortBy=seeders` - Sort by seeders/size/date
- `?order=desc` - Sort order
- `?limit=20` - Limit results

### Examples

```bash
# Search PirateBay
/api/piratebay/Zootopia%202?sortBy=seeders&limit=5

# Search all sites
/api/all/Avengers?quality=1080p&sortBy=seeders
```

## Supported Sites

| Site | ID | Status |
|------|-----|--------|
| PirateBay | `piratebay` | ✅ Working |
| YTS | `yts` | ✅ Working |
| 1337x | `1337x` | ✅ Working |
| EZTV | `eztv` | ✅ Working |
| TorrentGalaxy | `tgx` | ✅ Working |
| Nyaa.si | `nyaasi` | ✅ Working |
| KickAss | `kickass` | ✅ Working |
| BitSearch | `bitsearch` | ✅ Working |
| GLODLS | `glodls` | ✅ Working |
| MagnetDL | `magnetdl` | ✅ Working |
| LimeTorrent | `limetorrent` | ✅ Working |
| TorrentFunk | `torrentfunk` | ✅ Working |
| TorrentProject | `torrentproject` | ✅ Working |
| Torlock | `torlock` | ✅ Working |
| ETTV | `ettv` | ✅ Working |
| RARBG | `rarbg` | ❌ Offline |
| Zooqle | `zooqle` | ❌ Offline |

## Frontend Integration

```javascript
// Search for movies
const response = await fetch(
  'http://localhost:3001/api/piratebay/movie%20name?sortBy=seeders&limit=10'
);
const data = await response.json();
console.log(data.results[0].Magnet);
```

## License

MIT
