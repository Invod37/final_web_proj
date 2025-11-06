let currentCity = '';
async function Like(city) {
    if (!city) {
        alert('Спочатку знайдіть місто!');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Потрібно залогінитися');
        return;
    }

    const formData = new FormData();
    formData.append('city_name', city);

    const response = await fetch(`${API_URL}like-city/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const data = await response.json();
    alert(data.message);
    getFavoriteCities();
}

async function getFavoriteCities() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Потрібно залогінитися');
        return;
    }

    const response = await fetch(`${API_URL}favorite-cities/`, {
        headers: {

            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();

    const listDiv = document.getElementById('favorite-cities-list');
    listDiv.innerHTML = '';

    data.forEach(city => {
        listDiv.innerHTML += `<div>${city.city_name}</div>`;
    });
}

document.getElementById('weather-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const city = document.getElementById('city-input').value;
    currentCity = city;
});

document.getElementById('like-btn').addEventListener('click', function() {
    Like(currentCity);
});