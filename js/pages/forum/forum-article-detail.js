document.addEventListener('DOMContentLoaded', () => {
    initImageSlider();
    initCommentSystem();
});

function initImageSlider() {
    const wrapper = document.querySelector('.slider-wrapper');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const images = document.querySelectorAll('.slider-img');

    if (!wrapper || images.length === 0) return;

    let currentIndex = 0;
    const totalImages = images.length;

    function updateSlider() {
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % totalImages;
        updateSlider();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + totalImages) % totalImages;
        updateSlider();
    });
}

function initCommentSystem() {
    const submitBtn = document.getElementById('submitCommentBtn');
    const commentInput = document.getElementById('commentInput');
    const commentList = document.getElementById('commentList');

    if (submitBtn && commentInput && commentList) {
        submitBtn.addEventListener('click', () => {
            const text = commentInput.value.trim();
            if (text === '') {
                alert('請輸入留言內容！');
                return;
            }
            createComment(text, commentList);
            commentInput.value = '';
        });
    }

    commentList.addEventListener('click', (e) => {
        const menuBtn = e.target.closest('.comment-menu');
        const replyBtn = e.target.closest('.action-reply');
        const deleteBtn = e.target.closest('.action-delete');
        const editBtn = e.target.closest('.action-edit');
        const submitReplyBtn = e.target.closest('.submit-reply-btn');
        const saveEditBtn = e.target.closest('.save-btn');
        const cancelEditBtn = e.target.closest('.cancel-btn');
        const cancelReplyBtn = e.target.closest('.cancel-reply-btn');

        if (menuBtn) {
            e.stopPropagation();
            toggleMenu(menuBtn);
        } else if (deleteBtn) {
            handleDelete(deleteBtn);
        } else if (editBtn) {
            handleEdit(editBtn);
        } else if (replyBtn) {
            showReplyForm(replyBtn);
        } else if (submitReplyBtn) {
            submitReply(submitReplyBtn);
        } else if (cancelReplyBtn) {
            cancelReply(cancelReplyBtn);
        } else if (saveEditBtn) {
            saveEdit(saveEditBtn);
        } else if (cancelEditBtn) {
            cancelEdit(cancelEditBtn);
        } else {
            closeAllMenus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.comment-menu-wrapper')) {
            closeAllMenus();
        }
    });
}

function createComment(text, container) {
    const now = new Date();
    const timeString = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const floorCount = container.querySelectorAll('.comment-group').length + 1;

    const html = `
        <div class="comment-group">
            <article class="comment-card">
                <div class="comment-user-info-bar">
                    <div class="comment-user-info">
                        <img src="https://placehold.co/45x45?text=You" alt="User Avatar">
                        <div class="comment-user-info-text">
                            <span class="comment-user-name">訪客 User</span>
                            <span class="comment-floor">${floorCount}樓</span>
                        </div>
                    </div>
                    <div class="comment-menu-wrapper">
                        <button class="comment-menu">
                            <span class="comment-menu-icon material-symbols-outlined">more_vert</span>
                        </button>
                        <div class="menu-dropdown">
                            <div class="action-edit">編輯</div>
                            <div class="action-delete">刪除</div>
                        </div>
                    </div>
                </div>
                <p class="comment-text">${escapeHtml(text)}</p>
                <div class="comment-data-bar">
                    <time class="comment-time">${timeString}</time>
                    <div class="comment-data">
                        <div class="comment-data-card action-reply">
                            <span class="comment-data-icon material-symbols-outlined">chat_bubble</span>
                            <span class="comment-data-text">回覆</span>
                        </div>
                        <div class="comment-data-card">
                            <span class="comment-data-icon material-symbols-outlined">thumb_up</span>
                            <span class="comment-data-text">0</span>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    `;
    container.insertAdjacentHTML('afterbegin', html);
}

function toggleMenu(btn) {
    const dropdown = btn.nextElementSibling;
    const allDropdowns = document.querySelectorAll('.menu-dropdown');
    
    allDropdowns.forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
    });

    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function closeAllMenus() {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('show'));
}

function handleDelete(btn) {
    if (confirm('確定要刪除此留言嗎？')) {
        const card = btn.closest('.comment-card') || btn.closest('.reply-card');
        const group = btn.closest('.comment-group');
        
        if (card.classList.contains('reply-card')) {
            card.remove();
        } else if (group) {
            group.remove();
        } else {
            card.remove();
        }
    }
}

function handleEdit(btn) {
    closeAllMenus();
    const card = btn.closest('.comment-card') || btn.closest('.reply-card');
    const textElem = card.querySelector('.comment-text, .reply');
    
    if (card.querySelector('.edit-mode-container')) return;

    const currentText = textElem.innerText;
    textElem.style.display = 'none';

    const editHtml = `
        <div class="edit-mode-container">
            <textarea class="edit-textarea">${currentText}</textarea>
            <div class="edit-actions">
                <button class="cancel-btn">取消</button>
                <button class="save-btn">保存</button>
            </div>
        </div>
    `;

    textElem.insertAdjacentHTML('afterend', editHtml);
}

function saveEdit(btn) {
    const editContainer = btn.closest('.edit-mode-container');
    const card = editContainer.parentElement;
    const textElem = card.querySelector('.comment-text, .reply');
    const textarea = editContainer.querySelector('.edit-textarea');
    const newText = textarea.value.trim();

    if (newText !== '') {
        textElem.innerText = newText;
    }

    textElem.style.display = 'block';
    editContainer.remove();
}

function cancelEdit(btn) {
    const editContainer = btn.closest('.edit-mode-container');
    const card = editContainer.parentElement;
    const textElem = card.querySelector('.comment-text, .reply');

    textElem.style.display = 'block';
    editContainer.remove();
}

function showReplyForm(btn) {
    const card = btn.closest('.comment-card') || btn.closest('.reply-card');
    const group = btn.closest('.comment-group');
    
    if (!group) return;

    const existingForm = group.querySelector('.reply-form');
    if (existingForm) {
        existingForm.remove();
    }

    const formHTML = `
        <div class="reply-form">
            <textarea placeholder="撰寫回覆..."></textarea>
            <div class="reply-tool-bar">
                <button class="cancel-reply-btn">取消</button>
                <button class="submit-reply-btn">發送</button>
            </div>
        </div>
    `;

    if (card.classList.contains('comment-card')) {
        card.insertAdjacentHTML('afterend', formHTML);
    } else {
        card.insertAdjacentHTML('afterend', formHTML);
    }
}

function cancelReply(btn) {
    const form = btn.closest('.reply-form');
    if (form) form.remove();
}

function submitReply(btn) {
    const form = btn.closest('.reply-form');
    const textarea = form.querySelector('textarea');
    const text = textarea.value.trim();

    if (text === '') {
        alert('請輸入內容');
        return;
    }

    const now = new Date();
    const timeString = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    const replyHTML = `
        <article class="reply-card">
            <div class="reply-user-info-bar">
                <div class="reply-user-info">
                    <img src="https://placehold.co/30x30?text=You" alt="" style="border-radius:50%">
                    <span class="reply-user-name">訪客 User</span>
                </div>
                <div class="comment-menu-wrapper">
                    <button class="comment-menu">
                        <span class="comment-menu-icon material-symbols-outlined">more_vert</span>
                    </button>
                    <div class="menu-dropdown">
                        <div class="action-edit">編輯</div>
                        <div class="action-delete">刪除</div>
                    </div>
                </div>
            </div>
            <p class="reply">${escapeHtml(text)}</p>
            <div class="reply-data-bar">
                <time class="reply-time">${timeString}</time>
                <div class="reply-data">
                    <div class="reply-data-card action-reply">
                        <span class="reply-data-icon material-symbols-outlined">chat_bubble</span>
                        <span class="reply-data-text">回覆</span>
                    </div>
                    <div class="reply-data-card">
                        <span class="reply-data-icon material-symbols-outlined">thumb_up</span>
                        <span class="reply-data-text">0</span>
                    </div>
                </div>
            </div>
        </article>
    `;

    form.insertAdjacentHTML('beforebegin', replyHTML);
    form.remove();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) {
        return map[m];
    });
}