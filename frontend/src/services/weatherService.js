import axios from 'axios';

const API_KEY = 'f26b2b99e6fb777b80297dc778211b18'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export const fetchWeather = async (lat, lon) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric',
      },
      timeout: 5000, // 5 second timeout
    });
    
    const data = response.data;
    const humidity = data.main.humidity;
    const temp = data.main.temp;
    const condition = data.weather[0].main;

    let risk = 'Low';
    if (humidity > 80) risk = 'High';
    else if (humidity > 60) risk = 'Medium';

    return {
      temp,
      humidity,
      condition,
      risk,
      city: data.name,
      isMock: false
    };
  } catch (error) {
    console.warn('Weather API failed, using mock data:', error.message);
    
    // Return realistic mock data so the app doesn't break
    return {
      temp: 28,
      humidity: 85,
      condition: 'Humid',
      risk: 'High',
      city: 'Simulated Location',
      isMock: true
    };
  }
};
