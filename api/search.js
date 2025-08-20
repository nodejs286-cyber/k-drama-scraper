import KDramaScraper from '../lib/scraper.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const { q: query, page = 1, source = 'all' } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required and must be at least 2 characters long.',
        example: '/api/search?q=squid+game&page=1&source=all'
      });
    }

    const scraper = new KDramaScraper();
    const pageNum = parseInt(page) || 1;

    let result;

    switch (source.toLowerCase()) {
      case 'dramacool':
        result = await scraper.scrapeFromDramaCool(query, pageNum);
        break;
      case 'kissasian':
        result = await scraper.scrapeFromKissAsian(query, pageNum);
        break;
      case 'all':
      default:
        result = await scraper.scrapeMultipleSources(query, pageNum);
        break;
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to scrape data from the specified source(s).',
        details: result.error
      });
    }

    res.status(200).json({
      success: true,
      query: query,
      page: pageNum,
      source: source,
      total: result.total,
      data: result.data,
      ...(result.sources && { sources: result.sources })
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error occurred while processing your request.',
      message: error.message
    });
  }
}