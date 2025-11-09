const API_URL = 'http://127.0.0.1:8000/api/v1/';

async function getWeather(city) {
    try {
        const units = localStorage.getItem('ws_units') || 'metric';
        document.getElementById('city-name').textContent = 'Завантаження...';
        document.getElementById('temperature').textContent = '';
        document.getElementById('description').textContent = '';
        document.getElementById('weather-icon').src = '';

       const response = await fetch(`${API_URL}weather/?city=${encodeURIComponent(city)}&units=${units}`);
        const data = await response.json();

        const unitSign = units === 'imperial' ? '°F' : '°C';
        const windUnit = units === 'imperial' ? ' mph' : ' м/с';

        document.getElementById('city-name').textContent = data.city;
        document.getElementById('temperature').textContent = data.temp + unitSign;
        document.getElementById('description').textContent = data.description;
        document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${data.icon}@2x.png`;
        document.getElementById('wind').textContent = data.wind_speed + windUnit;
        document.getElementById('humidity').textContent = data.humidity + '%';
        document.getElementById('pressure').textContent = data.pressure + ' гПа';
    } catch (error) {
        alert('Місто не знайдено або сталася помилка при отриманні даних!');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('weather-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = form.querySelector('input[name="city"]').value.trim();
        if (city) {
            getWeather(city);
        } else {
            alert('Будь ласка, введіть назву міста.');
        }
    });
});

