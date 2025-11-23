window.currentCity ??= 'London';

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

        if (!response.ok) throw new Error('Failed to fetch favorite cities');

        const data = await response.json();
        listDiv.innerHTML = '';

        data.forEach(city => {
            listDiv.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card bg-dark text-white">
                        <div class="card-body">
                            <h5>${city.city_name}</h5>
                            <button class="btn btn-danger btn-sm" onclick="DeleteFavouriteCities(${city.id})">
                                Видалити
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        if (listDiv) {
            listDiv.innerHTML =
                '<p class="text-danger text-center">Помилка завантаження списку</p>';
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

        const data = await response.json();

        alert(data.message);
        getFavoriteCities();

    } catch (error) {
        alert('Error');
        console.error(error);
    }
}

const form = document.getElementById('weather-form');
const like = document.getElementById('like-btn');

document.addEventListener('submit', async function (e) {
    if (e.target === form) {
        e.preventDefault();
        const city = document.getElementById('city-input').value;
        currentCity = city;
    }
});


document.addEventListener('DOMContentLoaded', function () {
    getFavoriteCities();
});


if (like) {
    like.addEventListener('click', function () {
        Like(currentCity);
    });
}
