document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mainNavLinks = document.querySelector('.main-nav-links');
    const submenuLinks = document.querySelectorAll('.submenu > a');

    hamburger.addEventListener('click', (event) => {
        event.stopPropagation();
        mainNavLinks.classList.toggle('active');
        if (!mainNavLinks.classList.contains('active')) {
            document.querySelectorAll('.submenu.active-submenu').forEach(submenu => {
                submenu.classList.remove('active-submenu');
            });
        }
    });

    submenuLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const clickedSubmenu = this.closest('.submenu');
            const isCurrentlyActive = clickedSubmenu.classList.contains('active-submenu');
            document.querySelectorAll('.submenu.active-submenu').forEach(submenu => {
                if (submenu !== clickedSubmenu) {
                    submenu.classList.remove('active-submenu');
                }
            });
            if (isCurrentlyActive) {
                clickedSubmenu.classList.remove('active-submenu');
            } else {
                clickedSubmenu.classList.add('active-submenu');
            }
        });
    });

    document.addEventListener('click', function(event) {
        const target = event.target;
        if (mainNavLinks.classList.contains('active') &&
            !mainNavLinks.contains(target) &&
            !hamburger.contains(target)) {
            mainNavLinks.classList.remove('active');
            document.querySelectorAll('.submenu.active-submenu').forEach(submenu => {
                submenu.classList.remove('active-submenu');
            });
        }
        if (!target.closest('.submenu') && !hamburger.contains(target)) {
            document.querySelectorAll('.submenu.active-submenu').forEach(submenu => {
                submenu.classList.remove('active-submenu');
            });
        }
    });

    let currentIndex = 0;
    let slideInterval;
    let animationFrameId = null;
    const animationDuration = 500;
    let startTime = null;
    let startPosition = 0;
    let endPosition = 0;

    const carouselImages = document.querySelector('.carousel-images');
    const slides = document.querySelectorAll('.carousel-slide');
    const totalOriginalSlides = 3;

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    function startSlideShow() {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            moveSlide(1);
        }, 5000);
    }

    function animateSlide(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);
        const currentAnimatedPosition = startPosition + (endPosition - startPosition) * easedProgress;
        carouselImages.style.transform = `translateX(${currentAnimatedPosition}%)`;
        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animateSlide);
        } else {
            carouselImages.style.transform = `translateX(${endPosition}%)`;
            startTime = null;
            animationFrameId = null;
            if (endPosition <= -(totalOriginalSlides * 100)) {
                currentIndex = currentIndex % totalOriginalSlides;
                carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
                prevTranslate = -currentIndex * 100;
            } else if (endPosition > 0) {
                currentIndex = totalOriginalSlides - 1;
                carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
                prevTranslate = -currentIndex * 100;
            }
        }
    }

    function moveSlide(direction) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            startTime = null;
        }

        const currentTransform = window.getComputedStyle(carouselImages).transform;
        let matrix = new WebKitCSSMatrix(currentTransform);
        startPosition = matrix.m41 / carouselImages.offsetWidth * 100;

        let newIndex = currentIndex + direction;

        if (direction > 0) {
            if (newIndex >= totalOriginalSlides) {
                endPosition = -newIndex * 100;
            } else {
                endPosition = -newIndex * 100;
            }
        } else {
            if (newIndex < 0) {
                currentIndex = totalOriginalSlides;
                carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
                startPosition = -currentIndex * 100;
                newIndex = totalOriginalSlides - 1;
            }
            endPosition = -newIndex * 100;
        }

        currentIndex = newIndex;

        animationFrameId = requestAnimationFrame(animateSlide);
        startSlideShow();
    }

    function addDragListeners() {
        carouselImages.addEventListener('mousedown', dragStart);
        carouselImages.addEventListener('mouseup', dragEnd);
        carouselImages.addEventListener('mouseleave', dragEnd);
        carouselImages.addEventListener('mousemove', drag);
        carouselImages.addEventListener('touchstart', dragStart);
        carouselImages.addEventListener('touchend', dragEnd);
        carouselImages.addEventListener('touchmove', drag);
        carouselImages.addEventListener('dragstart', (e) => e.preventDefault());
    }

    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    function dragStart(event) {
        clearInterval(slideInterval);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            startTime = null;
        }

        isDragging = true;
        startX = getPositionX(event);

        const currentTransform = window.getComputedStyle(carouselImages).transform;
        let matrix = new WebKitCSSMatrix(currentTransform);
        prevTranslate = matrix.m41 / carouselImages.offsetWidth * 100;
    }

    function drag(event) {
        if (!isDragging) return;
        event.preventDefault();
        const currentX = getPositionX(event);
        const deltaX = currentX - startX;
        currentTranslate = prevTranslate + (deltaX / carouselImages.offsetWidth) * 100;
        carouselImages.style.transform = `translateX(${currentTranslate}%)`;
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;

        const movedBy = currentTranslate - prevTranslate;
        const slideWidthPercentage = 100;

        if (movedBy < -slideWidthPercentage / 4) {
            moveSlide(1);
        } else if (movedBy > slideWidthPercentage / 4) {
            moveSlide(-1);
        } else {
            const currentSnapIndex = Math.round(-prevTranslate / 100);
            currentIndex = currentSnapIndex;
            endPosition = -currentIndex * 100;
            startPosition = currentTranslate;
            animationFrameId = requestAnimationFrame(animateSlide);
            startSlideShow();
        }
    }

    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');

    if (prevButton) {
        prevButton.addEventListener('click', () => moveSlide(-1));
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => moveSlide(1));
    }

    addDragListeners();
    startSlideShow();

    let sitesAbertos = false;
    let indiceAberto = false;

    function exibeBusca() {
        const formBusca = document.getElementById("formBusca");
        const formBusca2 = document.getElementById("formBusca2");

        if (formBusca) {
            formBusca.style.display = 'none';
        }
        if (formBusca2) {
            formBusca2.style.display = 'block';
        }
    }

    function exibeSites() {
        const sitesElement = document.getElementById("sites");
        if (sitesElement) {
            if (!sitesAbertos) {
                sitesElement.style.display = 'block';
                sitesAbertos = true;
            } else {
                sitesElement.style.display = 'none';
                sitesAbertos = false;
            }
        }
    }

    function verIndice() {
        const indiceAtualElement = document.getElementById("indiceAtual");
        if (indiceAtualElement) {
            if (!indiceAberto) {
                indiceAtualElement.style.display = 'block';
                indiceAberto = true;
            } else {
                indiceAtualElement.style.display = 'none';
                indiceAberto = false;
            }
        }
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        const sitesButton = document.querySelector('[onclick="exibeSites()"]');
        const sitesElement = document.getElementById("sites");
        if (sitesAbertos && sitesElement && !sitesElement.contains(target) && (!sitesButton || !sitesButton.contains(target))) {
            sitesElement.style.display = 'none';
            sitesAbertos = false;
        }
        const indiceButton = document.querySelector('[onclick="verIndice()"]');
        const indiceAtualElement = document.getElementById("indiceAtual");
        if (indiceAberto && indiceAtualElement && !indiceAtualElement.contains(target) && (!indiceButton || !indiceButton.contains(target))) {
            indiceAtualElement.style.display = 'none';
            indiceAberto = false;
        }
    });
});
