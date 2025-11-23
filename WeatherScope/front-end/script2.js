async function Like(city) {
    if (!city) {
        Modal.warning('Спочатку знайдіть місто!');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        const shouldLogin = await Modal.confirm('Потрібно залогінитися, щоб додати місто до улюблених', {
            confirmText: 'Увійти',
            cancelText: 'Скасувати',
            confirmClass: 'primary',
            title: 'Необхідна авторизація'
        });

        if (shouldLogin) {
            window.location.href = 'login.html';
        }
        return;
    }

    const formData = new FormData();
    formData.append('city_name', city);

    try {
        const response = await fetch(`${API_URL}like-city/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            Modal.success(data.message);
            getFavoriteCities();
        } else {
            Modal.error(data.error || 'Помилка при додаванні міста');
        }
    } catch (error) {
        Modal.error('Помилка з\'єднання з сервером');
    }
}

async function getFavoriteCities() {
    const token = localStorage.getItem('token');
    const listDiv = document.getElementById('favorite-cities-list');
    const emptyDiv = document.getElementById('favorite-cities-empty');

    if (!token) {
        if (listDiv) {
            listDiv.innerHTML = '<div class="col-12 text-center text-muted"><p>Увійдіть, щоб побачити улюблені міста</p></div>';
        }
        return;
    }

    try {
        const response = await fetch(`${API_URL}favorite-cities/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch favorite cities');
        }

        const data = await response.json();

        if (!listDiv) return;

        if (data.length === 0) {
            listDiv.innerHTML = '<div class="col-12 text-center text-muted"><p>У вас ще немає улюблених міст. Додайте місто, натиснувши ❤️</p></div>';
            return;
        }

        const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

        listDiv.innerHTML = '';

        data.forEach(city => {
            const cityCard = document.createElement('div');
            cityCard.className = isIndexPage ? 'col-md-3 col-sm-6' : 'col-md-4 col-sm-6';

            cityCard.innerHTML = `
                <div class="card h-100 ${isIndexPage ? 'favorite-city-clickable' : ''}" ${isIndexPage ? `onclick="loadCityWeather('${city.city_name}')"` : ''}>
                    <div class="card-body text-center">
                        <h6 class="card-title text-primary">${city.city_name}</h6>
                        <i class="bi bi-geo-alt-fill text-info" style="font-size: 2rem;"></i>
                        ${!isIndexPage ? `
                        <div class="mt-3">
                            <button class="btn btn-sm btn-danger" onclick="deleteFavoriteCity(${city.id}, '${city.city_name}')">
                                <i class="bi bi-trash me-1"></i>Видалити
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            listDiv.appendChild(cityCard);
        });
    } catch (error) {
        console.error('Error fetching favorite cities:', error);
        if (listDiv) {
            listDiv.innerHTML = '<div class="col-12 text-center text-danger"><p>Помилка завантаження улюблених міст</p></div>';
        }
    }
}

async function deleteFavoriteCity(cityId, cityName) {
    const confirmed = await Modal.confirm(`Ви впевнені, що хочете видалити "${cityName}" з улюблених?`, {
        confirmText: 'Видалити',
        cancelText: 'Скасувати',
        confirmClass: 'danger',
        title: 'Підтвердження видалення'
    });

    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) {
        Modal.error('Потрібно залогінитися');
        return;
    }

    try {
        const response = await fetch(`${API_URL}favorite-cities/${cityId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            Modal.success('Місто видалено з улюблених');
            getFavoriteCities();
        } else {
            const data = await response.json();
            Modal.error(data.error || 'Помилка при видаленні міста');
        }
    } catch (error) {
        Modal.error('Помилка з\'єднання з сервером');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    getFavoriteCities();
});

function loadCityWeather(cityName) {
    const cityInput = document.getElementById('city-input');
    if (cityInput) {
        cityInput.value = cityName;
    }

    if (typeof getWeather === 'function') {
        getWeather(cityName);

        const weatherCard = document.querySelector('.card');
        if (weatherCard) {
            weatherCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
