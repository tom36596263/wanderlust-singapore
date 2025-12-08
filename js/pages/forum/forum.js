let allArticlesData = [];
let allNewsData = [];
let isSortedByPopularity = true;

document.addEventListener('DOMContentLoaded', async () => {
    initNavTabs();
    initEventListeners();

    await Promise.all([
        loadAndRenderForumArticles(),
        loadAndRenderNews(),
        loadAndRenderAnnouncements()
    ]);
});

function initNavTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.tab-content');

    navItems.forEach(btn => {
        btn.addEventListener('click', function () {
            navItems.forEach(item => item.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            this.classList.add('active');

            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            if (targetId === 'section-3') playAnnouncementAnimation();
        });
    });
}

function initEventListeners() {
    const articleInput = document.getElementById('article-search-input');
    if (articleInput) {
        articleInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = filterData(allArticlesData, keyword);
            renderArticlesHTML(sortArticles(filtered));
        });
    }

    const filterBtn = document.getElementById('article-filter-btn');
    const filterText = filterBtn ? filterBtn.querySelector('.filter-text') : null;
    
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            isSortedByPopularity = !isSortedByPopularity;
            
            if (filterText) {
                filterText.textContent = isSortedByPopularity ? "熱門" : "最新";
            }

            const currentKeyword = articleInput ? articleInput.value.toLowerCase() : "";
            const filtered = filterData(allArticlesData, currentKeyword);
            renderArticlesHTML(sortArticles(filtered));
        });
    }

    const newsInput = document.getElementById('news-search-input');
    if (newsInput) {
        newsInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = allNewsData.filter(item => 
                item.title.toLowerCase().includes(keyword) || 
                item.desc.toLowerCase().includes(keyword)
            );
            renderNewsHTML(filtered);
        });
    }
}

function filterData(data, keyword) {
    if (!keyword) return data;
    return data.filter(item => 
        item.title.toLowerCase().includes(keyword) ||
        item.user.toLowerCase().includes(keyword) ||
        item.tag.toLowerCase().includes(keyword)
    );
}

function sortArticles(data) {
    const sortedData = [...data]; 
    if (isSortedByPopularity) {
        sortedData.sort((a, b) => parseK(b.likes) - parseK(a.likes));
    } else {
        sortedData.sort((a, b) => b.id - a.id);
    }
    return sortedData;
}

function parseK(str) {
    if (typeof str === 'number') return str;
    if (str.includes('k')) {
        return parseFloat(str.replace('k', '')) * 1000;
    }
    return parseFloat(str.replace(/,/g, '')) || 0;
}

async function loadAndRenderForumArticles() {
    try {
        const response = await fetch('./data/articles.json');
        if (!response.ok) throw new Error('Failed to load articles');
        allArticlesData = await response.json();
        
        renderArticlesHTML(sortArticles(allArticlesData));

    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

function renderArticlesHTML(articles) {
    const container = document.getElementById('forum-article-list');
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">沒有找到相關文章。</div>';
        return;
    }

    const html = articles.map(article => {
        const iconName = article.tagIcon || getIconByTag(article.tag);
        const imagesHtml = article.images.slice(0, 3).map(img =>
            `<img src="${img}" alt="preview">`
        ).join('');

        return `
        <article class="article-preview">
            <div class="user">
                <img src="${article.avatar}" alt="${article.user}" class="avatar">
                <div class="user-info">
                    <span class="username">${article.user}</span>
                    <span class="user-describe">${article.desc}</span>
                </div>
                <div class="article-preview-follow">追蹤</div>
            </div>
            
            <a href="forum-article-detail.html?id=${article.id}" class="article-title-link" style="text-decoration:none; color:inherit;">
                <h3 class="article-title">${article.title}</h3>
            </a>

            <a href="forum-article-detail.html?id=${article.id}" class="article-pic">
                ${imagesHtml}
            </a>

            <div class="tag-bar">
                <div class="tag-card">
                    <div class="tag">
                        <span class="tag-icon material-symbols-outlined">${iconName}</span>
                        <span class="tag-text">${article.tag}</span>
                    </div>
                    <span class="tag-number">${article.posts}</span>
                </div>
            </div>

            <div class="article-data">
                <div class="view"><span class="material-symbols-outlined">visibility</span> ${article.views}</div>
                <div class="comment"><span class="material-symbols-outlined">chat_bubble</span> ${article.comments}</div>
                <div class="like"><span class="material-symbols-outlined">thumb_up</span> ${article.likes}</div>
            </div>
        </article>
    `;
    }).join('');

    container.innerHTML = html;
}

async function loadAndRenderNews() {
    try {
        const response = await fetch('./data/news.json');
        if (!response.ok) throw new Error('Failed to load news');
        allNewsData = await response.json();

        allNewsData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        renderNewsHTML(allNewsData);

    } catch (error) {
        console.error('Error loading news:', error);
    }
}

function renderNewsHTML(newsData) {
    const container = document.getElementById('news-container');
    if (!container) return;

    if (newsData.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">沒有找到相關情報。</div>';
        return;
    }

    const html = newsData.map((news, index) => {
        const delay = Math.min(index * 0.1, 0.5);
        return `
            <article class="news-card" style="animation-delay: ${delay}s">
                <div class="news-text">
                    <time class="news-date">${news.displayDate}</time>
                    <h3 class="news-title">
                        <a href="forum-news-detail.html?id=${news.id}" class="news-link">${news.title}</a>
                    </h3>
                    <div class="news-describe">${news.desc}</div>
                    <div class="news-space"></div>
                </div>
                <a href="forum-news-detail.html?id=${news.id}" class="news-img-link">
                    <img src="${news.image}" alt="${news.title}" loading="lazy">
                </a>
            </article>
        `;
    }).join('');

    container.innerHTML = html;
}

async function loadAndRenderAnnouncements() {
    try {
        const response = await fetch('./data/announcements.json');
        if (!response.ok) throw new Error('Failed to load announcements');
        const data = await response.json();

        const targets = {
            'maintenance': 'announcement-maintenance',
            'update': 'announcement-update',
            'community': 'announcement-community'
        };

        for (const [category, elementId] of Object.entries(targets)) {
            const container = document.getElementById(elementId);
            if (!container) continue;

            const items = data
                .filter(item => item.category === category)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            const titleElement = container.querySelector('.announcement-title');
            const titleHTML = titleElement ? titleElement.outerHTML : '';

            const articlesHTML = items.map(item => `
                <article class="announcement-card js-fade-up">
                    <div class="announcement-icon">
                        <span class="icon material-symbols-outlined">${item.icon}</span>
                    </div>
                    <div class="announcement-text">
                        <div class="announcement-describe">
                            <a href="forum-announcement-detail.html?id=${item.id}" class="announcement-link">${item.desc}</a>
                        </div>
                        <time class="announcement-date">${item.date}</time>
                    </div>
                </article>
            `).join('');

            container.innerHTML = titleHTML + articlesHTML;
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

function playAnnouncementAnimation() {
    const cards = document.querySelectorAll('.announcement-card');
    cards.forEach((card, index) => {
        card.classList.remove('js-fade-up');
        void card.offsetWidth;
        const delay = Math.min(index * 0.05, 1);
        card.style.animationDelay = `${delay}s`;
        card.classList.add('js-fade-up');
    });
}

function getIconByTag(tag) {
    const iconMap = {
        "攝影熱點": "photo_camera",
        "親子旅遊": "family_restroom",
        "美食探索": "restaurant",
        "購物指南": "shopping_bag",
        "冒險體驗": "hiking",
        "人文歷史": "history_edu",
        "藝術展覽": "palette",
        "自然生態": "forest",
        "住宿體驗": "hotel",
        "旅遊攻略": "map",
        "休閒娛樂": "attractions",
        "文青咖啡廳": "local_cafe",
        "隱藏景點": "photo_camera",
        "克拉克碼頭": "nightlife",
        "日式拉麵": "ramen_dining"
    };
    return iconMap[tag] || "article";
}