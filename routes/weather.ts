import * as dotenv from 'dotenv';
import express from 'express';
import Weather from '../utils/Weather';
dotenv.config();

const router = express.Router();
const weather = new Weather(process.env.WEATHER_API_KEY!);

router.get('/coordinates/:cityName', async (req, res) => {
  const cityName = req.params.cityName;

  console.log(cityName);
  const coords = await weather.getCoordinatesByCityName(cityName);
  console.log(coords);

  res.status(200).send(coords);
});

router.get('/current/:lat/:lng', async (req, res) => {
  const { lat: latitude, lng: longitude } = req.params;

  const currentWeather = await weather.getCurrentWeatherByLatLng(
    latitude,
    longitude,
  );
  console.log('currentWeather', currentWeather);

  res.status(200).send(currentWeather);
});

router.get('/forecast/:lat/:lng', async (req, res) => {
  const { lat, lng } = req.params;

  const _lat = parseFloat(lat);
  const _lng = parseFloat(lng);
  if (isNaN(_lat) || isNaN(_lng)) {
    res.status(404).send({
      message: 'Weather site not found',
    });
  }

  const latitude = _lat.toFixed(4);
  const longitude = _lng.toFixed(4);

  const weatherForecast = await weather.getWeatherForecastByLatLngWithCache(
    latitude,
    longitude,
  );
  console.log(
    'weatherForecast',
    weatherForecast ? weatherForecast.cod : weatherForecast,
  );

  res.status(200).send(weatherForecast);
});

router.get('/forecast/:cityName', async (req, res) => {
  const cityName = req.params.cityName;

  const weatherForecast = await weather.getWeatherForecastByCityName(cityName);
  console.log(
    'weatherForecast',
    // @ts-ignore
    weatherForecast ? weatherForecast.cod : weatherForecast,
  );

  res.status(200).send(weatherForecast);
});

export default router;
