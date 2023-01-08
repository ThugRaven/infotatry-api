import axios from 'axios';
import features from '../features.json';
import Cache from './Cache';
import { useCacheAndCallApi } from './utils';
import { WeatherForecastResponse } from './weather-types';

interface LatLng {
  lat: string;
  lng: string;
}

export default class Weather {
  API_KEY: string;
  UNITS = 'metric';
  LANGUAGE = 'en';
  URL_BASE = 'https://api.openweathermap.org/data/2.5';

  cityNames = new Map<string, LatLng>();
  weatherForecastCache = new Cache<WeatherForecastResponse>();
  weatherSites = new Map<string, LatLng>();

  constructor(apiKey: string) {
    this.API_KEY = apiKey;

    this.cityNames.set('Zakopane', { lat: '49.2969', lng: '19.9507' });
    features.nodes.forEach((node) => {
      this.weatherSites.set(node.name.trim().toLowerCase(), {
        lat: node.lat.toFixed(4),
        lng: node.lng.toFixed(4),
      });
    });
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
      const data = await useCacheAndCallApi(
        this.weatherForecastCache,
        cityName,
        () => this.getWeatherForecastByLatLng(latLngs.lat, latLngs.lng),
      );
      return data;
    }

    return null;
  }

  async getWeatherForecastByLatLngWithCache(lat: string, lng: string) {
    console.log(this.weatherForecastCache);

    const data = await useCacheAndCallApi(
      this.weatherForecastCache,
      `${lat}-${lng}`,
      () => this.getWeatherForecastByLatLng(lat, lng),
    );

    return data;
  }

  async getWeatherForecastByWeatherSite(weatherSite: string) {
    console.log(this.weatherForecastCache);

    weatherSite = weatherSite.trim().toLowerCase();
    const _weatherSite = this.weatherSites.get(weatherSite);

    if (_weatherSite) {
      const data = await useCacheAndCallApi(
        this.weatherForecastCache,
        weatherSite,
        () =>
          this.getWeatherForecastByLatLng(_weatherSite.lat, _weatherSite.lng),
      );
      return data;
    }

    return null;
  }

  async getWeatherForecastByLatLng<T>(lat: string, lng: string) {
    const url = `${this.URL_BASE}/forecast?lat=${encodeURI(
      lat,
    )}&lon=${encodeURI(lng)}&appid=${this.API_KEY}`;

    return await this.prepareURLFetch<T>(url);
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
