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

  const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000';

  res.status(200).json({
    success: true,
    message: 'K-Drama Scraper API',
    version: '1.0.0',
    endpoints: {
      search: {
        url: `${baseUrl}/api/search`,
        method: 'GET',
        description: 'Search for K-dramas',
        parameters: {
          q: 'Search query (required, min 2 characters)',
          page: 'Page number (optional, default: 1)',
          source: 'Source to scrape (optional: all, dramacool, kissasian, default: all)'
        },
        example: `${baseUrl}/api/search?q=squid+game&page=1&source=all`
      },
      recent: {
        url: `${baseUrl}/api/recent`,
        method: 'GET',
        description: 'Get recently added K-dramas',
        parameters: {
          page: 'Page number (optional, default: 1, max: 50)',
          source: 'Source to scrape (optional: all, dramacool, kissasian, default: all)'
        },
        example: `${baseUrl}/api/recent?page=1&source=all`
      },
      details: {
        url: `${baseUrl}/api/details`,
        method: 'GET',
        description: 'Get detailed information about a specific drama',
        parameters: {
          url: 'Full URL to the drama page (required)',
          source: 'Source identifier (optional, default: auto)'
        },
        example: `${baseUrl}/api/details?url=https://dramacool.pa/drama-detail/squid-game`
      }
    },
    sources: [
      'DramaCool (dramacool.pa)',
      'KissAsian (kissasian.lu)'
    ],
    documentation: `${baseUrl}/`,
    repository: 'https://github.com/your-username/kdrama-scraper-api',
    note: 'This API is for educational purposes only. Please respect the terms of service of the scraped websites.'
  });
}