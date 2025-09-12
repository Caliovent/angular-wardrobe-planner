import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeProductData = async (url: string): Promise<{ imageUrl?: string; price?: number }> => {
  try {
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const $ = cheerio.load(data);

    const imageUrl = $('meta[property="og:image"]').attr('content');

    let price: number | undefined;

    const priceString =
      $('meta[property="product:price:amount"]').attr('content') ||
      $('[itemprop="price"]').attr('content') ||
      $('.price').text();

    if (priceString) {
        const cleanedPrice = priceString.replace(/[^0-9.,]/g, '').replace(',', '.');
        price = parseFloat(cleanedPrice);
    }

    return { imageUrl, price };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return {};
  }
};
