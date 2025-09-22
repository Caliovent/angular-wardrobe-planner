import axios from 'axios';
import * as cheerio from 'cheerio';

function-declaration
// List of selectors to try for the image URL.
const IMAGE_SELECTORS = [
    'meta[property="og:image"]',
    'meta[property="twitter:image"]',
    'meta[name="twitter:image"]',
    'link[rel="image_src"]'
];

// List of selectors to try for the price.
const PRICE_SELECTORS = [
    { selector: 'meta[property="product:price:amount"]', type: 'attr', attr: 'content' },
    { selector: 'meta[property="og:price:amount"]', type: 'attr', attr: 'content' },
    { selector: '[itemprop="price"]', type: 'attr', attr: 'content' },
    { selector: '[itemprop="price"]', type: 'text' },
    { selector: 'span[itemprop="price"]', type: 'text'},
    { selector: '[class*="price-amount"]', type: 'text' },
    { selector: '[class*="ProductPrice"]', type: 'text' },
    { selector: '.price', type: 'text' },
    { selector: '#price', type: 'text' },
];


export const scrapeProductData = async (url: string): Promise<{ imageUrl?: string; price?: number }> => {
  try {
    const { data } = await axios.get(url, {
        headers: {
            // Using a common user-agent to avoid being blocked
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Connection': 'keep-alive',
        }
    });
    const $ = cheerio.load(data);

    let imageUrl: string | undefined;
    for (const selector of IMAGE_SELECTORS) {
        imageUrl = $(selector).attr('content') || $(selector).attr('href');
        if (imageUrl) break;
    }

    let price: number | undefined;
    let priceString: string | undefined;

    for (const { selector, type, attr } of PRICE_SELECTORS) {
        if (type === 'attr') {
            priceString = $(selector).attr(attr!);
        } else {
            // Look for the text, but filter out irrelevant parent elements to get a more specific price
            priceString = $(selector).first().text();
        }
        if (priceString) {
            // Clean the string and check if it's a valid number
            const cleanedPrice = priceString.trim().replace(/[^0-9.,]/g, '').replace(',', '.');
            if (cleanedPrice && !isNaN(parseFloat(cleanedPrice))) {
                price = parseFloat(cleanedPrice);
                break; // Found a valid price, stop searching
            }
        }
    }

    return { imageUrl, price };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    // Return empty object on failure, as the creation process can continue with defaults
    return {};
  }
};
