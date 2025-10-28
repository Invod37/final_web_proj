
const API_URL = 'http://127.0.0.1:8000/api/v1/weather/';
async function getWeather(city) {
    try {
        const response = await fetch(`${API_URL}?city=${city}`);
        const data = await response.json();
        document.getElementById('city-name').textContent = data.city;
        document.getElementById('temperature').textContent = data.temp + '°C';
        document.getElementById('description').textContent = data.description;
        document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${data.icon}@2x.png`;
        document.getElementById('wind').textContent = data.wind_speed + ' м/с';
        document.getElementById('humidity').textContent = data.humidity + '%';
        document.getElementById('pressure').textContent = data.pressure + ' гПа';

    } catch (error) {
        alert('Місто не знайдено!');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('weather-form');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = form.querySelector('input[name="city"]').value;
        getWeather(city);
    });
});