let currentCity = '';
async function Like(city) {
    if (!city) {
        currentCity = city;
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
}
async function DeleteFavouriteCities(cityId){
    const token = localStorage.getItem('token');
    if (!token){
        alert("You need login")
    }
    try {
        const response = await fetch(`${API_URL}favorite-cities/${cityId}/`,{
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        alert(data.message);
        getFavoriteCities();
    }catch(error){
          alert('Error ');
          console.error(error);
        }
}
const form = document.getElementById('weather-form')
const like = document.getElementById('like-btn')
document.addEventListener('submit', async function(e) {
    if (form){
       e.preventDefault();
       const city = document.getElementById('city-input').value;
       currentCity = city;
    }
});

like.addEventListener('click', function() {
    if(like){
        Like(currentCity);
    }

});