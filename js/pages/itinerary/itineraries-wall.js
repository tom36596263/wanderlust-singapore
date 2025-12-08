document.addEventListener('DOMContentLoaded', () => {
    const cardGrid = document.querySelector('.card-grid');
    const heroTrack = document.getElementById('hero-track');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    
    const modal = document.getElementById('itinerary-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDuration = document.getElementById('modal-duration');
    const modalDesc = document.getElementById('modal-desc');
    const modalDetails = document.getElementById('modal-details');
    const startPlanningBtn = document.getElementById('start-planning-btn');

    const itinerariesUrl = './data/itineraries.json';
    const attractionsUrl = './data/attractions.json';

    let allItineraries = [];
    let allAttractions = [];
    let currentSlide = 0;
    let slideInterval;

    Promise.all([
        fetch(itinerariesUrl).then(res => res.json()),
        fetch(attractionsUrl).then(res => res.json())
    ])
    .then(([itinerariesData, attractionsData]) => {
        allItineraries = itinerariesData;
        allAttractions = attractionsData;

        const heroItems = itinerariesData.slice(0, 5);
        renderHero(heroItems);
        renderCards(itinerariesData);
    })
    .catch(error => {
        console.error(error);
    });

    function renderHero(items) {
        if (!items.length) return;
        
        let heroHtml = '';
        items.forEach((item, index) => {
            const activeClass = index === 0 ? 'active' : '';
            heroHtml += `
                <div class="hero-slide ${activeClass}" data-index="${index}">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="slide-info">
                        <h3>${item.title}</h3>
                        <p>${item.desc || ''}</p>
                    </div>
                </div>
            `;
        });
        heroTrack.innerHTML = heroHtml;
        startSlider();
    }

    function showSlide(index) {
        const slides = document.querySelectorAll('.hero-slide');
        if (slides.length === 0) return;

        slides.forEach(slide => slide.classList.remove('active'));
        
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function startSlider() {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
    }

    function stopSlider() {
        if (slideInterval) clearInterval(slideInterval);
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            stopSlider();
            showSlide(currentSlide - 1);
            startSlider();
        });
        nextBtn.addEventListener('click', () => {
            stopSlider();
            showSlide(currentSlide + 1);
            startSlider();
        });
    }

    function renderCards(items) {
        if (!cardGrid) return;

        let htmlContent = '';
        items.forEach(item => {
            htmlContent += `
            <article class="itinerary-card" data-id="${item.id}">
                <div class="card-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <h3 class="card-title">${item.title}</h3>
                        <span class="card-duration">${item.duration || 'Recommended'}</span>
                    </div>
                    <p class="card-description">${item.desc}</p>
                </div>
            </article>
            `;
        });
        
        cardGrid.innerHTML = htmlContent;
        addCardClickEvents();
    }

    function addCardClickEvents() {
        const cards = document.querySelectorAll('.itinerary-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const idAttr = card.getAttribute('data-id');
                if (idAttr && allItineraries.length > 0) {
                    const id = parseInt(idAttr);
                    const item = allItineraries.find(i => i.id === id);
                    if (item) openModal(item);
                }
            });
        });
    }

    function openModal(item) {
        if (!modal) return;

        modalImg.src = item.image;
        modalTitle.textContent = item.title;
        modalDuration.textContent = item.duration || '';
        modalDesc.textContent = item.desc;
        modalDetails.innerHTML = item.details || '';
        
        if (startPlanningBtn) {
            startPlanningBtn.onclick = () => generateAndRedirect(item);
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            closeModal();
        }
    });

    function generateAndRedirect(itineraryItem) {
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
                        ...attractionDetails,
                        note: routePoint.note
                    });
                }
            });

            plannerData[dayKey] = dayItems;
        });

        localStorage.setItem('wanderlust_itinerary', JSON.stringify(plannerData));
        window.location.href = 'itinerary.html';
    }
});