window.currentCity ??= 'London';

let isLoadingFavorites = false;

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
            return;
        }

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

    if (!token) {
        if (listDiv) {
            listDiv.innerHTML =
                '<div class="col-12 text-center text-muted"><p>Увійдіть, щоб побачити улюблені міста</p></div>';
        }
        return;
    }

    try {
        const response = await fetch(`${API_URL}favorite-cities/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

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
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch favorite cities');

        const data = await response.json();
        listDiv.innerHTML = '';

        data.forEach(city => {
            const cityCard = document.createElement('div');
            cityCard.className = 'col-md-4 mb-3';
            cityCard.innerHTML = `
                <div class="card bg-dark text-white h-100">
                    <div class="card-body">
                        <h5 class="city-name-clickable" 
                            style="cursor: pointer; color: #6EC1E4; transition: color 0.3s, transform 0.2s;" 
                            data-city="${city.city_name}"
                            title="Клікніть, щоб переглянути погоду"
                            onmouseover="this.style.color='#48ABD8'; this.style.transform='scale(1.05)';"
                            onmouseout="this.style.color='#6EC1E4'; this.style.transform='scale(1)';">
                            <i class="bi bi-geo-alt-fill me-2"></i>${city.city_name}
                        </h5>
                        <button class="btn btn-danger btn-sm mt-2" onclick="DeleteFavouriteCities(${city.id})">
                            <i class="bi bi-trash me-1"></i>Видалити
                        </button>
                    </div>
                </div>
            `;
            listDiv.appendChild(cityCard);

            const cityNameEl = cityCard.querySelector('.city-name-clickable');
            cityNameEl.addEventListener('click', function() {
                const cityName = this.getAttribute('data-city');
                getWeather(cityName);
                const cityInput = document.getElementById('city-input');
                if (cityInput) {
                    cityInput.value = cityName;
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

    } catch (error) {
        console.error(error);
        if (listDiv) {
            listDiv.innerHTML = '';
        }
    }
}
async function DeleteFavouriteCities(cityId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You need login");
        return;
    }

    try {
        const response = await fetch(`${API_URL}favorite-cities/${cityId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

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
            return;
        }

        const data = await response.json();

        alert(data.message);
        getFavoriteCities();

    } catch (error) {
        alert('Error');
        console.error(error);
    }
}


document.addEventListener('DOMContentLoaded', function () {
    getFavoriteCities();
});


