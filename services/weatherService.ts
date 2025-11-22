import { WeatherData } from '../types';

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

export const getCoordinates = async (location: string): Promise<{ lat: number; lon: number; name: string } | null> => {
  try {
    const url = `${GEOCODING_API}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: `${data.results[0].name}, ${data.results[0].admin1 || data.results[0].country_code}`
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

export const getWeatherData = async (locationName: string): Promise<WeatherData | null> => {
  try {
    // 1. Get Coordinates
    const coords = await getCoordinates(locationName);
    if (!coords) return null;

    // 2. Get Weather
    const params = new URLSearchParams({
      latitude: coords.lat.toString(),
      longitude: coords.lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code',
      timezone: 'auto'
    });

    const response = await fetch(`${WEATHER_API}?${params.toString()}`);
    const data = await response.json();
    const current = data.current;

    return {
      location: coords.name,
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      rainfall: current.rain,
      windSpeed: current.wind_speed_10m,
      condition: getWeatherCondition(current.weather_code)
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
};

// WMO Weather interpretation codes (Open-Meteo)
const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rainy';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
};
