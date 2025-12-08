document.addEventListener('DOMContentLoaded', async () => {
    initNavTabs();
    initTagTabs();
    
    await Promise.all([
        loadAndRenderForumArticles(),
        loadAndRenderNews(),
        loadAndRenderAnnouncements()
    ]);
});

function initNavTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
        btn.addEventListener('click', function() {
            navItems.forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            this.classList.add('active');

            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            if (targetId === 'section-3') {
                playAnnouncementAnimation();
            }
        });
    });
}

function initTagTabs() {
    const tagCards = document.querySelectorAll('.tag-bar .tag-card');
    const articleGroups = document.querySelectorAll('.article-group');

    tagCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();

            tagCards.forEach(t => t.classList.remove('active'));
            card.classList.add('active');

            articleGroups.forEach(group => group.classList.remove('active'));

            const targetId = card.getAttribute('data-target');
            const targetGroup = document.getElementById(targetId);
            if (targetGroup) {
                targetGroup.classList.add('active');
            }
        });
    });
}

function playAnnouncementAnimation() {
    const items = document.querySelectorAll('#section-3 .announcement-title, #section-3 .announcement-card');
    items.forEach((item, index) => {
        item.classList.remove('js-fade-up');
        void item.offsetWidth;
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('js-fade-up');
    });
}

function getIconByTag(tag) {
    switch (tag) {
        case "攝影熱點": return "photo_camera";
        case "親子旅遊": return "family_restroom";
        case "美食探索": return "restaurant";
        case "購物指南": return "shopping_bag";
        case "冒險體驗": return "hiking";
        case "人文歷史": return "history_edu";
        case "藝術展覽": return "palette";
        case "自然生態": return "forest";
        case "住宿體驗": return "hotel";
        case "旅遊攻略": return "map";
        case "休閒娛樂": return "attractions";
        case "文青咖啡廳": return "local_cafe";
        case "隱藏景點": return "photo_camera";
        case "克拉克碼頭": return "nightlife";
        case "日式拉麵": return "ramen_dining";
        default: return "article";
    }
}

async function loadAndRenderForumArticles() {
    try {
        const response = await fetch('./data/articles.json');
        if (!response.ok) throw new Error('Failed to load articles data');

        const articles = await response.json();

        const categories = {
            'cafe': 'content-cafe',
            'hidden': 'content-hidden',
            'clarke': 'content-clarke',
            'ramen': 'content-ramen'
        };

        for (const [catKey, containerId] of Object.entries(categories)) {
            const container = document.getElementById(containerId);
            if (!container) continue;

            let filteredArticles = [];

            if (catKey === 'clarke') {
                filteredArticles = articles.filter(item => 
                    item.category === 'clarke' || item.attractionId === 16
                );
            } else {
                filteredArticles = articles.filter(item => item.category === catKey);
            }

            const html = filteredArticles.map(article => {
                const iconName = article.tagIcon || getIconByTag(article.tag);
                
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
                    
                    <a href="forum-article-detail.html" class="article-title-link" style="text-decoration:none; color:inherit;">
                        <h3 class="article-title">${article.title}</h3>
                    </a>

                    <a href="forum-article-detail.html" class="article-pic">
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
            `}).join('');

            container.innerHTML = html;
        }

    } catch (error) {
        console.error('Error loading forum articles:', error);
    }
}

async function loadAndRenderNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    try {
        const response = await fetch('./data/news.json');
        if (!response.ok) throw new Error('Failed to load news data');
        const allNews = await response.json();

        const today = new Date('2025-12-05').getTime();

        const upcoming = allNews.filter(item => new Date(item.startDate).getTime() >= today);
        const past = allNews.filter(item => new Date(item.startDate).getTime() < today);

        upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        past.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

        const displayNews = [...upcoming, ...past].slice(0, 5);

        const html = displayNews.map((news, index) => {
            const delay = index * 0.2;
            return `
                <article class="news-card" style="animation-delay: ${delay}s">
                    <div class="news-text">
                        <time class="news-date">${news.displayDate}</time>
                        <h3 class="news-title">
                            <a href="forum-news-detail.html" class="news-link">${news.title}</a>
                        </h3>
                        <div class="news-describe">${news.desc}</div>
                        <div class="news-space"></div>
                    </div>
                    <a href="forum-news-detail.html" class="news-img-link">
                        <img src="${news.image}" alt="${news.title}">
                    </a>
                </article>
            `;
        }).join('');

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = '<p style="text-align:center; padding:20px;">暫時無法載入最新消息。</p>';
    }
}

async function loadAndRenderAnnouncements() {
    try {
        const response = await fetch('./data/announcements.json');
        if (!response.ok) throw new Error('Failed to load announcements data');
        
        const data = await response.json();

        const targets = {
            'maintenance': 'announcement-maintenance',
            'update': 'announcement-update',
            'community': 'announcement-community'
        };

        for (const [category, elementId] of Object.entries(targets)) {
            const container = document.getElementById(elementId);
            if (!container) continue;

            const items = data.filter(item => item.category === category);
            
            // 日期排序 (新到舊)
            items.sort((a, b) => new Date(b.date) - new Date(a.date));

            // 只取前三筆
            const recentItems = items.slice(0, 3);
            
            const titleElement = container.querySelector('.announcement-title');
            const titleHTML = titleElement ? titleElement.outerHTML : '';
            
            const articlesHTML = recentItems.map(item => `
                <article class="announcement-card">
                    <div class="announcement-icon">
                        <span class="icon material-symbols-outlined">${item.icon}</span>
                    </div>
                    <div class="announcement-text">
                        <div class="announcement-describe">
                            <a href="forum-announcement-detail.html" class="announcement-link">${item.desc}</a>
                        </div>
                        <time class="announcement-date">${item.date}</time>
                    </div>
                </article>
            `).join('');

            container.innerHTML = titleHTML + articlesHTML;
        }

    } catch (error) {
        console.error(error);
    }
}