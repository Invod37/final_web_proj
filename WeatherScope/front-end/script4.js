
async function getOutfitAdvice(city) {
    try {
        const response = await fetch(`${API_URL}outfit-advice/?city=${encodeURIComponent(city)}`);
        const data = await response.json();

        const outfitResult = document.getElementById('outfit-result');
        outfitResult.textContent = data.advice || 'Порада недоступна';
        outfitResult.style.display = 'block';
    } catch (error) {
        const outfitResult = document.getElementById('outfit-result');
        outfitResult.textContent = 'Помилка при отриманні поради щодо одягу!';
        outfitResult.style.display = 'block';
        console.error(error);
    }
}

document.getElementById('outfit-btn').addEventListener('click', () => {
    const city = document.getElementById('city-name').textContent.trim();
    if (!city || city === 'Завантаження...') {
        alert('Спершу оберіть місто!');
        return;
    }
    getOutfitAdvice(city);
});
