/* js/layout/nav.js */

document.addEventListener('DOMContentLoaded', () => {
    const menuOverlay = document.getElementById('menu-overlay');

    const avatarBtn = document.getElementById('avatar-btn');
    const sideMenu = document.getElementById('user-side-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNavList = document.getElementById('main-nav-list');
    const closeMobileMenuBtn = document.getElementById('close-mobile-menu');

    const accHeaders = document.querySelectorAll('.acc-header');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    const authBtn = document.getElementById('auth-btn');
    const authText = document.getElementById('auth-text');
    const authIcon = document.getElementById('auth-icon');

    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error-msg');

    let isLoggedIn = false;

    function closeAllMenus() {
        if (sideMenu) sideMenu.classList.remove('is-active');
        if (mainNavList) mainNavList.classList.remove('is-active');
        if (menuOverlay) menuOverlay.classList.remove('is-active');

        document.body.style.overflow = '';

        document.querySelectorAll('.nav-list > li.is-open').forEach(li => {
            li.classList.remove('is-open');
        });
    }

    function openSideMenu() {
        if (mainNavList) mainNavList.classList.remove('is-active');

        if (sideMenu) sideMenu.classList.add('is-active');
        if (menuOverlay) menuOverlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function openMobileMenu() {
        if (sideMenu) sideMenu.classList.remove('is-active');

        if (mainNavList) mainNavList.classList.add('is-active');
        if (menuOverlay) menuOverlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function openLoginModal() {
        if (loginModal) loginModal.classList.add('is-active');
        closeAllMenus();
    }

    function closeLoginModal() {
        if (loginModal) loginModal.classList.remove('is-active');
        if (errorMsg) errorMsg.textContent = '';
    }

    function performLogin() {
        isLoggedIn = true;

        if (authText) authText.textContent = '登出';
        if (authIcon) authIcon.textContent = 'logout';
        if (avatarBtn) avatarBtn.classList.add('is-logged-in');

        closeLoginModal();
        if (loginForm) loginForm.reset();

        alert('歡迎回來！');
    }

    function performLogout() {
        isLoggedIn = false;

        if (authText) authText.textContent = '登入';
        if (authIcon) authIcon.textContent = 'account_circle';
        if (avatarBtn) avatarBtn.classList.remove('is-logged-in');

        alert('您已成功登出');
    }

    if (avatarBtn) {
        avatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSideMenu();
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openMobileMenu();
        });
    }

    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeAllMenus);
    if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', closeAllMenus);
    if (menuOverlay) menuOverlay.addEventListener('click', closeAllMenus);

    accHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('is-open');
        });
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    if (authBtn) {
        authBtn.addEventListener('click', () => {
            if (isLoggedIn) {
                performLogout();
            } else {
                openLoginModal();
            }
        });
    }

    if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLoginModal);

    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeLoginModal();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email').value;
            const pwdInput = document.getElementById('password').value;

            if (emailInput === '123456789@gmail.com' && pwdInput === '123456789') {
                performLogin();
            } else {
                if (errorMsg) errorMsg.textContent = '帳號或密碼錯誤，請再試一次。';

                const box = document.querySelector('.login-box');
                if (box) {
                    box.classList.remove('shake');
                    void box.offsetWidth;
                    box.classList.add('shake');
                }
            }
        });
    }

    const gallery = document.querySelector('.image-gallery');
    const navItems = document.querySelectorAll('.navigation-list li');

    if (gallery && navItems.length > 0) {
        const galleryHalfHeight = gallery.offsetHeight / 2;
        navItems.forEach(item => {
            item.addEventListener('mouseover', () => {
                const targetId = item.getAttribute('data-target');
                const targetImage = document.getElementById(targetId);
                if (targetImage) {
                    const imageTop = targetImage.offsetTop;
                    const imageHeight = targetImage.offsetHeight;
                    const targetCenter = imageTop + (imageHeight / 2);

                    gallery.scrollTo({
                        top: targetCenter - galleryHalfHeight,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    const mobileNavLinks = document.querySelectorAll('.nav-list > li > a');

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;

            const submenu = link.nextElementSibling;

            if (submenu && (submenu.tagName === 'UL' || submenu.classList.contains('explore-submenu'))) {
                e.preventDefault();

                const parentLi = link.parentElement;
                const isOpen = parentLi.classList.contains('is-open');

                document.querySelectorAll('.nav-list > li.is-open').forEach(otherLi => {
                    if (otherLi !== parentLi) {
                        otherLi.classList.remove('is-open');
                    }
                });

                if (!isOpen) {
                    parentLi.classList.add('is-open');
                } else {
                    parentLi.classList.remove('is-open');
                }
            }
        });
    });
});

const mLangBtn = document.querySelectorAll(".lang-btn");
mLangBtn.forEach(clickedBtn => { 
    clickedBtn.addEventListener('click', () => {
        for (const otherBtn of mLangBtn) {
            if (otherBtn === clickedBtn) {
                otherBtn.classList.add("active");
            } else {
                otherBtn.classList.remove("active");
            }
        }
    });
});