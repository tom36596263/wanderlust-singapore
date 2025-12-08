document.addEventListener('DOMContentLoaded', async () => {
    
    await Promise.all([
        loadAndRenderItineraries()
    ]);

    startBannerCarousel();
});

async function loadAndRenderItineraries() {
    const container = document.getElementById('itinerary-grid');
    if (!container) return;

    try {
        const response = await fetch('./data/itineraries.json');
        if (!response.ok) throw new Error('Failed to load itineraries data');
        
        const itineraries = await response.json();

        const html = itineraries.map(item => `
            <article class="itinerary-card" data-id="${item.id}">
                <div class="card-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <h3 class="card-title">${item.title}</h3>
                        <span class="card-duration">${item.duration}</span>
                    </div>
                    <p class="card-description">${item.desc}</p>
                </div>
            </article>
        `).join('');

        container.innerHTML = html;

        const cards = container.querySelectorAll('.itinerary-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const data = itineraries.find(item => item.id === id);
                if (data) {
                    openItineraryModal(data);
                }
            });
        });

    } catch (error) {
        console.error('Error loading itineraries:', error);
        container.innerHTML = '<p style="text-align:center; padding:20px;">暫時無法載入行程資料。</p>';
    }
}

function startBannerCarousel() {
    const images = document.querySelectorAll('#bannerCarousel img');
    if (images.length === 0) return;

    let currentIndex = 0;
    const intervalTime = 4000;

    setInterval(() => {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
    }, intervalTime);
}

const modal = document.getElementById('itinerary-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const modalCloseBtn = document.querySelector('.modal-close-btn');

function openItineraryModal(data) {
    if (!modal) return;

    document.getElementById('modal-img').src = data.image;
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-duration').innerText = data.duration;
    document.getElementById('modal-desc').innerText = data.desc;
    document.getElementById('modal-details').innerHTML = data.details;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; 
}

function closeItineraryModal() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

if (modalOverlay) modalOverlay.addEventListener('click', closeItineraryModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeItineraryModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
        closeItineraryModal();
    }
});

