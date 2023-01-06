import axios from 'axios';

interface LatLng {
  lat: string;
  lng: string;
}

interface Cache {
  expires: number;
}

interface WeatherForecastCache extends Cache {
  data: any;
}

export default class Weather {
  API_KEY: string;
  UNITS = 'metric';
  LANGUAGE = 'en';
  URL_BASE = 'https://api.openweathermap.org/data/2.5';

  cityNames = new Map<string, LatLng>();
  weatherForecastCache = new Map<string, WeatherForecastCache>();
  // currentWeatherCache = new Map<string, WeatherCache>();

  constructor(apiKey: string) {
    this.API_KEY = apiKey;

    this.cityNames.set('Zakopane', { lat: '49.2969446', lng: '19.950659' });
  }

  setUnits(unit: string) {
    this.UNITS = unit;
  }

  getUnits() {
    return this.UNITS;
  }

  setLanguage(language: string) {
    this.LANGUAGE = language;
  }

  getLanguage() {
    return this.LANGUAGE;
  }

  async prepareURLFetch<T>(url: string) {
    if (this.UNITS) {
      url += `&units=${this.UNITS}`;
    }

    if (this.LANGUAGE) {
      url += `&lang=${this.LANGUAGE}`;
    }

    try {
      const response = await axios.get<T>(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  getCoordinatesByCityName(cityName: string) {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURI(
      cityName,
    )}&appid=${this.API_KEY}`;
    console.log(url);

    return this.prepareURLFetch(url);
  }

  getCurrentByCityName(cityName: string) {
    const url = `${this.URL_BASE}/weather?q=${encodeURI(cityName)}&appid=${
      this.API_KEY
    }`;

    return this.prepareURLFetch(url);
  }

  getCurrentByCityID(cityID: number) {
    const url = `${this.URL_BASE}/weather?id=${encodeURI(
      cityID.toString(),
    )}&appid=${this.API_KEY}`;

    return this.prepareURLFetch(url);
  }

  getCurrentWeatherByLatLng(lat: string, lng: string) {
    const url = `${this.URL_BASE}/weather?lat=${encodeURI(lat)}&lon=${encodeURI(
      lng,
    )}&appid=${this.API_KEY}`;

    return this.prepareURLFetch(url);
  }

  async getWeatherForecastByCityName(cityName: string) {
    console.log(this.weatherForecastCache);

    const latLngs = this.cityNames.get(cityName);

    if (latLngs) {
      const cache = this.weatherForecastCache.get(cityName);
      if (cache && cache.expires > Date.now()) {
        console.log('get from cache');
        return cache.data;
      }

      console.log('get from api');
      const api = await this.getWeatherForecastByLatLng(
        latLngs.lat,
        latLngs.lng,
      );
      if (api) {
        const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
        this.weatherForecastCache.set(cityName, { data: api, expires });
        return api;
      }
    }

    return null;
  }

  getWeatherForecastByLatLng(lat: string, lng: string) {
    const url = `${this.URL_BASE}/forecast?lat=${encodeURI(
      lat,
    )}&lon=${encodeURI(lng)}&appid=${this.API_KEY}`;

    return this.prepareURLFetch(url);
  }

  getOneCallByLatLong(lat: number, long: number) {
    const url = `${this.URL_BASE}/onecall?lat=${encodeURI(
      lat.toString(),
    )}&lon=${encodeURI(long.toString())}&appid=${this.API_KEY}`;

    return this.prepareURLFetch(url);
  }

  celsiusToFahrenheit(temp: number) {
    return temp * (9 / 5) + 32;
  }

  getWeatherIcon(id: number) {
    const url = `https://openweathermap.org/img/wn/${id}@2x.png`;
    return url;
  }
}
