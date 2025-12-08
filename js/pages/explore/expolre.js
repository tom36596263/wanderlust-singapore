let attractionsData = [];

let savedAttractions = [];

let stackIndex = 0;

let currentFilteredData = [];

const itemsPerPage = 8;

let currentPage = 1;



let map;

let markersArray = [];

let routePolyline = null;



const cardStack = document.getElementById('cardStack');

const mapContainer = document.getElementById('mapContainer');

const gridContainer = document.getElementById('attractionsGrid');

const paginationContainer = document.getElementById('pagination');

const searchInput = document.querySelector('.search-input input');

const categorySelect = document.getElementById('categorySelect') || document.querySelector('.filter-selects select:nth-of-type(1)');

const sortSelect = document.getElementById('sortSelect') || document.querySelector('.filter-selects select:nth-of-type(2)');

const sidebar = document.getElementById('itinerary-sidebar');

const overlay = document.getElementById('sidebar-overlay');

const toggleBtn = document.getElementById('itinerary-toggle');

const closeBtn = document.getElementById('close-sidebar');

const clearAllBtn = document.getElementById('clear-all-btn');

const planItineraryBtn = document.getElementById('planItineraryBtn');



const categoriesMap = {

    "自然風景": "forest",

    "人文歷史": "temple_buddhist",

    "美食饗宴": "restaurant",

    "購物時尚": "shopping_bag",

    "休閒娛樂": "attractions",

    "藝術文化": "palette"

};



async function initData() {

    try {

        const response = await fetch('data/attractions.json');

        const data = await response.json();

        

        attractionsData = data.map(item => ({

            ...item,

            icon: categoriesMap[item.category] || "place",

            tags: item.category

        }));



        currentFilteredData = [...attractionsData];

        applyFilters();

        

        if (map) {

            updateMapState();

        }



    } catch (error) {

        console.error(error);

        if (gridContainer) {

            gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px;"><h3>資料載入失敗，請稍後再試</h3></div>';

        }

    }

}



initData();



window.initMap = function() {

    map = new google.maps.Map(document.getElementById("mapContainer"), {

        center: { lat: 1.3521, lng: 103.8198 },

        zoom: 11,

        disableDefaultUI: true, 

        styles: [

            {

                "featureType": "poi",

                "elementType": "labels",

                "stylers": [{ "visibility": "off" }]

            }

        ]

    });



    if (savedAttractions.length > 0) {

        updateMapState();

    }

};



function parsePostsCount(str) {

    if (typeof str === 'string' && str.includes('k')) {

        return parseFloat(str) * 1000;

    }

    return parseInt(str) || 0;

}



function applyFilters() {

    if (!attractionsData.length) return;



    const query = searchInput.value.toLowerCase().trim();

    const category = categorySelect.value;

    const sort = sortSelect.value;



    let temp = attractionsData.filter(item => {

        const matchCategory = (category === '所有類別') || item.category === category;

        const matchSearch = item.title.toLowerCase().includes(query) || 

                            item.desc.toLowerCase().includes(query) ||

                            item.category.toLowerCase().includes(query);

        return matchCategory && matchSearch;

    });



    if (sort === '熱門') {

        temp.sort((a, b) => parsePostsCount(b.posts) - parsePostsCount(a.posts));

    } else if (sort === '最新') {

        temp.sort((a, b) => b.id - a.id);

    } else if (sort === '評價最高') {

        temp.sort((a, b) => b.rating - a.rating);

    }



    currentFilteredData = temp;

    currentPage = 1;

    stackIndex = 0;



    renderGrid(currentPage);

    renderPagination();

    renderStack();

}



searchInput.addEventListener('input', applyFilters);

categorySelect.addEventListener('change', applyFilters);

sortSelect.addEventListener('change', applyFilters);



function renderGrid(page) {

    gridContainer.innerHTML = '';

    

    if (currentFilteredData.length === 0) {

        gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #666;"><h3>沒有找到相關景點</h3></div>';

        return;

    }



    const start = (page - 1) * itemsPerPage;

    const end = start + itemsPerPage;

    const pageData = currentFilteredData.slice(start, end);



    pageData.forEach(item => {

        const isAdded = savedAttractions.some(saved => saved.id === item.id);

        const btnClass = isAdded ? 'btn-add-grid added' : 'btn-add-grid';

        const btnText = isAdded ? '已在清單' : '加入清單';

        const btnIcon = isAdded ? 'check' : 'add_circle';



        const cardHTML = `

            <div class="attraction-card">

                <a href="explore-detail-page.html?id=${item.id}" class="card-img-link">

                    <img src="${item.image}" alt="${item.title}" loading="lazy">

                </a>

                <div class="card-body">

                    <div class="tags">

                        <span class="material-symbols-outlined category-icon">${item.icon}</span> 

                        ${item.category} &bull; ${item.posts}

                    </div>

                    <a href="explore-detail-page.html?id=${item.id}" style="text-decoration: none; color: inherit;">

                        <h4>${item.title}</h4>

                    </a>

                    <p>${item.desc}</p>

                    <div class="rating">

                        ${item.rating} <span class="material-symbols-outlined">star</span>

                    </div>

                    <button class="${btnClass}" onclick="toggleItineraryFromGrid(this, ${item.id})">

                        <span class="material-symbols-outlined">${btnIcon}</span> ${btnText}

                    </button>

                </div>

            </div>

        `;

        gridContainer.innerHTML += cardHTML;

    });

}



window.toggleItineraryFromGrid = function(btnElement, id) {

    const item = attractionsData.find(d => d.id === id);

    if (!item) return;



    const index = savedAttractions.findIndex(saved => saved.id === id);



    if (index === -1) {

        addToItinerary(item);

        btnElement.classList.add('added');

        btnElement.innerHTML = `<span class="material-symbols-outlined">check</span> 已在清單`;

    } else {

        alert("此景點已經在您的待去清單中了！請打開右下角清單查看。");

    }

}



function renderPagination() {

    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);



    if (totalPages === 0) return;



    const prevBtn = document.createElement('div');

    prevBtn.className = 'page-item';

    prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';

    prevBtn.onclick = () => changePage(currentPage - 1, totalPages);

    paginationContainer.appendChild(prevBtn);



    for (let i = 1; i <= totalPages; i++) {

        const pageItem = document.createElement('div');

        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;

        pageItem.innerText = i;

        pageItem.onclick = () => changePage(i, totalPages);

        paginationContainer.appendChild(pageItem);

    }



    const nextBtn = document.createElement('div');

    nextBtn.className = 'page-item';

    nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';

    nextBtn.onclick = () => changePage(currentPage + 1, totalPages);

    paginationContainer.appendChild(nextBtn);

}



function changePage(newPage, totalPages) {

    if (newPage < 1 || newPage > totalPages) return;

    currentPage = newPage;

    renderGrid(currentPage);

    renderPagination();

    document.querySelector('.filter-bar').scrollIntoView({ behavior: 'smooth' });

}



function getSwipeData() {

    return currentFilteredData.slice(stackIndex, stackIndex + 5);

}



function renderStack() {

    cardStack.innerHTML = '';

    const currentBatch = getSwipeData();



    if (currentBatch.length === 0) {

        cardStack.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#666;"><h3>沒有符合條件的景點</h3></div>';

        return;

    }



    [...currentBatch].reverse().forEach((item, index) => {

        const realIndex = stackIndex + (currentBatch.length - 1 - index);

        const isTopCard = (index === currentBatch.length - 1);

        const div = document.createElement('div');

        div.className = 'swipe-card';

        div.setAttribute('data-index', realIndex); 

        div.id = `card-stack-item-${index}`; 

        

        const depth = currentBatch.length - 1 - index;

        const scale = 1 - (depth * 0.05);

        const translateY = depth * 10;

        

        div.style.transform = `scale(${scale}) translateY(${translateY}px)`;

        div.style.zIndex = 100 - depth;



        div.innerHTML = `

            <img src="${item.image}" alt="${item.title}" draggable="false">

            <div class="card-content">

                <h3>${item.title}</h3>

                <p>${item.desc}</p>

            </div>

        `;



        if (isTopCard) {

            initDragEvents(div);

            div.id = 'active-swipe-card'; 

        }



        cardStack.appendChild(div);

    });

}





function initDragEvents(card) {

    let isDragging = false;

    let startX = 0;

    let currentX = 0;

    

    function getEventX(e) {

        return e.touches ? e.touches[0].clientX : e.clientX;

    }



    function startDrag(e) {

        if (e.type === 'mousedown' && e.button !== 0) return;

        e.preventDefault(); 

        

        isDragging = true;

        startX = getEventX(e);

        card.style.transition = 'none';

        

        if (e.type === 'touchstart') {

            window.addEventListener('touchmove', dragMove, { passive: false });

            window.addEventListener('touchend', endDrag);

        } else {

            window.addEventListener('mousemove', dragMove);

            window.addEventListener('mouseup', endDrag);

        }

    }

    

    function dragMove(e) {

        if (!isDragging) return;

        

        if (e.type === 'touchmove') {

            e.preventDefault(); 

        }



        const x = getEventX(e) - startX;

        currentX = x;

        const rotate = x * 0.1; 

        card.style.transform = `translateX(${x}px) rotate(${rotate}deg)`;

    }

    

    function endDrag() {

        if (!isDragging) return;

        isDragging = false;

        

        window.removeEventListener('mousemove', dragMove);

        window.removeEventListener('mouseup', endDrag);

        window.removeEventListener('touchmove', dragMove);

        window.removeEventListener('touchend', endDrag);





        const threshold = 100;

        

        if (currentX > threshold) {

            handleSwipeComplete(card, 'right');

        } else if (currentX < -threshold) {

            handleSwipeComplete(card, 'left'); 

        } else {

            card.classList.add('is-animating');

            card.style.transform = `scale(1) translateY(0px)`;

            setTimeout(() => {

                card.classList.remove('is-animating');

            }, 400); 

        }

        

        currentX = 0;

    }



    card.addEventListener('mousedown', startDrag);

    card.addEventListener('touchstart', startDrag);

}



function handleSwipeComplete(card, direction) {

    card.classList.add('is-animating');

    

    if (direction === 'right') {

        card.classList.add('swipe-right-anim');

        

        if (stackIndex < currentFilteredData.length) {

            const currentItem = currentFilteredData[stackIndex];

            addToItinerary(currentItem);

        }

        

    } else {

        card.classList.add('swipe-left-anim');

    }



    setTimeout(() => {

        stackIndex++;

        renderStack();

    }, 300);

}



document.getElementById('btn-nope').addEventListener('click', () => triggerSwipe('left'));

document.getElementById('btn-like').addEventListener('click', () => triggerSwipe('right'));



function triggerSwipe(direction) {

    const card = document.getElementById('active-swipe-card');

    if (card) {

        handleSwipeComplete(card, direction);

    } else {

        alert("已無更多卡片");

    }

}



function calculateDistance(item1, item2) {

    const dx = item1.lat - item2.lat;

    const dy = item1.lng - item2.lng;

    return Math.sqrt(dx * dx + dy * dy);

}



function updateMapState() {

    if (!map) return;



    markersArray.forEach(marker => marker.setMap(null));

    markersArray = [];

    if (routePolyline) {

        routePolyline.setMap(null);

    }



    const pathCoordinates = [];



    savedAttractions.forEach((item, index) => {

        const marker = new google.maps.Marker({

            position: { lat: item.lat, lng: item.lng },

            map: map,

            title: `${index + 1}. ${item.title}`, 

            label: (index + 1).toString(), 

            animation: google.maps.Animation.DROP

        });



        const infoWindow = new google.maps.InfoWindow({

            content: `<div style="padding:5px; max-width:200px;">

                        <h5 style="margin:0 0 5px 0;">${index + 1}. ${item.title}</h5>

                        <p style="font-size:0.8rem; margin:0;">${item.category}</p>

                      </div>`

        });



        marker.addListener("click", () => {

            infoWindow.open(map, marker);

        });



        markersArray.push(marker);

        pathCoordinates.push({ lat: item.lat, lng: item.lng });

    });



    if (savedAttractions.length > 1) {

        routePolyline = new google.maps.Polyline({

            path: pathCoordinates,

            geodesic: true,

            strokeColor: '#FF0000',

            strokeOpacity: 0.8,

            strokeWeight: 4

        });

        routePolyline.setMap(map);

    }

}



function addToItinerary(item) {

    if (savedAttractions.some(saved => saved.id === item.id)) return;



    if (savedAttractions.length === 0) {

        savedAttractions.push(item);

    } else {

        let closestIndex = -1;

        let minDistance = Infinity;



        savedAttractions.forEach((savedItem, index) => {

            const dist = calculateDistance(item, savedItem);

            if (dist < minDistance) {

                minDistance = dist;

                closestIndex = index;

            }

        });



        savedAttractions.splice(closestIndex + 1, 0, item);

    }



    updateItineraryUI();

    updateMapState();

    

    if (map) {

        map.panTo({ lat: item.lat, lng: item.lng });

    }



    const badge = document.getElementById('itinerary-count');

    badge.classList.remove('show');

    setTimeout(() => badge.classList.add('show'), 50);



    renderGrid(currentPage);

}



window.removeFromItinerary = function(id) {

    savedAttractions = savedAttractions.filter(item => item.id !== id);

    updateItineraryUI();

    updateMapState();

    renderGrid(currentPage);

}



function clearAllItinerary() {

    if (!confirm("確定要清空所有待去景點嗎？")) return;

    

    savedAttractions = [];

    updateMapState();

    updateItineraryUI();

    renderGrid(currentPage);

}



if (clearAllBtn) {

    clearAllBtn.addEventListener('click', clearAllItinerary);

}



function updateItineraryUI() {

    const listContainer = document.getElementById('itinerary-list');

    const countBadge = document.getElementById('itinerary-count');

    

    countBadge.innerText = savedAttractions.length;

    if (savedAttractions.length > 0) {

        countBadge.classList.add('show');

    } else {

        countBadge.classList.remove('show');

    }



    if (savedAttractions.length === 0) {

        listContainer.innerHTML = `

            <div class="empty-state">

                <span class="material-symbols-outlined">sentiment_content</span>

                <p>還沒收藏任何景點<br>快去右滑喜歡吧！</p>

            </div>

        `;

        return;

    }



    listContainer.innerHTML = '';

    savedAttractions.forEach((item, index) => {

        const div = document.createElement('div');

        div.className = 'saved-item';

        div.innerHTML = `

            <div style="font-weight:bold; color:#FF0000; margin-right:10px;">${index + 1}</div>

            <img src="${item.image}" alt="${item.title}">

            <div class="item-info">

                <h4>${item.title}</h4>

                <span>${item.category}</span>

            </div>

            <button class="btn-remove" onclick="removeFromItinerary(${item.id})">

                <span class="material-symbols-outlined">delete</span>

            </button>

        `;

        listContainer.appendChild(div);

    });

}



function openSidebar() {

    sidebar.classList.add('open');

    overlay.classList.add('show');

}



function closeSidebarFn() {

    sidebar.classList.remove('open');

    overlay.classList.remove('show');

}



toggleBtn.addEventListener('click', openSidebar);

closeBtn.addEventListener('click', closeSidebarFn);

overlay.addEventListener('click', closeSidebarFn);



document.addEventListener('DOMContentLoaded', () => {

    if (planItineraryBtn) {

        planItineraryBtn.addEventListener('click', handlePlanItinerary);

    }

});



function handlePlanItinerary() {

    if (savedAttractions.length === 0) {

        alert("您的待去清單是空的，請先收藏景點！");

        return;

    }

    

    sessionStorage.setItem('temp_itinerary_draft', JSON.stringify(savedAttractions));

    window.location.href = 'itinerary.html';

}