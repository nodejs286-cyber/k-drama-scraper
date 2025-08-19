import KDramaScraper from '../lib/scraper.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    const { page = 1, source = 'all' } = req.query;
    const pageNum = parseInt(page) || 1;

    if (pageNum < 1 || pageNum > 50) {
      return res.status(400).json({
        success: false,
        error: 'Page number must be between 1 and 50.',
        example: '/api/recent?page=1&source=all'
      });
    }

    const scraper = new KDramaScraper();
    let result;

    switch (source.toLowerCase()) {
      case 'dramacool':
        result = await scraper.scrapeFromDramaCool('', pageNum);
        break;
      case 'kissasian':
        result = await scraper.scrapeFromKissAsian('', pageNum);
        break;
      case 'all':
      default:
        result = await scraper.scrapeMultipleSources('', pageNum);
        break;
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to scrape recent dramas from the specified source(s).',
        details: result.error
      });
    }

    res.status(200).json({
      success: true,
      page: pageNum,
      source: source,
      total: result.total,
      data: result.data,
      ...(result.sources && { sources: result.sources })
    });

  } catch (error) {
    console.error('Recent API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error occurred while fetching recent dramas.',
      message: error.message
    });
  }
}