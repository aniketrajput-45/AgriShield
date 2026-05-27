import axios from 'axios';
import { CONFIG } from '../config';

export const analyzeImage = async (imageUri, weatherContext = '', selectedCrop = 'Tomato') => {
  const formData = new FormData();
  
  // Format the image for upload
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('file', { uri: imageUri, name: filename, type });
  
  if (weatherContext) {
    formData.append('weather', weatherContext);
  }

  if (selectedCrop) {
    formData.append('crop', selectedCrop);
  }

  try {
    const response = await axios.post(`${CONFIG.API_BASE_URL}/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error) {
    console.error('Diagnosis Error:', error);
    throw error;
  }
};
