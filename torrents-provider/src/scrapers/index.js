// Export all scrapers
const scrapers = {
    '1337x': require('./1337x'),
    'yts': require('./yts'),
    'eztv': require('./eztv'),
    'tgx': require('./tgx'),
    'torlock': require('./torlock'),
    'piratebay': require('./piratebay'),
    'nyaasi': require('./nyaasi'),
    'rarbg': require('./rarbg'),
    'ettv': require('./ettv'),
    'zooqle': require('./zooqle'),
    'kickass': require('./kickass'),
    'bitsearch': require('./bitsearch'),
    'glodls': require('./glodls'),
    'magnetdl': require('./magnetdl'),
    'limetorrent': require('./limetorrent'),
    'torrentfunk': require('./torrentfunk'),
    'torrentproject': require('./torrentproject')
};

module.exports = scrapers;
