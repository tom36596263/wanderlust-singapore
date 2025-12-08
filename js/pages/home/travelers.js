// 初始化空陣列，等待 JSON 資料載入
let travelersData = [];

const state = {
    filters: {
        location: 'all',
        month: 'all',
        hobby: 'all'
    },
    search: ''
};

const tagsMapping = {
    'Foodie': '吃貨',
    'Photography': '拍照',
    'History': '歷史',
    'Shopping': '購物',
    'Nature': '自然',
    'Art': '藝術'
};

// 取得 DOM 元素
const track = document.getElementById('travelersTrack');
const viewport = document.getElementById('carouselViewport');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const searchInput = document.getElementById('searchInput');
const filterGroups = document.querySelectorAll('.filter-group');

// 非同步載入 JSON 資料
async function fetchTravelersData() {
    try {
        const response = await fetch('./data/travelers.json');
        if (!response.ok) {
            throw new Error('無法載入旅伴資料');
        }
        travelersData = await response.json();
        render(); // 資料載入完成後進行渲染
    } catch (error) {
        console.error('Fetch error:', error);
        track.innerHTML = '<div class="no-result-message">資料載入失敗，請稍後再試。</div>';
    }
}

function render() {
    track.innerHTML = '';

    const filtered = travelersData.filter(traveler => {
        const matchLoc = state.filters.location === 'all' || traveler.location === state.filters.location;
        const matchDate = state.filters.month === 'all' || traveler.month === state.filters.month;
        const matchHobby = state.filters.hobby === 'all' || traveler.tags.includes(state.filters.hobby);
        const matchSearch = state.search === '' ||
            traveler.name.toLowerCase().includes(state.search.toLowerCase()) ||
            traveler.intro.includes(state.search);

        return matchLoc && matchDate && matchHobby && matchSearch;
    });

    if (filtered.length === 0) {
        track.innerHTML = '<div class="no-result-message">沒有找到符合條件的旅伴</div>';
        updateNavButtonsState();
        return;
    }

    filtered.forEach(t => {
        const tagHTML = t.tags.map(tag => `<span class="tag">${tagsMapping[tag] || tag}</span>`).join('');

        const card = document.createElement('article');
        card.className = 'traveler-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="avatar">
                    <img src="${t.avatar}" alt="${t.name}">
                </div>
                <div class="info">
                    <div class="name-row">
                        <h3>${t.name}</h3>
                        <span class="material-symbols-outlined verify-icon">check_circle</span>
                    </div>
                    <time>${t.date}</time>
                </div>
            </div>
            <p class="intro">${t.intro}</p>
            <div class="tags">${tagHTML}</div>
            <button class="contact-btn">聯絡</button>
        `;
        track.appendChild(card);
    });

    updateNavButtonsState();
}

function updateNavButtonsState() {
    if (viewport.scrollLeft <= 0) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }

    // 寬容度設定 5px，避免浮點數運算導致按鈕無法鎖定
    if (viewport.scrollLeft + viewport.clientWidth >= track.scrollWidth - 5) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
}

// 事件監聽器設定
prevBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: -viewport.clientWidth, behavior: 'smooth' });
});

nextBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: viewport.clientWidth, behavior: 'smooth' });
});

viewport.addEventListener('scroll', updateNavButtonsState);

searchInput.addEventListener('input', (e) => {
    state.search = e.target.value;
    render();
    viewport.scrollTo({ left: 0 }); // 搜尋後重置捲軸位置
});

filterGroups.forEach(group => {
    const btn = group.querySelector('.filter-btn');
    const menu = group.querySelector('.dropdown-menu');
    const labelSpan = group.querySelector('.btn-text');
    const type = group.id.replace('Filter', '').toLowerCase();

    const stateKey = type === 'date' ? 'month' : (type === 'hobby' ? 'hobby' : 'location');

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown-menu').forEach(m => {
            if (m !== menu) m.classList.remove('show');
        });
        menu.classList.toggle('show');
    });

    menu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.value;
            const text = item.innerText;

            state.filters[stateKey] = value;
            labelSpan.innerText = text;
            labelSpan.style.color = value === 'all' ? '#333' : '#479E82';

            menu.classList.remove('show');
            render();
            viewport.scrollTo({ left: 0 });
        });
    });
});

// 點擊空白處關閉下拉選單
document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
});

// 視窗調整大小時更新按鈕狀態
window.addEventListener('resize', updateNavButtonsState);

// 頁面載入時執行 Fetch
document.addEventListener('DOMContentLoaded', () => {
    fetchTravelersData();
});