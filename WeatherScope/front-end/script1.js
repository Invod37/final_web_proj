const API_URL = 'http://127.0.0.1:8000/api/v1/';

let weatherHistoryChart = null;
let currentCity = 'London';

async function handleAuthError(response) {
    if (response.status === 401) {
        const shouldReauth = await Modal.confirm(
            'Ваша сесія закінчилася. Будь ласка, увійдіть знову.',
            {
                confirmText: 'Увійти',
                cancelText: 'Скасувати',
                confirmClass: 'primary',
                title: 'Необхідна авторизація'
            }
        );

        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        if (shouldReauth) {
            window.location.href = 'login.html';
        }
        return true;
    }
    return false;
}

async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        await handleAuthError(response);
        throw new Error('Authentication required');
    }

    return response;
}

async function getWeather(city) {
    try {
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

        loadClothesRecommendations(city);
    } catch (error) {
        Modal.error('Місто не знайдено або сталася помилка при отриманні даних!');
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

    const refreshClothesBtn = document.getElementById('refresh-clothes-btn');
    if (refreshClothesBtn) {
        refreshClothesBtn.addEventListener('click', function() {
            if (currentCity) {
                loadClothesRecommendations(currentCity);
            }
        });
    }

    const aiOutfitBtn = document.getElementById('ai-outfit-btn');
    if (aiOutfitBtn) {
        aiOutfitBtn.addEventListener('click', function() {
            if (currentCity) {
                loadAIOutfitAdvice(currentCity);
            }
        });
    }
});

async function loadClothesRecommendations(city) {
    const container = document.getElementById('clothes-recommendations');
    const refreshBtn = document.getElementById('refresh-clothes-btn');
    const aiBtn = document.getElementById('ai-outfit-btn');

    if (!container) return;

    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Завантаження рекомендацій...</p></div>';

    try {
        const token = localStorage.getItem('token');
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            const loginPrompt = document.createElement('div');
            loginPrompt.className = 'col-12 mt-3';
            loginPrompt.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="bi bi-person-plus me-2"></i>
                    <a href="login.html" class="alert-link">Увійдіть</a> або 
                    <a href="add_clothes.html" class="alert-link">додайте свій одяг</a>, 
                    щоб отримати персональні рекомендації
                </div>
            `;
            container.innerHTML = '';
            container.appendChild(loginPrompt);
            return;
        }

        const response = await fetch(`${API_URL}outfit-advice/?city=${encodeURIComponent(city)}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch clothes recommendations');
        }

        const data = await response.json();

        if (refreshBtn) {
            refreshBtn.style.display = 'block';
        }

        if (aiBtn) {
            aiBtn.style.display = 'inline-block';
        }

        if (data.clothes && data.clothes.length > 0) {
            container.innerHTML = '';

            const tempInfo = document.createElement('div');
            tempInfo.className = 'col-12 mb-3';
            tempInfo.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="bi bi-thermometer-half me-2"></i>
                    Поточна температура: <strong>${data.temperature.toFixed(1)}°C</strong>
                    ${token ? ' (показано ваш одяг та загальні рекомендації)' : ' (увійдіть, щоб побачити персональні рекомендації)'}
                </div>
            `;
            container.appendChild(tempInfo);

            data.clothes.forEach(item => {
                const clothesCard = document.createElement('div');
                clothesCard.className = 'col-md-4 col-sm-6';

                const seasonNames = {
                    'winter': 'Зима',
                    'spring': 'Весна',
                    'summer': 'Літо',
                    'autumn': 'Осінь'
                };

                const imageUrl = item.image_url || (item.image ? item.image : (item.img_path ? `/media/${item.img_path}` : null));

                clothesCard.innerHTML = `
                    <div class="card h-100">
                        ${imageUrl ? `
                            <img src="${imageUrl}" class="card-img-top" alt="${item.name}" 
                                 style="height: 200px; object-fit: cover;" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div style="display:none; height: 200px; align-items: center; justify-content: center; background: #f0f0f0;">
                                <i class="bi bi-image" style="font-size: 3rem; color: #ccc;"></i>
                            </div>
                        ` : `
                            <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                                <i class="bi bi-bag" style="font-size: 3rem; color: #ccc;"></i>
                            </div>
                        `}
                        <div class="card-body">
                            <h6 class="card-title">${item.name}</h6>
                            <p class="card-text mb-2">
                                <span class="badge bg-info">${seasonNames[item.season] || item.season}</span>
                                <span class="badge bg-secondary">${item.temperature_min}°${item.unit} - ${item.temperature_max}°${item.unit}</span>
                            </p>
                        </div>
                    </div>
                `;

                container.appendChild(clothesCard);
            });



        } else {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        Немає рекомендацій одягу для температури ${data.temperature.toFixed(1)}°C
                        ${token ? `<br><small class="d-block mt-2"><a href="add_clothes.html" class="alert-link">Додайте свій одяг</a> для цієї температури</small>` : ''}
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading clothes:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Помилка при завантаженні рекомендацій одягу
                </div>
            </div>
        `;
    }
}

async function loadAIOutfitAdvice(city) {
    const container = document.getElementById('clothes-recommendations');
    const refreshBtn = document.getElementById('refresh-clothes-btn');
    const aiBtn = document.getElementById('ai-outfit-btn');

    if (!container) return;

    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-success" role="status"></div><p class="mt-2">AI генерує рекомендації...</p></div>';

    try {
        const token = localStorage.getItem('token');
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}ai-outfit-advice/?city=${encodeURIComponent(city)}`, {
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch AI recommendations');
        }

        const data = await response.json();

        if (refreshBtn) {
            refreshBtn.style.display = 'block';
        }

        if (aiBtn) {
            aiBtn.style.display = 'inline-block';
        }

        container.innerHTML = '';

        const aiRecommendations = document.createElement('div');
        aiRecommendations.className = 'col-12 mb-3';
        aiRecommendations.innerHTML = `
            <div class="card border-success">
                <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="bi bi-robot me-2"></i>AI Рекомендує:</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3" id="ai-recommendations-grid"></div>
                </div>
            </div>
        `;
        container.appendChild(aiRecommendations);

        const aiGrid = document.getElementById('ai-recommendations-grid');
        data.ai_recommendations.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'col-md-4 col-sm-6';
            itemCard.innerHTML = `
                <div class="card h-100">
                    ${item.image_url ? `
                        <img src="${item.image_url}" class="card-img-top" alt="${item.name}" 
                             style="height: 200px; object-fit: cover;" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div style="display:none; height: 200px; align-items: center; justify-content: center; background: #f0f0f0;">
                            <i class="bi bi-image" style="font-size: 3rem; color: #ccc;"></i>
                        </div>
                    ` : `
                        <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                            <i class="bi bi-bag" style="font-size: 3rem; color: #ccc;"></i>
                        </div>
                    `}
                    <div class="card-body">
                        <h6 class="card-title">${item.name}</h6>
                        <span class="badge bg-primary">
                            <i class="bi bi-magic me-1"></i>AI Generated
                        </span>
                    </div>
                </div>
            `;
            aiGrid.appendChild(itemCard);
        });

        if (data.matched_clothes && data.matched_clothes.length > 0) {
            const matchHeader = document.createElement('div');
            matchHeader.className = 'col-12 mb-2 mt-3';
            matchHeader.innerHTML = `
                <h6><i class="bi bi-check-circle-fill text-success me-2"></i>Знайдено збігів у вашому гардеробі: ${data.total_matches}</h6>
            `;
            container.appendChild(matchHeader);

            const seasonNames = {
                'winter': 'Зима',
                'spring': 'Весна',
                'summer': 'Літо',
                'autumn': 'Осінь'
            };

            data.matched_clothes.forEach(item => {
                const clothesCard = document.createElement('div');
                clothesCard.className = 'col-md-4 col-sm-6';

                const imageUrl = item.image_url || (item.image ? item.image : (item.img_path ? `/media/${item.img_path}` : null));

                clothesCard.innerHTML = `
                    <div class="card h-100 border-success">
                        <div class="position-relative">
                            <span class="badge bg-success position-absolute top-0 end-0 m-2" style="z-index: 1;">
                                <i class="bi bi-stars me-1"></i>AI recommended
                            </span>
                            ${imageUrl ? `
                                <img src="${imageUrl}" class="card-img-top" alt="${item.name}" 
                                     style="height: 200px; object-fit: cover;" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div style="display:none; height: 200px; align-items: center; justify-content: center; background: #f0f0f0;">
                                    <i class="bi bi-image" style="font-size: 3rem; color: #ccc;"></i>
                                </div>
                            ` : `
                                <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                                    <i class="bi bi-bag" style="font-size: 3rem; color: #ccc;"></i>
                                </div>
                            `}
                        </div>
                        <div class="card-body">
                            <h6 class="card-title">${item.name} <i class="bi bi-check-circle-fill text-success"></i></h6>
                            <p class="card-text mb-2">
                                <span class="badge bg-info">${seasonNames[item.season] || item.season}</span>
                                <span class="badge bg-secondary">${item.temperature_min}°${item.unit} - ${item.temperature_max}°${item.unit}</span>
                            </p>
                        </div>
                    </div>
                `;

                container.appendChild(clothesCard);
            });
        } else {
            const noMatch = document.createElement('div');
            noMatch.className = 'col-12';
            noMatch.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="bi bi-info-circle me-2"></i>
                    Не знайдено збігів у вашому гардеробі. 
                    <a href="add_clothes.html" class="alert-link">Додайте одяг</a>, який рекомендує AI!
                </div>
            `;
            container.appendChild(noMatch);
        }

    } catch (error) {
        console.error('Error loading AI outfit advice:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Помилка: ${error.message}
                    ${error.message.includes('OPENAI_API_KEY') ? '<br><small>Будь ласка, налаштуйте OPENAI_API_KEY у файлі .env</small>' : ''}
                </div>
            </div>
        `;
    }
}