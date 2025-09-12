import axios from 'axios';
import FormData from 'form-data';

export async function removeBackground(imageBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append('image_file', imageBuffer, 'image.jpg');
  formData.append('size', 'auto');

  try {
    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': process.env.BACKGROUND_REMOVAL_API_KEY,
      },
      responseType: 'arraybuffer',
    });

    // The API returns the image data directly. For this implementation,
    // we will convert it to a base64 data URL to be stored and displayed.
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    return `data:image/png;base64,${base64Image}`;

  } catch (error) {
    console.error('Error removing background:', error);
    throw new Error('Failed to remove background from image.');
  }
}
