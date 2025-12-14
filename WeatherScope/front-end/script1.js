const API_URL = 'http://127.0.0.1:8000/api/v1/';

let weatherHistoryChart = null;
let currentCity = 'London';

async function getWeather(city) {
    try {
        showLoader();
        currentCity = city;
        const units = localStorage.getItem('ws_units') || 'metric';
        document.getElementById('city-name').textContent = 'Завантаження...';
        document.getElementById('temperature').textContent = '';
        document.getElementById('description').textContent = '';
        document.getElementById('weather-icon').src = '';

        const token = localStorage.getItem('token');

        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}weather/?city=${encodeURIComponent(city)}&units=${units}`, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();

        const unitSign = units === 'imperial' ? '°F' : '°C';
        const windUnit = units === 'imperial' ? ' mph' : ' м/с';

        const current = data.current || data;
        document.getElementById('city-name').textContent = current.city;
        document.getElementById('temperature').textContent = current.temp + unitSign;
        document.getElementById('description').textContent = current.description;
        document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${current.icon}@2x.png`;
        document.getElementById('wind').textContent = current.wind_speed + windUnit;
        document.getElementById('humidity').textContent = current.humidity + '%';
        document.getElementById('pressure').textContent = current.pressure + ' гПа';

        if (data.forecast && data.forecast.length > 0) {
            displayForecast(data.forecast, unitSign, windUnit);
        }
        hideLoader()
    } catch (error) {
        Modal.error('Місто не знайдено або сталася помилка при отриманні даних!');
        hideLoader()
    }
}

function displayForecast(forecastData, unitSign, windUnit) {
    const container = document.getElementById('forecast-container');
    if (!container) return;

    container.innerHTML = '';

    forecastData.forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'col-md-3 col-sm-6';
        dayCard.innerHTML = `
            <div class="card text-center h-100">
                <div class="card-body">
                    <h6 class="card-title">${day.day_name}</h6>
                    <p class="text-muted small">${day.date}</p>
                    <img src="http://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" class="img-fluid" style="max-width: 60px;">
                    <p class="text-capitalize small">${day.description}</p>
                    <div class="mb-2">
                        <strong style="font-size: 1.3rem; color: #00b4d8;">${Math.round(day.temp)}${unitSign}</strong>
                    </div>
                    <div class="small text-muted">
                        <div style="color: #f0f0f0; font-weight: 500;">↑ ${Math.round(day.temp_max)}${unitSign} ↓ ${Math.round(day.temp_min)}${unitSign}</div>
                        <div style="color: #f0f0f0; font-weight: 500;">💧 ${day.humidity}%</div>
                        <div style="color: #f0f0f0; font-weight: 500;">💨 ${day.wind_speed}${windUnit}</div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(dayCard);
    });
}

async function loadWeatherHistory(city) {
    const loadingEl = document.getElementById('history-loading');
    const chartContainerEl = document.getElementById('history-chart-container');
    const errorEl = document.getElementById('history-error');

    try {
        loadingEl.style.display = 'block';
        chartContainerEl.style.display = 'none';
        errorEl.style.display = 'none';

        const units = localStorage.getItem('ws_units') || 'metric';
        const response = await fetch(`${API_URL}weather-history/?city=${encodeURIComponent(city)}&units=${units}`);

        if (!response.ok) {
            throw new Error('Failed to fetch weather history');
        }

        const data = await response.json();

        loadingEl.style.display = 'none';
        chartContainerEl.style.display = 'block';

        displayWeatherHistoryChart(data.history, units);
    } catch (error) {
        console.error('Error loading weather history:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.className = 'alert alert-danger';
        errorEl.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Помилка при завантаженні історії погоди';
    }
}

function displayWeatherHistoryChart(historyData, units) {
    const ctx = document.getElementById('weatherHistoryChart');
    if (!ctx) return;

    const unitSign = units === 'imperial' ? '°F' : '°C';

    const labels = historyData.map(day => `${day.day_name.substring(0, 3)}\n${day.date.substring(5)}`);
    const temperatures = historyData.map(day => day.temp);
    const tempMin = historyData.map(day => day.temp_min);
    const tempMax = historyData.map(day => day.temp_max);
    const humidity = historyData.map(day => day.humidity);

    if (weatherHistoryChart) {
        weatherHistoryChart.destroy();
    }

    weatherHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Температура (${unitSign})`,
                    data: temperatures,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: `Мін. температура (${unitSign})`,
                    data: tempMin,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4,
                    borderDash: [5, 5]
                },
                {
                    label: `Макс. температура (${unitSign})`,
                    data: tempMax,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.1)',
                    tension: 0.4,
                    borderDash: [5, 5]
                },
                {
                    label: 'Вологість (%)',
                    data: humidity,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: `Історія погоди - ${currentCity}`,
                    color: '#ffffff',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: `Температура (${unitSign})`,
                        color: '#ffffff'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Вологість (%)',
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('weather-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const city = form.querySelector('input[name="city"]').value.trim();
            if (city) {
                getWeather(city);
            } else {
                Modal.warning('Будь ласка, введіть назву міста.');
            }
        });
    }

    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            if (currentCity && currentCity !== 'London') {
                Like(currentCity);
            } else {
                Modal.warning('Спочатку знайдіть місто!');
            }
        });
    }

    const historyBtn = document.getElementById('load-history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', function() {
            if (currentCity) {
                loadWeatherHistory(currentCity);
            } else {
                Modal.warning('Спочатку виберіть місто');
            }
        });
    }
});
const loader = document.getElementById("weather-loader");
const content = document.getElementById("weather-content");

function showLoader() {
  loader.style.display = "block";
  content.style.display = "none";
}

function hideLoader() {
  loader.style.display = "none";
  content.style.display = "block";
}

document.getElementById("weather-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const city = document.getElementById("city-input").value;
  showLoader();

  // ⏳ імітація API (заміни на свій fetch)
  setTimeout(() => {
    hideLoader();

    document.getElementById("city-name").textContent = city;
    document.getElementById("temperature").textContent = "22°C";
    document.getElementById("description").textContent = "сонячно";
    document.getElementById("weather-icon").src =
      "https://openweathermap.org/img/wn/01d@2x.png";

    document.getElementById("wind").textContent = "3 м/с";
    document.getElementById("humidity").textContent = "55%";
    document.getElementById("pressure").textContent = "1015 hPa";
  }, 1500);
});