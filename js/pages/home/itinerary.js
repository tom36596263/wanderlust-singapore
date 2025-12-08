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
        
        sessionStorage.setItem('allItinerariesData', JSON.stringify(itineraries));

        const html = itineraries.map(item => {
            const targetUrl = `itinerary.html?id=${item.id}`;
            return `
                <article class="itinerary-card" data-id="${item.id}">
                    <div class="card-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="card-content">
                        <div class="card-header">
                            <h3 class="card-title">
                                <a href="${targetUrl}">${item.title}</a>
                            </h3>
                            <span class="card-duration">${item.duration}</span>
                        </div>
                        <p class="card-description">${item.desc}</p>
                    </div>
                </article>
            `;
        }).join('');

        container.innerHTML = html;

        const cards = container.querySelectorAll('.itinerary-card');
        const attractionResponse = await fetch('./data/attractions.json');
        const allAttractions = await attractionResponse.json();

        cards.forEach(card => {
            const id = parseInt(card.dataset.id);
            const data = itineraries.find(item => item.id === id);

            card.addEventListener('click', (event) => {
                event.preventDefault();
                if (data) {
                    openItineraryModal(data, allAttractions);
                }
            });

            const titleLink = card.querySelector('.card-title a');
            if (titleLink) {
                titleLink.addEventListener('click', (event) => {
                    event.preventDefault(); 
                    if (data) {
                        openItineraryModal(data, allAttractions);
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error loading data:', error);
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
const modalActionBtn = document.querySelector('.modal-action-btn');

function openItineraryModal(data, allAttractions) {
    if (!modal) return;

    document.getElementById('modal-img').src = data.image;
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-duration').innerText = data.duration;
    document.getElementById('modal-desc').innerText = data.desc;
    document.getElementById('modal-details').innerHTML = data.details;

    if (modalActionBtn) {
        modalActionBtn.onclick = (e) => {
            e.preventDefault();
            generateAndSaveItinerary(data, allAttractions);
            window.location.href = 'itinerary.html';
        };
        modalActionBtn.href = '#'; 
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; 
}

function generateAndSaveItinerary(itineraryItem, allAttractions) {
    if (!itineraryItem.route) {
        alert('此行程暫無詳細路線資料');
        return;
    }

    const plannerData = {};

    Object.keys(itineraryItem.route).forEach(dayKey => {
        const dayRoute = itineraryItem.route[dayKey];
        const dayItems = [];

        dayRoute.forEach(routePoint => {
            const attractionDetails = allAttractions.find(attr => attr.id === routePoint.id);
            
            if (attractionDetails) {
                dayItems.push({
                    id: attractionDetails.id,
                    title: attractionDetails.title,
                    category: attractionDetails.category,
                    image: attractionDetails.image,
                    lat: attractionDetails.lat,
                    lng: attractionDetails.lng,
                    rating: attractionDetails.rating,
                    isCustom: false,
                    note: routePoint.note
                });
            }
        });

        plannerData[dayKey] = dayItems;
    });

    localStorage.setItem('wanderlust_itinerary', JSON.stringify(plannerData));
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