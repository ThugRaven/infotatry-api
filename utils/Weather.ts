import axios from 'axios';

export default class Weather {
  API_KEY: string;
  UNITS = 'metric';
  LANGUAGE = 'en';
  URL_BASE = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.API_KEY = apiKey;
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
