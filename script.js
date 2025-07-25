function toggleMenu() {
    document.querySelector('.main-nav-links').classList.toggle('active');
}

// Função para alternar submenus
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona event listener para os submenus
    const submenuParents = document.querySelectorAll('.submenu > a'); // Seleciona apenas os links diretos dentro de .submenu

    submenuParents.forEach(link => {
        link.addEventListener('click', function(event) {
            // Previne o comportamento padrão do link (ir para #)
            event.preventDefault();

            // Encontra o elemento pai <li>.submenu
            const parentSubmenu = this.closest('.submenu');

            // Verifica se está em modo mobile (media query)
            if (window.matchMedia("(max-width: 768px)").matches) {
                // Fecha qualquer outro submenu aberto antes de abrir este
                document.querySelectorAll('.submenu.active-submenu').forEach(otherSubmenu => {
                    if (otherSubmenu !== parentSubmenu) { // Não fechar o próprio submenu
                        otherSubmenu.classList.remove('active-submenu');
                    }
                });
                
                // Alterna a classe 'active-submenu' no <li>.submenu
                parentSubmenu.classList.toggle('active-submenu');
            } else {
                // Em telas maiores, o hover já cuida do submenu, então não fazemos nada
            }
        });
    });

    // Código para fechar o menu ao clicar fora
    document.addEventListener('click', function(event) {
        const mainNavLinks = document.querySelector('.main-nav-links');
        const hamburger = document.querySelector('.hamburger');

        // Verifica se o clique não foi dentro do menu ou no hambúrguer
        if (!mainNavLinks.contains(event.target) && !hamburger.contains(event.target) && mainNavLinks.classList.contains('active')) {
            mainNavLinks.classList.remove('active'); // Fecha o menu principal

            // Fecha todos os submenus abertos também
            document.querySelectorAll('.submenu.active-submenu').forEach(submenu => {
                submenu.classList.remove('active-submenu');
            });
        }
         // Fecha submenus ao clicar fora deles, mesmo se o menu principal não estiver aberto
        const clickedInsideSubmenu = event.target.closest('.submenu');
        document.querySelectorAll('.submenu.active-submenu').forEach(submenu => {
            if (!clickedInsideSubmenu || !submenu.contains(clickedInsideSubmenu)) {
                submenu.classList.remove('active-submenu');
            }
        });
    });

    // ... restante do seu código JavaScript (carrossel, drag & drop) ...
});

let currentIndex = 0; // Índice do slide atual (0-based)
let slideInterval;
let animationFrameId = null;
const animationDuration = 500; // Duração da animação em milissegundos
let startTime = null;
let startPosition = 0; // Posição de início da animação em %
let endPosition = 0;   // Posição final da animação em %

// Obter elementos do carrossel
const carouselImages = document.querySelector('.carousel-images');
const slides = document.querySelectorAll('.carousel-slide');
const totalOriginalSlides = 3; // O número de slides REAIS que você tem (f1, f2, f3)
const totalSlidesInDOM = slides.length; // O número total de slides no HTML, incluindo os duplicados

// Variáveis para o arraste (touch/mouse)
let isDragging = false;
let startX = 0; // Posição X inicial do toque/mouse
let currentTranslate = 0; // Posição de transformação atual durante o arraste
let prevTranslate = 0; // Posição de transformação anterior para calcular o delta


function startSlideShow() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        moveSlide(1); // Move para a próxima imagem
    }, 5000); // 5 segundos de intervalo
}

function animateSlide(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);

    // Função de easing (ease-in-out)
    const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);

    const currentAnimatedPosition = startPosition + (endPosition - startPosition) * easedProgress;
    carouselImages.style.transform = `translateX(${currentAnimatedPosition}%)`;

    if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateSlide);
    } else {
        // Garante que a posição final seja exata
        carouselImages.style.transform = `translateX(${endPosition}%)`;
        startTime = null;
        animationFrameId = null;

        // *** Lógica para loop infinito APÓS a animação terminar ***
        if (endPosition <= -(totalOriginalSlides * 100)) { // Se chegamos a um slide duplicado (f1, f2, etc. no final)
            // "Teleporta" de volta para o slide original correspondente SEM ANIMAÇÃO
            currentIndex = currentIndex % totalOriginalSlides; // Volta para o índice do slide original
            carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
            // Atualiza prevTranslate para a nova posição teleportada para evitar saltos no próximo arraste
            prevTranslate = -currentIndex * 100;
        } else if (endPosition > 0) { // Se fomos para a esquerda a partir do primeiro slide
            // "Teleporta" para o slide duplicado correspondente no final antes de animar para ele
            currentIndex = totalOriginalSlides - 1; // Ajusta para o último slide original
            carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
            prevTranslate = -currentIndex * 100;
        }
    }
}


function moveSlide(direction) {
    // Parar qualquer animação em andamento antes de iniciar uma nova
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        startTime = null; // Reseta o tempo para evitar saltos
    }

    // Pega a posição inicial da animação
    const currentTransform = window.getComputedStyle(carouselImages).transform;
    let matrix = new WebKitCSSMatrix(currentTransform);
    startPosition = matrix.m41 / carouselImages.offsetWidth * 100; // Converte px para %

    let newIndex = currentIndex + direction;

    // Lógica para o loop infinito para a direita (continuo)
    if (direction > 0) { // Indo para a direita (próximo slide)
        // Se estamos no último slide original e vamos para o próximo, o alvo é o duplicado
        if (newIndex >= totalOriginalSlides) {
            // Permitimos que o índice vá além dos slides originais para usar os duplicados
            // O "teleporte" de volta acontecerá APÓS a animação no animateSlide
            endPosition = -newIndex * 100;
        } else {
            endPosition = -newIndex * 100;
        }
    } else { // Indo para a esquerda (slide anterior)
        // Se estamos no primeiro slide original e vamos para o anterior
        if (newIndex < 0) {
            // Teleporta para o slide duplicado ANTES da animação
            currentIndex = totalOriginalSlides; // Move para o primeiro slide duplicado que é visualmente o último slide original
            carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
            startPosition = -currentIndex * 100; // A animação começará desta posição teleportada
            newIndex = totalOriginalSlides - 1; // O alvo agora é o último slide original
        }
        endPosition = -newIndex * 100;
    }

    currentIndex = newIndex; // Atualiza o currentIndex para o próximo ciclo

    // Inicia a animação
    animationFrameId = requestAnimationFrame(animateSlide);

    // Reinicia o slideshow automático
    startSlideShow();
}


// --- Funções para Arraste (Touch/Mouse) ---

function addDragListeners() {
    carouselImages.addEventListener('mousedown', dragStart);
    carouselImages.addEventListener('mouseup', dragEnd);
    carouselImages.addEventListener('mouseleave', dragEnd); // Se o mouse sair do carrossel durante o arraste
    carouselImages.addEventListener('mousemove', drag);

    carouselImages.addEventListener('touchstart', dragStart);
    carouselImages.addEventListener('touchend', dragEnd);
    carouselImages.addEventListener('touchmove', drag);

    // Impede o arraste de imagens padrão
    carouselImages.addEventListener('dragstart', (e) => e.preventDefault());
}

function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function dragStart(event) {
    // Parar qualquer animação automática e em andamento
    clearInterval(slideInterval);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        startTime = null;
    }

    isDragging = true;
    startX = getPositionX(event);

    // Captura a posição atual do carrossel para iniciar o arraste
    const currentTransform = window.getComputedStyle(carouselImages).transform;
    let matrix = new WebkitCSSMatrix(currentTransform);
    prevTranslate = matrix.m41 / carouselImages.offsetWidth * 100; // Converte px para %
}

function drag(event) {
    if (!isDragging) return;

    // Previne o scroll da página durante o arraste horizontal do carrossel
    event.preventDefault();

    const currentX = getPositionX(event);
    const deltaX = currentX - startX; // Diferença no arrasto

    currentTranslate = prevTranslate + (deltaX / carouselImages.offsetWidth) * 100;
    carouselImages.style.transform = `translateX(${currentTranslate}%)`;
}

function dragEnd() {
    if (!isDragging) return;
    isDragging = false;

    // Calcular qual slide está mais próximo da posição atual
    const movedBy = currentTranslate - prevTranslate; // Quanto foi arrastado em %
    const slideWidthPercentage = 100; // Cada slide ocupa 100%

    // Determinar a direção e o slide alvo
    if (movedBy < -slideWidthPercentage / 4) { // Arrastou para a esquerda o suficiente
        moveSlide(1); // Mover para o próximo slide
    } else if (movedBy > slideWidthPercentage / 4) { // Arrastou para a direita o suficiente
        moveSlide(-1); // Mover para o slide anterior
    } else {
        // Voltar para o slide atual se não arrastou o suficiente
        // O currentIndex já deve estar correto para o slide atual visível
        // ou o prevTranslate indica a posição do slide que estava visível antes do arraste
        const currentSnapIndex = Math.round(-prevTranslate / 100);
        currentIndex = currentSnapIndex; // Define o currentIndex para o slide em que estávamos antes de arrastar
        // E dispara uma "animação" para voltar à posição correta, caso tenha arrastado um pouco
        endPosition = -currentIndex * 100;
        startPosition = currentTranslate; // Inicia a animação da posição onde soltou o arraste
        animationFrameId = requestAnimationFrame(animateSlide);
        startSlideShow(); // Reinicia o auto-play
    }
}
