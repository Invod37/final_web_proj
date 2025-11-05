let currentCity = '';
async function Like(city) {
    if (!city) {
        alert('Спочатку знайдіть місто!');
        return;
    }

    const response = await fetch('http://127.0.0.1:8000/api/v1/like_city/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_name: city })
    });

    const data = await response.json();
    alert(data.message);
    getFavoriteCities();
}
async function getFavoriteCities() {
    const response = await fetch('http://127.0.0.1:8000/api/v1/favorite-cities/');
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