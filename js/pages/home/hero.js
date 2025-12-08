document.addEventListener("DOMContentLoaded", () => {
    const heroSection = document.getElementById("portal-hero");
    const triggerZone = heroSection.querySelector(".trigger-zone");

    triggerZone.addEventListener("click", () => {
        heroSection.classList.add("vanish");

        setTimeout(() => {
            heroSection.style.display = "none";
        }, 1000);
    });
});

const initCarousel = () => {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.querySelectorAll('.carousel-slide'));
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const dotsNav = document.querySelector('.carousel-indicators');
    const dots = Array.from(dotsNav.querySelectorAll('.indicator'));

    let currentSlideIndex = 0;
    let autoPlayInterval;

    const updateSlide = (index) => {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');

        currentSlideIndex = index;
    };

    const nextSlide = () => {
        let newIndex = currentSlideIndex + 1;
        if (newIndex >= slides.length) newIndex = 0;
        updateSlide(newIndex);
    };

    const prevSlide = () => {
        let newIndex = currentSlideIndex - 1;
        if (newIndex < 0) newIndex = slides.length - 1;
        updateSlide(newIndex);
    };

    const startAutoPlay = () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(nextSlide, 5000);
    };

    const stopAutoPlay = () => {
        clearInterval(autoPlayInterval);
    };

    nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoPlay();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoPlay();
    });

    dotsNav.addEventListener('click', (e) => {
        const targetDot = e.target.closest('.indicator');
        if (!targetDot) return;

        const targetIndex = dots.findIndex(dot => dot === targetDot);
        updateSlide(targetIndex);
        startAutoPlay();
    });

    startAutoPlay();
};

initCarousel();