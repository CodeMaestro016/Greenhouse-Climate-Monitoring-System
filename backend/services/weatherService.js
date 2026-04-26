const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(lat, lon) {
    try {
      if (!this.apiKey) {
        console.warn('Weather API key not configured');
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });
      
      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        weather: response.data.weather[0].main,
        description: response.data.weather[0].description,
        cloudCover: response.data.clouds.all,
        windSpeed: response.data.wind.speed,
        timestamp: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  async getWeatherForecast(lat, lon, hours = 1) {
    try {
      if (!this.apiKey) {
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: Math.ceil(hours / 3)
        }
      });
      
      const nextForecast = response.data.list[0];
      
      return {
        temperature: nextForecast.main.temp,
        humidity: nextForecast.main.humidity,
        weather: nextForecast.weather[0].main,
        cloudCover: nextForecast.clouds.all,
        timestamp: new Date(nextForecast.dt * 1000)
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = new WeatherService();