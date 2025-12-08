let attractionsData = [];
let reviewsData = [];
let articlesData = [];

let currentAttraction = {};

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAllData();
    
    loadCurrentAttractionModel();
    
    renderDynamicTitles();
    renderOverview();
    renderReviews();
    renderArticles();
    
    initTabs();
    initHorizontalScroll();
    initDescriptionAccordion();
    initModal();
});

async function fetchAllData() {
    try {
        const [attractionsRes, reviewsRes, articlesRes] = await Promise.all([
            fetch('./data/attractions.json'),
            fetch('./data/reviews.json'),
            fetch('./data/articles.json')
        ]);

        if (!attractionsRes.ok || !reviewsRes.ok || !articlesRes.ok) {
            throw new Error('One or more data files failed to load');
        }

        attractionsData = await attractionsRes.json();
        reviewsData = await reviewsRes.json();
        articlesData = await articlesRes.json();

    } catch (error) {
        console.error(error);
    }
}

function loadCurrentAttractionModel() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));

    if (id && attractionsData.length > 0) {
        const found = attractionsData.find(item => item.id === id);
        if (found) {
            currentAttraction = found;
        } else {
            currentAttraction = attractionsData[0];
        }
    } else if (attractionsData.length > 0) {
        currentAttraction = attractionsData[0];
    }
}

function renderDynamicTitles() {
    if (!currentAttraction || !currentAttraction.title) return;
    document.title = `${currentAttraction.title} - 景點介紹`;

    const category = currentAttraction.category;
    let highlightsTitle = "特色亮點";

    if (category === "美食饗宴") highlightsTitle = "必吃美食";
    else if (category === "購物時尚") highlightsTitle = "購物熱點";
    else if (category === "休閒娛樂") highlightsTitle = "精彩體驗";
    else highlightsTitle = "特色亮點";

    const titleElement = document.getElementById('highlights-title');
    if (titleElement) {
        titleElement.textContent = highlightsTitle;
    }
}

function initHorizontalScroll() {
    const container = document.getElementById('highlights-container');
    if (!container) return;
    container.addEventListener('wheel', (evt) => {
        if (Math.abs(evt.deltaY) > Math.abs(evt.deltaX)) {
            evt.preventDefault();
            container.scrollLeft += evt.deltaY;
        }
    }, { passive: false });
}

function initDescriptionAccordion() {
    const btn = document.getElementById('desc-toggle-btn');
    const fullDesc = document.getElementById('ov-desc-full');
    if (!btn || !fullDesc) return;
    btn.addEventListener('click', () => {
        const isHidden = fullDesc.style.display === '' || fullDesc.style.display === 'none';
        if (isHidden) {
            fullDesc.style.display = 'block';
            btn.innerHTML = '收起介紹 <span class="material-symbols-outlined icon" style="transform: rotate(180deg)">expand_more</span>';
        } else {
            fullDesc.style.display = 'none';
            btn.innerHTML = '閱讀詳細介紹 <span class="material-symbols-outlined icon">expand_more</span>';
        }
    });
}

function initModal() {
    const modal = document.getElementById('highlight-modal');
    const closeBtn = document.getElementById('modal-close');
    if (!modal || !closeBtn) return;
    const closeModal = () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    };
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
}

window.openHighlightModal = function(index) {
    if (!currentAttraction.highlights || !currentAttraction.highlights[index]) return;
    const data = currentAttraction.highlights[index];
    const modal = document.getElementById('highlight-modal');
    const img = document.getElementById('modal-img');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');

    if (img) img.src = data.img;
    if (title) title.textContent = data.title;
    if (desc) desc.textContent = data.long_desc;

    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function renderOverview() {
    if (!currentAttraction || Object.keys(currentAttraction).length === 0) return;
    
    const heroImg = document.getElementById('hero-img');
    const ovTitle = document.getElementById('ov-title');
    const ovDescShort = document.getElementById('ov-desc-short');
    const ovDescFull = document.getElementById('ov-desc-full');
    const infoTime = document.getElementById('info-time');
    const infoTicket = document.getElementById('info-ticket');
    const infoAddress = document.getElementById('info-address');
    const infoTransport = document.getElementById('info-transport');
    const ovRating = document.getElementById('ov-rating');
    const ovPosts = document.getElementById('ov-posts');

    if (heroImg) heroImg.src = currentAttraction.image;
    if (ovTitle) ovTitle.textContent = currentAttraction.title;
    if (ovDescShort) ovDescShort.textContent = currentAttraction.desc;
    if (ovDescFull) ovDescFull.innerHTML = currentAttraction.full_intro;
    if (infoTime) infoTime.textContent = currentAttraction.info.time;
    if (infoTicket) infoTicket.textContent = currentAttraction.info.ticket;
    if (infoAddress) infoAddress.textContent = currentAttraction.info.address;
    if (infoTransport) infoTransport.textContent = currentAttraction.info.transport;
    if (ovRating) ovRating.textContent = currentAttraction.rating;
    if (ovPosts) ovPosts.textContent = currentAttraction.posts;

    const highlightsContainer = document.getElementById('highlights-container');
    if (highlightsContainer && currentAttraction.highlights) {
        let highlightsHTML = '';
        currentAttraction.highlights.forEach((item, index) => {
            highlightsHTML += `
                <div class="highlight-card" onclick="openHighlightModal(${index})">
                    <img src="${item.img}" alt="${item.title}">
                    <div class="highlight-info">
                        <h3>${item.title}</h3>
                        <p>${item.desc}</p>
                    </div>
                </div>
            `;
        });
        highlightsContainer.innerHTML = highlightsHTML;
    }
}

function renderReviews() {
    const container = document.getElementById('reviews-list');
    if (!container || !currentAttraction.id) return;

    const filteredReviews = reviewsData.filter(review => review.attractionId === currentAttraction.id);

    if (filteredReviews.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding: 20px;">目前尚無評論，成為第一個評論的人吧！</p>';
        return;
    }

    let html = '';
    filteredReviews.forEach(review => {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                starsHtml += '<span class="material-symbols-outlined filled">star</span>';
            } else {
                starsHtml += '<span class="material-symbols-outlined">star</span>';
            }
        }

        html += `
            <div class="review-item">
                <img src="${review.avatar}" class="review-avatar" alt="${review.user}">
                <div class="review-content">
                    <div class="review-header">
                        <span class="review-user">${review.user}</span>
                        <span class="review-time">${review.time}</span>
                    </div>
                    <div class="review-stars">${starsHtml}</div>
                    <p class="review-text">${review.content}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// 輔助函式：根據標籤回傳對應的 Material Symbol Icon 名稱
function getIconByTag(tag) {
    switch (tag) {
        case "攝影熱點":
            return "photo_camera";
        case "親子旅遊":
            return "family_restroom"; // 或 child_care
        case "美食探索":
            return "restaurant";
        case "購物指南":
            return "shopping_bag";
        case "冒險體驗":
            return "hiking"; // 或 landscape
        case "人文歷史":
            return "history_edu"; // 或 temple_buddhist
        case "藝術展覽":
            return "palette";
        case "自然生態":
            return "forest";
        case "住宿體驗":
            return "hotel";
        case "旅遊攻略":
            return "map";
        case "休閒娛樂":
            return "attractions";
        default:
            return "article"; // 預設圖示
    }
}

function renderArticles() {
    const container = document.getElementById('articles-list');
    if (!container) return;
    
    // 篩選出屬於當前景點的文章
    // 如果文章資料沒有 attractionId，或者找不到對應的文章，可以考慮顯示全部或顯示"尚無文章"
    const filteredArticles = articlesData.filter(article => {
        // 如果 currentAttraction 有 id 且 article 有 attractionId，則進行比對
        if (currentAttraction.id && article.attractionId) {
            return article.attractionId === currentAttraction.id;
        }
        // 如果資料中沒有 attractionId，為了相容舊資料，可以選擇不篩選或不顯示
        // 這裡示範：如果該文章沒有 attractionId，暫時不顯示，以免混雜
        return false; 
    });

    // 如果篩選後沒有文章，顯示提示訊息
    if (filteredArticles.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding: 20px;">此景點目前尚無相關文章。</p>';
        return;
    }

    let html = '';
    filteredArticles.forEach(article => {
        const articleUrl = `article.html?id=${article.id}`;
        
        // 取得動態 Icon
        const iconName = getIconByTag(article.tag);
        
        html += `
        <article class="article-preview">
            <div class="user">
                <img src="${article.avatar}" alt="${article.user}" class="avatar">
                <div class="user-info">
                    <span class="username">${article.user}</span>
                    <span class="user-describe">${article.desc}</span>
                </div>
                <div class="article-preview-follow">追蹤</div>
            </div>
            <a href="${articleUrl}" class="article-title">${article.title}</a>
            <a href="${articleUrl}" class="article-pic">
                ${article.images.map(img => `<img src="${img}" alt="preview">`).join('')}
            </a>
            <div class="tag-bar">
                <a href="#" class="tag-card">
                    <div class="tag">
                        <span class="tag-icon material-symbols-outlined">${iconName}</span>
                        <span class="tag-text">${article.tag}</span>
                    </div>
                    <span class="tag-number">${article.posts}</span>
                </a>
            </div>
            <div class="article-data">
                <div class="view"><span class="material-symbols-outlined">visibility</span> ${article.views}</div>
                <div class="comment"><span class="material-symbols-outlined">chat_bubble</span> ${article.comments}</div>
                <div class="like"><span class="material-symbols-outlined">thumb_up</span> ${article.likes}</div>
            </div>
        </article>
        `;
    });
    container.innerHTML = html;
}

function initTabs() {
    const tabs = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            window.scrollTo(0, 0);
        });
    });
}