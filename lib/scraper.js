import axios from 'axios';
import { parse } from 'node-html-parser';

class KDramaScraper {
  constructor() {
    this.userAgent = process.env.USER_AGENT || 
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    this.axiosConfig = {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
    };
  }

  async scrapeFromDramaCool(query = '', page = 1) {
    try {
      const searchUrl = query 
        ? `https://dramacool.pa/search?keyword=${encodeURIComponent(query)}`
        : `https://dramacool.pa/recently-added?page=${page}`;

      const response = await axios.get(searchUrl, this.axiosConfig);
      const root = parse(response.data);

      const dramas = [];
      const dramaElements = root.querySelectorAll('.list-episode-item');

      dramaElements.forEach(element => {
        try {
          const titleElement = element.querySelector('.episode-title a');
          const imageElement = element.querySelector('img');
          const episodeElement = element.querySelector('.episode-number');

          if (titleElement) {
            const drama = {
              title: titleElement.text.trim(),
              url: titleElement.getAttribute('href'),
              image: imageElement ? imageElement.getAttribute('src') : null,
              episode: episodeElement ? episodeElement.text.trim() : null,
              source: 'DramaCool'
            };

            // Clean up the URL if it's relative
            if (drama.url && drama.url.startsWith('/')) {
              drama.url = `https://dramacool.pa${drama.url}`;
            }

            dramas.push(drama);
          }
        } catch (itemError) {
          console.warn('Error parsing drama item:', itemError.message);
        }
      });

      return {
        success: true,
        data: dramas,
        total: dramas.length,
        page: page,
        source: 'DramaCool'
      };

    } catch (error) {
      console.error('DramaCool scraping error:', error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'DramaCool'
      };
    }
  }

  async scrapeFromKissAsian(query = '', page = 1) {
    try {
      const searchUrl = query 
        ? `https://kissasian.lu/Search/?s=${encodeURIComponent(query)}`
        : `https://kissasian.lu/Drama/List?page=${page}`;

      const response = await axios.get(searchUrl, this.axiosConfig);
      const root = parse(response.data);

      const dramas = [];
      const dramaElements = root.querySelectorAll('.listing tr');

      dramaElements.forEach(element => {
        try {
          const titleElement = element.querySelector('td:first-child a');
          const genreElement = element.querySelector('td:nth-child(2)');
          const statusElement = element.querySelector('td:nth-child(3)');

          if (titleElement) {
            const drama = {
              title: titleElement.text.trim(),
              url: titleElement.getAttribute('href'),
              genre: genreElement ? genreElement.text.trim() : null,
              status: statusElement ? statusElement.text.trim() : null,
              source: 'KissAsian'
            };

            // Clean up the URL if it's relative
            if (drama.url && drama.url.startsWith('/')) {
              drama.url = `https://kissasian.lu${drama.url}`;
            }

            dramas.push(drama);
          }
        } catch (itemError) {
          console.warn('Error parsing drama item:', itemError.message);
        }
      });

      return {
        success: true,
        data: dramas,
        total: dramas.length,
        page: page,
        source: 'KissAsian'
      };

    } catch (error) {
      console.error('KissAsian scraping error:', error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'KissAsian'
      };
    }
  }

  async scrapeMultipleSources(query = '', page = 1) {
    try {
      const promises = [
        this.scrapeFromDramaCool(query, page),
        this.scrapeFromKissAsian(query, page)
      ];

      const results = await Promise.allSettled(promises);
      
      const combinedData = [];
      const sourceResults = {};

      results.forEach((result, index) => {
        const sourceName = index === 0 ? 'DramaCool' : 'KissAsian';
        
        if (result.status === 'fulfilled' && result.value.success) {
          combinedData.push(...result.value.data);
          sourceResults[sourceName] = {
            success: true,
            count: result.value.data.length
          };
        } else {
          sourceResults[sourceName] = {
            success: false,
            error: result.reason || result.value?.error || 'Unknown error'
          };
        }
      });

      return {
        success: true,
        data: combinedData,
        total: combinedData.length,
        page: page,
        sources: sourceResults,
        query: query
      };

    } catch (error) {
      console.error('Multi-source scraping error:', error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        sources: {},
        query: query
      };
    }
  }

  async getDramaDetails(url, source = 'auto') {
    try {
      const response = await axios.get(url, this.axiosConfig);
      const root = parse(response.data);

      let details = {
        url: url,
        source: source
      };

      // Try to extract common details
      const titleElement = root.querySelector('h1, .title, .drama-title, .movie-title');
      const descriptionElement = root.querySelector('.description, .summary, .plot, .synopsis');
      const imageElement = root.querySelector('.poster img, .drama-image img, img[alt*="poster"]');
      const genreElements = root.querySelectorAll('.genre a, .genres a, [class*="genre"] a');
      const yearElement = root.querySelector('.year, .release-date, [class*="year"]');

      if (titleElement) details.title = titleElement.text.trim();
      if (descriptionElement) details.description = descriptionElement.text.trim();
      if (imageElement) details.image = imageElement.getAttribute('src');
      if (yearElement) details.year = yearElement.text.trim();

      if (genreElements.length > 0) {
        details.genres = Array.from(genreElements).map(el => el.text.trim());
      }

      return {
        success: true,
        data: details
      };

    } catch (error) {
      console.error('Drama details scraping error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

export default KDramaScraper;