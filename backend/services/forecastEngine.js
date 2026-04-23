class ForecastEngine {
  constructor() {
    // Weight distribution
    this.historyWeight = 0.5;
    this.currentWeight = 0.3;
    this.weatherWeight = 0.2;
  }

  calculateTrend(history) {
    if (!history || history.length < 2) return 0;
    
    const recent = history.slice(-6);
    if (recent.length < 2) return 0;
    
    const n = recent.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recent[i];
      sumXY += i * recent[i];
      sumXX += i * i;
    }
    
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return 0;
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    return Math.min(Math.max(slope, -3), 3);
  }

  calculateAverage(history) {
    if (!history || history.length === 0) return 0;
    const sum = history.reduce((a, b) => a + b, 0);
    return sum / history.length;
  }

  predictTemperature(currentTemp, history, weather, forecast) {
    if (currentTemp === undefined || currentTemp === null || typeof currentTemp !== 'number') {
      return { current: 0, predicted: 0, trend: 'stable', change: '0.0', reason: 'No temperature data available' };
    }
    
    const trend = this.calculateTrend(history);
    const avgTemp = this.calculateAverage(history);
    const historyPrediction = avgTemp + (trend * 0.5);
    const currentPrediction = currentTemp;
    
    let weatherPrediction = currentTemp;
    let reason = '';
    
    if (weather && weather.temperature) {
      if (forecast && forecast.temperature) {
        const weatherDiff = forecast.temperature - currentTemp;
        weatherPrediction = currentTemp + (weatherDiff * 0.3);
        reason = weatherDiff > 0 ? 'Weather forecast shows warming' : 'Weather forecast shows cooling';
      } else if (weather.temperature > currentTemp + 2) {
        weatherPrediction = currentTemp + 1.5;
        reason = 'Hot outside air affecting greenhouse';
      } else if (weather.temperature < currentTemp - 2) {
        weatherPrediction = currentTemp - 1;
        reason = 'Cold outside air lowering temperature';
      } else {
        weatherPrediction = currentTemp;
        reason = 'Outside temperature similar to greenhouse';
      }
    } else {
      weatherPrediction = currentTemp;
      reason = 'No weather data available';
    }
    
    let predicted = (historyPrediction * this.historyWeight) + 
                    (currentPrediction * this.currentWeight) + 
                    (weatherPrediction * this.weatherWeight);
    
    let change = predicted - currentTemp;
    change = Math.min(Math.max(change, -2.5), 2.5);
    predicted = currentTemp + change;
    
    const trendDirection = Math.abs(change) < 0.3 ? 'stable' : (change > 0 ? 'up' : 'down');
    
    return {
      current: Number(currentTemp.toFixed(1)),
      predicted: Number(predicted.toFixed(1)),
      trend: trendDirection,
      change: `${change > 0 ? '+' : ''}${change.toFixed(1)}`,
      reason
    };
  }

  predictHumidity(currentHumidity, history, weather, forecast) {
    if (currentHumidity === undefined || currentHumidity === null || typeof currentHumidity !== 'number') {
      return { current: 0, predicted: 0, trend: 'stable', change: '0.0', reason: 'No humidity data available' };
    }
    
    const trend = this.calculateTrend(history);
    const avgHumidity = this.calculateAverage(history);
    const historyPrediction = avgHumidity + (trend * 0.3);
    const currentPrediction = currentHumidity;
    
    let weatherPrediction = currentHumidity;
    let reason = '';
    
    if (weather && weather.humidity) {
      if (forecast && forecast.humidity) {
        const weatherDiff = forecast.humidity - currentHumidity;
        weatherPrediction = currentHumidity + (weatherDiff * 0.25);
        reason = weatherDiff > 5 ? 'Rain expected to increase humidity' : 'Weather forecast shows stable humidity';
      } else if (weather.humidity > 85) {
        weatherPrediction = currentHumidity + 3;
        reason = 'High outside humidity increasing moisture';
      } else if (weather.humidity < 40) {
        weatherPrediction = currentHumidity - 2;
        reason = 'Dry outside air decreasing humidity';
      } else if (weather.weather === 'Rain') {
        weatherPrediction = currentHumidity + 5;
        reason = 'Rainfall increasing humidity';
      } else {
        weatherPrediction = currentHumidity;
        reason = 'Outside humidity stable';
      }
    } else {
      weatherPrediction = currentHumidity;
      reason = 'Based on greenhouse patterns only';
    }
    
    let predicted = (historyPrediction * this.historyWeight) + 
                    (currentPrediction * this.currentWeight) + 
                    (weatherPrediction * this.weatherWeight);
    
    let change = predicted - currentHumidity;
    change = Math.min(Math.max(change, -5), 5);
    predicted = currentHumidity + change;
    predicted = Math.min(100, Math.max(0, predicted));
    
    const trendDirection = Math.abs(change) < 1 ? 'stable' : (change > 0 ? 'up' : 'down');
    
    return {
      current: Number(currentHumidity.toFixed(1)),
      predicted: Number(predicted.toFixed(1)),
      trend: trendDirection,
      change: `${change > 0 ? '+' : ''}${change.toFixed(1)}`,
      reason
    };
  }

  predictLight(currentLight, history, weather, forecast) {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    const defaultLight = isDaytime ? 8000 : 50;
    
    let validLight = null;
    
    if (currentLight !== null && typeof currentLight === 'number' && !isNaN(currentLight)) {
      validLight = currentLight;
    } 
    else if (history && history.length > 0) {
      validLight = history[history.length - 1];
    }
    
    if (validLight === null) {
      return {
        current: defaultLight,
        predicted: defaultLight,
        trend: 'stable',
        change: '0.0',
        reason: isDaytime ? 'No light data - using daytime estimate' : 'No light data - using nighttime estimate'
      };
    }
    
    let predicted = validLight;
    let change = 0;
    let reason = 'Stable light conditions expected';
    
    if (isDaytime && validLight < 1000) {
      predicted = validLight * 1.1;
      change = predicted - validLight;
      reason = 'Daytime - light may increase';
    } else if (!isDaytime && validLight > 100) {
      predicted = Math.max(50, validLight * 0.5);
      change = predicted - validLight;
      reason = 'Nighttime - light decreasing';
    } else if (history && history.length >= 2) {
      const trend = this.calculateTrend(history);
      predicted = validLight + (trend * 0.3);
      change = predicted - validLight;
      reason = 'Based on recent light trends';
    }
    
    const trendDirection = change > 0 ? 'up' : (change < 0 ? 'down' : 'stable');
    
    return {
      current: Number(validLight.toFixed(1)),
      predicted: Number(predicted.toFixed(1)),
      trend: trendDirection,
      change: `${change > 0 ? '+' : ''}${change.toFixed(1)}`,
      reason
    };
  }

  predictSoilMoisture(currentSoil, history, weather) {
    if (currentSoil === undefined || currentSoil === null || typeof currentSoil !== 'number') {
      return { current: 0, predicted: 0, trend: 'stable', change: '0.0', reason: 'No soil data available' };
    }
    
    const soilHistoryWeight = 0.8;
    const soilCurrentWeight = 0.15;
    const soilWeatherWeight = 0.05;
    
    const trend = this.calculateTrend(history);
    const avgSoil = this.calculateAverage(history);
    const historyPrediction = avgSoil + (trend * 0.1);
    const currentPrediction = currentSoil;
    
    let weatherPrediction = currentSoil;
    let reason = '';
    
    if (weather) {
      if (weather.weather === 'Rain' && weather.humidity > 80) {
        weatherPrediction = currentSoil + 1;
        reason = 'Rain may slightly increase soil moisture';
      } else if (weather.temperature > 32 && weather.humidity < 40) {
        weatherPrediction = currentSoil - 0.5;
        reason = 'Hot, dry conditions increase evaporation';
      } else {
        reason = 'Soil moisture primarily from irrigation';
      }
    } else {
      reason = 'Based on greenhouse patterns';
    }
    
    let predicted = (historyPrediction * soilHistoryWeight) + 
                    (currentPrediction * soilCurrentWeight) + 
                    (weatherPrediction * soilWeatherWeight);
    
    let change = predicted - currentSoil;
    change = Math.min(Math.max(change, -1.5), 1.5);
    predicted = currentSoil + change;
    predicted = Math.min(100, Math.max(0, predicted));
    
    const trendDirection = Math.abs(change) < 0.3 ? 'stable' : (change > 0 ? 'up' : 'down');
    
    return {
      current: Number(currentSoil.toFixed(1)),
      predicted: Number(predicted.toFixed(1)),
      trend: trendDirection,
      change: `${change > 0 ? '+' : ''}${change.toFixed(1)}`,
      reason
    };
  }

  predictAirQuality(currentAir, history, weather) {
    if (currentAir === undefined || currentAir === null || typeof currentAir !== 'number') {
      return { current: 0, predicted: 0, trend: 'stable', change: '0.0', reason: 'No air quality data available' };
    }
    
    const trend = this.calculateTrend(history);
    const avgAir = this.calculateAverage(history);
    const historyPrediction = avgAir + (trend * 0.3);
    const currentPrediction = currentAir;
    
    let weatherPrediction = currentAir;
    let reason = '';
    
    if (weather) {
      if (weather.windSpeed > 10) {
        weatherPrediction = currentAir - 15;
        reason = 'Strong winds improving air circulation';
      } else if (weather.weather === 'Smoke' || weather.weather === 'Haze') {
        weatherPrediction = currentAir + 20;
        reason = 'Outside pollution affecting air quality';
      } else if (weather.humidity > 80) {
        weatherPrediction = currentAir + 5;
        reason = 'High humidity affecting air quality';
      } else {
        weatherPrediction = currentAir;
        reason = 'Weather conditions stable';
      }
    } else {
      weatherPrediction = currentAir;
      reason = 'Based on greenhouse patterns';
    }
    
    let predicted = (historyPrediction * this.historyWeight) + 
                    (currentPrediction * this.currentWeight) + 
                    (weatherPrediction * this.weatherWeight);
    
    let change = predicted - currentAir;
    change = Math.min(Math.max(change, -20), 20);
    predicted = Math.max(0, currentAir + change);
    
    const trendDirection = Math.abs(change) < 3 ? 'stable' : (change > 0 ? 'up' : 'down');
    
    return {
      current: Number(currentAir.toFixed(1)),
      predicted: Number(predicted.toFixed(1)),
      trend: trendDirection,
      change: `${change > 0 ? '+' : ''}${change.toFixed(1)}`,
      reason
    };
  }
}

module.exports = new ForecastEngine();