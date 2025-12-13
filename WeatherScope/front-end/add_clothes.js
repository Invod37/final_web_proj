const API_URL = 'http://127.0.0.1:8000/api/v1/';

document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndLoadClothes();
    
    const form = document.getElementById('add-clothes-form');
    if (form) {
        form.addEventListener('submit', handleAddClothes);
    }
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadUserClothes);
    }
});

function checkAuthAndLoadClothes() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById('clothes-list').innerHTML = `
            <div class="text-center text-muted">
                <p>Увійдіть, щоб додавати та переглядати свій одяг</p>
                <a href="login.html" class="btn btn-primary mt-2">Увійти</a>
            </div>
        `;
        return;
    }
    loadUserClothes();
}

async function handleAddClothes(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        const shouldLogin = await Modal.confirm('Потрібно залогінитися, щоб додати одяг', {
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
    
    const tempMin = parseFloat(document.getElementById('temperature_min').value);
    const tempMax = parseFloat(document.getElementById('temperature_max').value);

    if (tempMin >= tempMax) {
        Modal.error('Мінімальна температура повинна бути менше максимальної');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('season', document.getElementById('season').value);
    formData.append('temperature_min', tempMin);
    formData.append('temperature_max', tempMax);
    formData.append('unit', document.getElementById('unit').value);

    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    } else {
        const imgPath = document.getElementById('img_path').value;
        if (imgPath) {
            formData.append('img_path', imgPath);
        }
    }

    try {
        const response = await fetch(`${API_URL}clothes/`, {
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
            Modal.success('Одяг успішно додано!');
            document.getElementById('add-clothes-form').reset();
            loadUserClothes();
        } else {
            Modal.error(data.error || 'Помилка при додаванні одягу');
        }
    } catch (error) {
        console.error('Error:', error);
        Modal.error('Помилка з\'єднання з сервером');
    }
}

async function loadUserClothes() {
    const token = localStorage.getItem('token');
    if (!token) {
        return;
    }
    
    const listDiv = document.getElementById('clothes-list');
    listDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
        const response = await fetch(`${API_URL}clothes/`, {
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

        if (!response.ok) {
            throw new Error('Failed to fetch clothes');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            listDiv.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-2">Ще немає доданого одягу</p>
                    <p class="small">Додайте свій перший предмет одягу за допомогою форми</p>
                </div>
            `;
            return;
        }
        
        listDiv.innerHTML = '';
        
        data.forEach(item => {
            const clothesCard = document.createElement('div');
            clothesCard.className = 'card mb-3';
            
            const seasonNames = {
                'winter': 'Зима',
                'spring': 'Весна',
                'summer': 'Літо',
                'autumn': 'Осінь'
            };
            
            let imageUrl = null;
            if (item.image_url) {
                imageUrl = item.image_url;
            } else if (item.image) {
                imageUrl = item.image;
            } else if (item.img_path) {
                imageUrl = `/media/${item.img_path}`;
            }

            clothesCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-2">${item.name}</h6>
                            <p class="card-text mb-1">
                                <span class="badge bg-info">${seasonNames[item.season] || item.season}</span>
                                <span class="badge bg-secondary">${item.temperature_min}°${item.unit} - ${item.temperature_max}°${item.unit}</span>
                            </p>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteClothes(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    ${imageUrl ? `
                        <div class="mt-2">
                            <img src="${imageUrl}" alt="${item.name}" class="img-fluid rounded" style="max-height: 150px; object-fit: cover;" onerror="this.style.display='none'">
                        </div>
                    ` : ''}
                </div>
            `;
            
            listDiv.appendChild(clothesCard);
        });
        
    } catch (error) {
        console.error('Error:', error);
        listDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Помилка при завантаженні даних
            </div>
        `;
    }
}

async function deleteClothes(id) {
    const confirmed = await Modal.confirm('Ви впевнені, що хочете видалити цей одяг?', {
        confirmText: 'Видалити',
        cancelText: 'Скасувати',
        confirmClass: 'danger',
        title: 'Підтвердження видалення'
    });
    
    if (!confirmed) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        Modal.error('Потрібна авторизація');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}clothes/${id}/`, {
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

        if (response.ok) {
            Modal.success('Одяг видалено');
            loadUserClothes();
        } else {
            const data = await response.json();
            Modal.error(data.error || 'Помилка при видаленні');
        }
    } catch (error) {
        console.error('Error:', error);
        Modal.error('Помилка з\'єднання з сервером');
    }
}

