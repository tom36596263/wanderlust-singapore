let allAttractions = [];

let itineraryData = {

    1: []

};

let currentDay = 1;

let map;

let markers = [];

let flightPath;

let currentEditItemIndex = null;

let uploadedImageBase64 = null;



const sgCenter = { lat: 1.3521, lng: 103.8198 };



document.addEventListener('DOMContentLoaded', async () => {

    const savedData = localStorage.getItem('wanderlust_itinerary');

    if (savedData) {

        itineraryData = JSON.parse(savedData);

    }



    const tempDraft = sessionStorage.getItem('temp_itinerary_draft');

    if (tempDraft) {

        const draftAttractions = JSON.parse(tempDraft);

        

        if (!itineraryData[1]) {

            itineraryData[1] = [];

        }



        draftAttractions.forEach(item => {

            if (!itineraryData[1].some(existing => existing.id === item.id)) {

                const newItem = JSON.parse(JSON.stringify(item));

                if(!newItem.note) newItem.note = '';

                itineraryData[1].push(newItem);

            }

        });

        

        sessionStorage.removeItem('temp_itinerary_draft');

        

        currentDay = 1; 

        

        alert(`已將待去清單中的 ${draftAttractions.length} 個景點匯入 Day 1 行程！`);

    }



    await fetchAttractions();

    renderDayTabs();

    renderAttractionList(allAttractions);

    initDragAndDrop();

    initSortableTimeline();

    initCustomModal();

    initEditNoteModal();

    initFilterScroll();

    initDayTabsScroll();

    initFooterActions();

    initMobileNav();

    initMobileLayout();

    initTabletMapControls();



    if (Object.values(itineraryData).some(dayItems => dayItems.length > 0)) {

        renderTimeline();

        updateSummary();

        updateMap();

    }



    const filters = document.querySelectorAll('.filter-pills .pill');

    filters.forEach(btn => {

        btn.addEventListener('click', (e) => {

            filters.forEach(b => b.classList.remove('active'));

            e.target.classList.add('active');

            const category = e.target.dataset.category;

            filterAttractions(category);

        });

    });



    document.getElementById('attractionSearch').addEventListener('input', (e) => {

        const keyword = e.target.value.toLowerCase();

        const filtered = allAttractions.filter(item => item.title.toLowerCase().includes(keyword));

        renderAttractionList(filtered);

    });

});



async function fetchAttractions() {

    try {

        const response = await fetch('./data/attractions.json');

        allAttractions = await response.json();

    } catch (error) {

        console.error(error);

        const list = document.getElementById('attractionSourceList');

        if (list) list.innerHTML = '<p>無法載入景點資料</p>';

    }

}



function renderAttractionList(data) {

    const list = document.getElementById('attractionSourceList');

    if (!list) return;

    list.innerHTML = '';



    const addedIds = new Set();

    Object.values(itineraryData).forEach(dayItems => {

        dayItems.forEach(item => addedIds.add(item.id.toString()));

    });



    data.forEach(item => {

        const card = document.createElement('div');

        card.className = 'source-card';

        if (addedIds.has(item.id.toString())) {

            card.classList.add('added');

        }



        card.draggable = true;

        card.dataset.id = item.id;



        card.innerHTML = `

            <img src="${item.image}" alt="${item.title}">

            <div class="info">

                <h4>${item.title}</h4>

                <span class="category">${item.category}</span>

                <div class="rating">

                    <span class="material-symbols-outlined">star</span> ${item.rating}

                </div>

            </div>

            <div class="drag-handle">

                <span class="material-symbols-outlined">drag_indicator</span>

            </div>

            <button class="mobile-add-btn">

                <span class="material-symbols-outlined">add_circle</span>

            </button>

        `;



        card.addEventListener('dragstart', handleSourceDragStart);



        const addBtn = card.querySelector('.mobile-add-btn');

        if (addBtn) {

            addBtn.addEventListener('click', (e) => {

                e.stopPropagation();

                addToItinerary(item);



                if (window.innerWidth > 768) {

                    alert(`已將 ${item.title} 加入行程！`);

                }



                const plannerBtn = document.querySelector('[data-target="planner-area"]');

                if (plannerBtn && window.innerWidth <= 768) plannerBtn.click();

            });

        }



        list.appendChild(card);

    });

}



function filterAttractions(category) {

    if (category === 'all') {

        renderAttractionList(allAttractions);

    } else {

        const filtered = allAttractions.filter(item => item.category === category);

        renderAttractionList(filtered);

    }

}



function renderDayTabs() {

    const container = document.getElementById('dayTabsContainer');

    container.innerHTML = '';



    const totalDays = Object.keys(itineraryData).length;



    Object.keys(itineraryData).forEach(dayNumStr => {

        const dayNum = parseInt(dayNumStr);

        const btn = document.createElement('div');

        const isActive = dayNum === currentDay;



        btn.className = `day-tab ${isActive ? 'active' : ''}`;



        const textSpan = document.createElement('span');

        textSpan.innerText = `Day ${dayNum}`;

        btn.appendChild(textSpan);



        btn.onclick = (e) => {

            if (!e.target.closest('.delete-day-btn')) {

                switchDay(dayNum);

            }

        };



        if (isActive && totalDays > 1) {

            const deleteBtn = document.createElement('span');

            deleteBtn.className = 'delete-day-btn material-symbols-outlined';

            deleteBtn.innerText = 'close';

            deleteBtn.title = '刪除此天';



            deleteBtn.onclick = (e) => {

                e.stopPropagation();

                handleDeleteDay(dayNum);

            };

            btn.appendChild(deleteBtn);

        }



        container.appendChild(btn);

    });



    const wrapper = document.createElement('div');

    wrapper.className = 'sticky-wrapper';



    const addBtn = document.createElement('button');

    addBtn.className = 'add-day-btn';

    addBtn.id = 'addDayBtn';

    addBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';

    addBtn.onclick = handleAddDay;



    wrapper.appendChild(addBtn);

    container.appendChild(wrapper);

}



function handleAddDay() {

    const nextDay = Object.keys(itineraryData).length + 1;

    itineraryData[nextDay] = [];

    switchDay(nextDay);

}



function handleDeleteDay(dayToDelete) {

    const totalDays = Object.keys(itineraryData).length;



    if (totalDays <= 1) {

        alert("行程至少需要保留一天！");

        return;

    }



    if (!confirm(`確定要刪除 Day ${dayToDelete} 及其所有行程嗎？此動作無法復原。`)) {

        return;

    }



    delete itineraryData[dayToDelete];



    const newItinerary = {};

    let newIndex = 1;



    for (let i = 1; i <= totalDays; i++) {

        if (i === dayToDelete) continue;

        newItinerary[newIndex] = itineraryData[i];

        newIndex++;

    }



    itineraryData = newItinerary;



    if (currentDay > Object.keys(itineraryData).length) {

        currentDay = Object.keys(itineraryData).length;

    }



    renderDayTabs();

    renderTimeline();

    updateMap();

    updateSummary();

}



function switchDay(dayNum) {

    currentDay = dayNum;

    renderDayTabs();

    renderTimeline();

    updateMap();

    updateSummary();

}



function initDayTabsScroll() {

    const container = document.querySelector('.days-tabs');

    if (!container) return;



    container.addEventListener('wheel', (e) => {

        if (container.scrollWidth <= container.clientWidth) return;

        e.preventDefault();

        container.scrollLeft += e.deltaY;

    });



    let isDown = false;

    let startX;

    let scrollLeft;



    container.addEventListener('mousedown', (e) => {

        isDown = true;

        container.classList.add('active');

        startX = e.pageX - container.offsetLeft;

        scrollLeft = container.scrollLeft;

    });



    container.addEventListener('mouseleave', () => {

        isDown = false;

        container.classList.remove('active');

    });



    container.addEventListener('mouseup', () => {

        isDown = false;

        container.classList.remove('active');

    });



    container.addEventListener('mousemove', (e) => {

        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - container.offsetLeft;

        const walk = (x - startX) * 2;

        container.scrollLeft = scrollLeft - walk;

    });

}



function initCustomModal() {

    const modal = document.getElementById('customModal');

    const openBtn = document.getElementById('openCustomBtn');

    const closeBtn = document.getElementById('closeModalBtn');

    const cancelBtn = document.getElementById('cancelCustomBtn');

    const saveBtn = document.getElementById('saveCustomBtn');

    

    const fileInput = document.getElementById('customImageInput');

    const previewImg = document.getElementById('customImagePreview');

    const removeImgBtn = document.getElementById('removeImageBtn');

    const uploadLabel = document.querySelector('.upload-label');



    openBtn.addEventListener('click', () => {

        modal.classList.add('active');

        document.getElementById('customName').focus();

    });



    const resetImageUpload = () => {

        fileInput.value = '';

        previewImg.src = '';

        previewImg.style.display = 'none';

        removeImgBtn.style.display = 'none';

        uploadLabel.style.display = 'flex';

        uploadedImageBase64 = null;

    };



    const closeModal = () => {

        modal.classList.remove('active');

        document.getElementById('customName').value = '';

        document.getElementById('customNote').value = '';

        document.getElementById('customCategory').value = '自訂行程';

        resetImageUpload();

    };



    closeBtn.addEventListener('click', closeModal);

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {

        if (e.target === modal) closeModal();

    });



    fileInput.addEventListener('change', (e) => {

        const file = e.target.files[0];

        if (file) {

            const reader = new FileReader();

            reader.onload = function(e) {

                uploadedImageBase64 = e.target.result;

                previewImg.src = uploadedImageBase64;

                previewImg.style.display = 'block';

                removeImgBtn.style.display = 'flex';

                uploadLabel.style.display = 'none';

            };

            reader.readAsDataURL(file);

        }

    });



    removeImgBtn.addEventListener('click', (e) => {

        e.preventDefault();

        resetImageUpload();

    });



    saveBtn.addEventListener('click', () => {

        const name = document.getElementById('customName').value.trim();

        const category = document.getElementById('customCategory').value;

        const note = document.getElementById('customNote').value;

        const image = uploadedImageBase64 || 'https://placehold.co/100x100/479E82/ffffff?text=自訂';



        if (!name) {

            alert('請輸入活動名稱');

            return;

        }



        const customItem = {

            id: 'custom_' + Date.now(),

            title: name,

            category: category,

            image: image,

            lat: null,

            lng: null,

            rating: '-',

            isCustom: true,

            note: note

        };



        addToItinerary(customItem);

        closeModal();

    });

}



function initEditNoteModal() {

    const modal = document.getElementById('editNoteModal');

    const closeBtn = document.getElementById('closeEditNoteBtn');

    const cancelBtn = document.getElementById('cancelEditNoteBtn');

    const saveBtn = document.getElementById('saveEditNoteBtn');



    const closeModal = () => {

        modal.classList.remove('active');

        currentEditItemIndex = null;

        document.getElementById('editNoteText').value = '';

    };



    closeBtn.addEventListener('click', closeModal);

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {

        if (e.target === modal) closeModal();

    });



    saveBtn.addEventListener('click', () => {

        if (currentEditItemIndex !== null) {

            const newNote = document.getElementById('editNoteText').value;

            itineraryData[currentDay][currentEditItemIndex].note = newNote;

            renderTimeline();

            updateSummary();

            closeModal();

        }

    });

}



function openEditNoteModal(index) {

    const item = itineraryData[currentDay][index];

    if (item) {

        currentEditItemIndex = index;

        const noteInput = document.getElementById('editNoteText');

        noteInput.value = item.note || '';

        document.getElementById('editNoteModal').classList.add('active');

        noteInput.focus();

    }

}



function initFooterActions() {

    document.getElementById('saveItineraryBtn').addEventListener('click', () => {

        localStorage.setItem('wanderlust_itinerary', JSON.stringify(itineraryData));

        alert('行程已成功儲存！下次開啟網頁時將會自動載入。');

    });



    document.getElementById('shareBtn').addEventListener('click', () => {

        const items = itineraryData[currentDay];

        if (items.length === 0) {

            alert('目前 Day ' + currentDay + ' 沒有行程可以分享');

            return;

        }



        let text = `📅 Wanderlust Singapore - Day ${currentDay} 行程規劃\n\n`;

        let currentTime = 9 * 60;



        items.forEach((item, index) => {

            if (index > 0) {

                const transport = calculateTransport(items[index - 1], item);

                currentTime += transport.duration;

            }

            const timeStr = formatTime(currentTime);

            text += `${timeStr} - ${item.title}\n`;

            if (item.note) text += `   (備註: ${item.note})\n`;

            currentTime += 120;

        });



        text += `\n✨ 規劃你的新加坡之旅：https://wanderlust-sg.com`;



        navigator.clipboard.writeText(text).then(() => {

            alert('行程摘要已複製到剪貼簿！');

        }).catch(err => {

            console.error('複製失敗:', err);

            alert('複製失敗，請手動截圖分享。');

        });

    });



    document.getElementById('pdfBtn').addEventListener('click', () => {

        window.print();

    });

}



function initFilterScroll() {

    const slider = document.querySelector('.filter-pills');

    if (!slider) return;



    let isDown = false;

    let startX;

    let scrollLeft;



    slider.addEventListener('mousedown', (e) => {

        isDown = true;

        slider.classList.add('active');

        startX = e.pageX - slider.offsetLeft;

        scrollLeft = slider.scrollLeft;

    });



    slider.addEventListener('mouseleave', () => {

        isDown = false;

        slider.classList.remove('active');

    });



    slider.addEventListener('mouseup', () => {

        isDown = false;

        slider.classList.remove('active');

    });



    slider.addEventListener('mousemove', (e) => {

        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - slider.offsetLeft;

        const walk = (x - startX) * 2;

        slider.scrollLeft = scrollLeft - walk;

    });



    slider.addEventListener('wheel', (e) => {

        e.preventDefault();

        slider.scrollLeft += e.deltaY;

    });

}



function initDragAndDrop() {

    const dropZone = document.getElementById('dropZone');

    if (!dropZone) return;



    dropZone.addEventListener('dragover', (e) => {

        e.preventDefault();

        dropZone.classList.add('drag-over');

    });



    dropZone.addEventListener('dragleave', () => {

        dropZone.classList.remove('drag-over');

    });



    dropZone.addEventListener('drop', (e) => {

        e.preventDefault();

        dropZone.classList.remove('drag-over');



        const sourceId = e.dataTransfer.getData('sourceId');



        if (sourceId) {

            const attraction = allAttractions.find(item => item.id == sourceId);

            if (attraction) {

                addToItinerary(attraction);

            }

        }

    });

}



function handleSourceDragStart(e) {

    e.dataTransfer.setData('sourceId', e.currentTarget.dataset.id);

    e.dataTransfer.effectAllowed = 'copy';

}



function addToItinerary(item) {

    const emptyState = document.querySelector('.empty-state');

    if (emptyState) emptyState.remove();



    const newItem = JSON.parse(JSON.stringify(item));

    if(!newItem.note) newItem.note = '';



    itineraryData[currentDay].push(newItem);



    const sourceCard = document.querySelector(`.source-card[data-id="${item.id}"]`);

    if (sourceCard && !item.isCustom) {

        sourceCard.classList.add('added');

    }



    renderTimeline();

    updateMap();

    updateSummary();



    if (map && item.lat && item.lng) {

        map.panTo({ lat: parseFloat(item.lat), lng: parseFloat(item.lng) });

        map.setZoom(14);

    }

}



let draggedItemIndex = null;



function initSortableTimeline() {

    const container = document.getElementById('dropZone');



    container.addEventListener('dragstart', (e) => {

        const item = e.target.closest('.plan-item');

        if (!item) return;



        draggedItemIndex = parseInt(item.dataset.index);

        e.dataTransfer.effectAllowed = 'move';

        item.classList.add('dragging');

    });



    container.addEventListener('dragend', (e) => {

        const item = e.target.closest('.plan-item');

        if (item) item.classList.remove('dragging');

        draggedItemIndex = null;

    });



    container.addEventListener('dragover', (e) => {

        e.preventDefault();

        const draggingItem = document.querySelector('.dragging');

        if (!draggingItem) return;



        const siblings = [...container.querySelectorAll('.plan-item:not(.dragging)')];

        const nextSibling = siblings.find(sibling => {

            return e.clientY <= sibling.getBoundingClientRect().top + sibling.offsetHeight / 2;

        });



        if (nextSibling) {

            container.insertBefore(draggingItem, nextSibling);

        } else {

            container.appendChild(draggingItem);

        }

    });



    container.addEventListener('drop', (e) => {

        if (!e.dataTransfer.getData('sourceId') && draggedItemIndex !== null) {

            e.preventDefault();



            const newOrderIds = [...container.querySelectorAll('.plan-item')].map(el => {

                return parseInt(el.dataset.index); 

            });



            const currentItems = itineraryData[currentDay];

            const newItems = [];

            

            const domItems = container.querySelectorAll('.plan-item');

            domItems.forEach(el => {

               const originalIndex = parseInt(el.dataset.index);

               newItems.push(currentItems[originalIndex]);

            });



            itineraryData[currentDay] = newItems;



            renderTimeline();

            updateMap();

            updateSummary();

        }

    });

}



function renderTimeline() {

    const container = document.getElementById('dropZone');

    if (!container) return;

    container.innerHTML = '';



    const currentItems = itineraryData[currentDay];



    if (currentItems.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="material-symbols-outlined">drag_indicator</span>

                <p>將左側景點拖曳至此開始規劃 Day ${currentDay}</p>

            </div>

        `;

        return;

    }



    let currentTime = 9 * 60;



    currentItems.forEach((item, index) => {

        if (index > 0) {

            const prevItem = currentItems[index - 1];

            const transport = calculateTransport(prevItem, item);

            currentTime += transport.duration;



            const transportHTML = `

                <div class="transport-info">

                    <span class="icon material-symbols-outlined">${transport.icon}</span>

                    <span>${transport.text}</span>

                    <span class="dots"></span>

                    <span>約 ${transport.duration} 分鐘</span>

                </div>

            `;

            container.insertAdjacentHTML('beforeend', transportHTML);

        }



        const timeStr = formatTime(currentTime);

        currentTime += 120;



        const noteContent = item.note ? item.note : '無備註';

        const noteStyle = item.note ? '' : 'color: #ccc; font-style: italic;';



        const html = `

            <div class="plan-item" draggable="true" data-index="${index}" data-id="${item.id}">

                <div class="time-col">

                    ${timeStr}

                </div>

                <div class="card-wrapper">

                    <img src="${item.image}" alt="${item.title}">

                    <div class="details">

                        <h3>${item.title}</h3>

                        <div class="meta-info">

                            <div class="note">建議停留 2 小時</div>

                            <div class="tags">

                                <span>${item.category}</span>

                            </div>

                        </div>

                        <div class="note-reveal">

                            <p style="${noteStyle}">${noteContent}</p>

                        </div>

                    </div>

                    <div class="btn-group">

                         <button class="edit-btn" onclick="openEditNoteModal(${index})" title="編輯備註">

                            <span class="material-symbols-outlined">edit_note</span>

                        </button>

                        <button class="remove-btn" onclick="removeItem(${index})" title="刪除行程">

                            <span class="material-symbols-outlined">delete</span>

                        </button>

                    </div>

                </div>

            </div>

        `;

        container.insertAdjacentHTML('beforeend', html);

    });

}



function removeItem(index) {

    const items = itineraryData[currentDay];

    const removedItem = items[index];



    items.splice(index, 1);



    let isUsedElsewhere = false;

    Object.values(itineraryData).forEach(dayItems => {

        if (dayItems.some(i => i.id === removedItem.id)) isUsedElsewhere = true;

    });



    if (!isUsedElsewhere && !removedItem.isCustom) {

        const sourceCard = document.querySelector(`.source-card[data-id="${removedItem.id}"]`);

        if (sourceCard) {

            sourceCard.classList.remove('added');

        }

    }



    renderTimeline();

    updateMap();

    updateSummary();



    if (map && items.length > 0) {

        const bounds = new google.maps.LatLngBounds();

        let hasCoords = false;

        items.forEach(item => {

            if (item.lat && item.lng) {

                bounds.extend({ lat: parseFloat(item.lat), lng: parseFloat(item.lng) });

                hasCoords = true;

            }

        });

        if (hasCoords) {

            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

        }

    } else if (map) {

        map.panTo(sgCenter);

        map.setZoom(11);

    }

}



function calculateTransport(start, end) {

    if (!start.lat || !start.lng || !end.lat || !end.lng) {

        return {

            type: 'walk',

            icon: 'more_horiz',

            text: '移動',

            duration: 0

        };

    }



    const R = 6371;

    const dLat = (end.lat - start.lat) * Math.PI / 180;

    const dLon = (end.lng - start.lng) * Math.PI / 180;

    const a =

        Math.sin(dLat / 2) * Math.sin(dLat / 2) +

        Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;



    if (distance < 1.0) {

        return {

            type: 'walk',

            icon: 'directions_walk',

            text: '步行',

            duration: Math.ceil(distance * 15)

        };

    } else {

        return {

            type: 'car',

            icon: 'directions_car',

            text: '開車/計程車',

            duration: Math.ceil(distance * 3) + 5

        };

    }

}



function formatTime(minutes) {

    const h = Math.floor(minutes / 60);

    const m = minutes % 60;

    const ampm = h >= 12 ? 'PM' : 'AM';

    const h12 = h > 12 ? h - 12 : h;

    const mStr = m < 10 ? '0' + m : m;

    return `${h12}:${mStr} ${ampm}`;

}



function updateSummary() {

    let totalTime = 0;

    let currentTime = 0;

    const currentItems = itineraryData[currentDay];



    currentItems.forEach((item, index) => {

        currentTime += 120;

        if (index > 0) {

            const t = calculateTransport(currentItems[index - 1], item);

            currentTime += t.duration;

        }

    });



    const timeEl = document.getElementById('totalTravelTime');

    if (timeEl) timeEl.innerText = `Day ${currentDay} 行程約 ${Math.ceil(currentTime / 60)} 小時`;

}



function initMap() {

    const mapElement = document.getElementById("googleMap");

    if (!mapElement) return;



    map = new google.maps.Map(mapElement, {

        zoom: 11,

        center: sgCenter,

        disableDefaultUI: true,

        styles: [

            {

                "featureType": "poi",

                "elementType": "labels",

                "stylers": [{ "visibility": "off" }]

            }

        ]

    });



    google.maps.event.addListenerOnce(map, 'idle', () => {

        google.maps.event.trigger(map, "resize");

        map.setCenter(sgCenter);

        map.setZoom(11);

    });



    window.addEventListener("resize", () => {

        if (map) {

            const currentCenter = map.getCenter();

            google.maps.event.trigger(map, "resize");

            map.setCenter(currentCenter);

        }

    });

}



function updateMap() {

    if (!map) return;

    google.maps.event.trigger(map, "resize");



    markers.forEach(m => m.setMap(null));

    markers = [];

    if (flightPath) flightPath.setMap(null);



    const pathCoordinates = [];

    const currentItems = itineraryData[currentDay];



    currentItems.forEach((item, index) => {

        if (!item.lat || !item.lng) return;



        const lat = parseFloat(item.lat);

        const lng = parseFloat(item.lng);



        if (isNaN(lat) || isNaN(lng)) return;



        const position = { lat: lat, lng: lng };

        pathCoordinates.push(position);



        const marker = new google.maps.Marker({

            position: position,

            map: map,

            label: (index + 1).toString(),

            title: item.title,

            animation: google.maps.Animation.DROP

        });



        const infoWindow = new google.maps.InfoWindow({

            content: `

                <div class="map-popup-card">

                    <h4>${index + 1}. ${item.title}</h4>

                    <p>${item.category}</p>

                </div>

            `

        });



        marker.addListener("click", () => {

            infoWindow.open(map, marker);

        });



        markers.push(marker);

    });



    if (pathCoordinates.length > 1) {

        flightPath = new google.maps.Polyline({

            path: pathCoordinates,

            geodesic: false,

            strokeColor: "#EA4335",

            strokeOpacity: 1.0,

            strokeWeight: 4,

            icons: []

        });

        flightPath.setMap(map);

    }

}



function initMobileNav() {

    const navItems = document.querySelectorAll('.mobile-nav .nav-item');

    const views = {

        'planner-area': document.querySelector('.planner-area'),

        'sidebar-left': document.querySelector('.sidebar-left'),

        'sidebar-right': document.querySelector('.sidebar-right')

    };



    if (window.innerWidth <= 768) {

        views['planner-area'].classList.add('active-view');

    }



    navItems.forEach(btn => {

        btn.addEventListener('click', () => {

            navItems.forEach(b => b.classList.remove('active'));

            Object.values(views).forEach(v => v.classList.remove('active-view'));



            btn.classList.add('active');

            const targetId = btn.dataset.target;



            let targetView;

            if (targetId === 'sidebar-left') targetView = views['sidebar-left'];

            if (targetId === 'planner-area') targetView = views['planner-area'];

            if (targetId === 'sidebar-right') targetView = views['sidebar-right'];



            if (targetView) {

                targetView.classList.add('active-view');



                if (targetId === 'sidebar-right' && map) {

                    setTimeout(() => {

                        google.maps.event.trigger(map, "resize");

                        if (markers.length > 0) {

                            map.panTo(markers[0].getPosition());

                        } else {

                            map.setCenter(sgCenter);

                        }

                    }, 100);

                }

            }

        });

    });

}



function initMobileLayout() {

    window.addEventListener('resize', () => {

        if (window.innerWidth > 768) {

            document.querySelectorAll('.sidebar-left, .planner-area, .sidebar-right').forEach(el => {

                el.classList.remove('active-view');

                el.style.display = '';

            });

        } else {

            const hasActive = document.querySelector('.active-view');

            if (!hasActive) {

                document.querySelector('.planner-area').classList.add('active-view');

                document.querySelector('.nav-item[data-target="planner-area"]').classList.add('active');

            }

        }

    });

}



function initTabletMapControls() {

    if (document.querySelector('.tablet-map-btn')) return;



    const plannerArea = document.querySelector('.planner-area');

    const sidebarRight = document.querySelector('.sidebar-right');

    const mapContainer = document.querySelector('.map-container');



    if (!plannerArea || !sidebarRight) return;



    const toggleBtn = document.createElement('button');

    toggleBtn.className = 'tablet-map-btn';

    toggleBtn.innerHTML = `

        <span class="material-symbols-outlined">map</span>

        <span>查看地圖</span>

    `;

    document.body.appendChild(toggleBtn);



    const closeBtn = document.createElement('button');

    closeBtn.className = 'map-close-btn';

    closeBtn.innerHTML = `<span class="material-symbols-outlined">close</span>`;

    sidebarRight.appendChild(closeBtn);



    const toggleMap = (show) => {

        if (show) {

            sidebarRight.classList.add('tablet-active');

            toggleBtn.style.display = 'none';

            if (window.map) {

                setTimeout(() => {

                    google.maps.event.trigger(window.map, "resize");

                    if (window.markers && window.markers.length > 0) {

                        const bounds = new google.maps.LatLngBounds();

                        window.markers.forEach(marker => bounds.extend(marker.getPosition()));

                        window.map.fitBounds(bounds);

                    } else {

                        window.map.setCenter({ lat: 1.3521, lng: 103.8198 });

                    }

                }, 300);

            }

        } else {

            sidebarRight.classList.remove('tablet-active');

            setTimeout(() => {

                toggleBtn.style.display = 'flex';

            }, 300);

        }

    };



    toggleBtn.addEventListener('click', () => toggleMap(true));

    closeBtn.addEventListener('click', () => toggleMap(false));



    window.addEventListener('resize', () => {

        if (window.innerWidth > 1280 || window.innerWidth <= 768) {

            sidebarRight.classList.remove('tablet-active');

            toggleBtn.style.display = ''; 

        }

    });

}



window.initMap = initMap;

window.removeItem = removeItem;

window.openEditNoteModal = openEditNoteModal;