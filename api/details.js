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
    const { url, source = 'auto' } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required.',
        example: '/api/details?url=https://dramacool.pa/drama-detail/squid-game'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format provided.'
      });
    }

    const scraper = new KDramaScraper();
    const result = await scraper.getDramaDetails(url, source);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch drama details.',
        details: result.error
      });
    }

    res.status(200).json({
      success: true,
      url: url,
      source: source,
      data: result.data
    });

  } catch (error) {
    console.error('Details API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error occurred while fetching drama details.',
      message: error.message
    });
  }
}