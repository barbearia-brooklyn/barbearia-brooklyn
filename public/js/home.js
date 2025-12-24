// ===========================
// home.js - Lógica da Homepage
// ===========================

// ===== CARREGAR SERVIÇOS DA API =====
async function loadServices() {
    const container = document.getElementById('services-grid');
    if (!container) return;

    try {
        const result = await utils.apiRequest('/api_servicos');
        
        if (result.ok && result.data) {
            const services = result.data;
            
            container.innerHTML = services.map(service => `
                <div class="service-card">
                    <img src="images/services/${service.svg || 'default.svg'}" alt="${service.nome}" class="service-icon" onerror="this.src='images/services/default.svg'">
                    <h4>${service.nome}</h4>
                    <p class="service-price">${utils.formatPrice(service.preco)}</p>
                </div>
            `).join('');
        } else {
            loadStaticServices();
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        loadStaticServices();
    }
}

// Fallback com serviços estáticos
function loadStaticServices() {
    const container = document.getElementById('services-grid');
    if (!container) return;

    const staticServices = [
        { nome: 'Corte', svg: 'haircut.svg' },
        { nome: 'Corte e Barba', svg: 'beard.svg' },
        { nome: 'Corte até 12 anos', svg: 'child.svg' },
        { nome: 'Corte na máquina', svg: 'hair-clipper.svg' },
        { nome: 'Sobrancelha', svg: 'eyebrow.svg' },
        { nome: 'Barba', svg: 'beard-full.svg' },
        { nome: 'Barbaterapia', svg: 'spa.svg' },
        { nome: 'Preços Estudante', svg: 'student.svg' }
    ];

    container.innerHTML = staticServices.map(service => `
        <div class="service-card">
            <img src="images/services/${service.svg}" alt="${service.nome}" class="service-icon">
            <h4>${service.nome}</h4>
        </div>
    `).join('');
}

// ===== CARREGAR BARBEIROS DA API =====
async function loadBarbers() {
    const container = document.getElementById('team-grid');
    if (!container) return;

    try {
        const result = await utils.apiRequest('/api_barbeiros');
        
        if (result.ok && result.data) {
            const barbers = result.data;
            
            container.innerHTML = barbers.map(barber => {
                const imagePath = `images/barbers/${barber.foto || 'default.png'}`;
                const specialty = barber.especialidades || 'Barbeiro Profissional';
                
                return `
                    <div class="team-member">
                        <div class="member-photo">
                            <img src="${imagePath}" alt="${barber.nome}" loading="lazy" onerror="this.src='images/barbers/default.png'">
                        </div>
                        <h4>${barber.nome}</h4>
                        <p class="specialty">${specialty}</p>
                    </div>
                `;
            }).join('');
        } else {
            loadStaticBarbers();
        }
    } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
        loadStaticBarbers();
    }
}

// Fallback com barbeiros estáticos
function loadStaticBarbers() {
    const container = document.getElementById('team-grid');
    if (!container) return;

    const staticBarbers = [
        { nome: 'Gui Pereira', foto: 'Gui.png', specialty: 'Cortes à Tesoura e Máquina, Barboterapia' },
        { nome: 'Johtta Barros', foto: 'Johtta.png', specialty: 'Cortes clássicos, Degrade, Barboterapia' },
        { nome: 'Weslley Santos', foto: 'Weslley.png', specialty: 'Degrade, Cortes à Máquina, Barboterapia' },
        { nome: 'Marco Bonucci', foto: 'Marco.png', specialty: 'Cortes Clássicos, Degrade, Barboterapia' },
        { nome: 'Ricardo Graça', foto: 'Ricardo.png', specialty: 'Cortes à tesoura e Máquina, Barboterapia' }
    ];

    container.innerHTML = staticBarbers.map(barber => `
        <div class="team-member">
            <div class="member-photo">
                <img src="images/barbers/${barber.foto}" alt="${barber.nome}" loading="lazy">
            </div>
            <h4>${barber.nome}</h4>
            <p class="specialty">${barber.specialty}</p>
        </div>
    `).join('');
}

// ===== GALERIA SLIDER (MOBILE) =====
function initGallerySlider() {
    const slider = document.querySelector('.gallery-slider');
    const track = document.querySelector('.gallery-track');
    
    if (!slider || !track) return;

    const slides = Array.from(track.querySelectorAll('.gallery-slide'));
    const btnPrev = slider.querySelector('.gallery-nav.prev');
    const btnNext = slider.querySelector('.gallery-nav.next');
    
    let index = 0;
    let autoplayTimer = null;
    const interval = 5000;

    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

    function goTo(i) {
        index = (i + slides.length) % slides.length;
        const x = slides[index].offsetLeft;
        track.scrollTo({ left: x, behavior: 'smooth' });
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startAutoplay() {
        stopAutoplay();
        if (isMobile()) {
            autoplayTimer = setInterval(next, interval);
        }
    }

    function stopAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = null;
    }

    let scrollDebounce;
    track.addEventListener('scroll', () => {
        if (!isMobile()) return;
        if (scrollDebounce) cancelAnimationFrame(scrollDebounce);
        scrollDebounce = requestAnimationFrame(() => {
            const scrollLeft = track.scrollLeft;
            let closest = 0;
            let minDist = Infinity;
            slides.forEach((s, i) => {
                const dist = Math.abs(s.offsetLeft - scrollLeft);
                if (dist < minDist) { 
                    minDist = dist; 
                    closest = i; 
                }
            });
            index = closest;
        });
    }, { passive: true });

    if (btnNext) {
        btnNext.addEventListener('click', () => { 
            stopAutoplay(); 
            next(); 
            startAutoplay(); 
        });
    }
    
    if (btnPrev) {
        btnPrev.addEventListener('click', () => { 
            stopAutoplay(); 
            prev(); 
            startAutoplay(); 
        });
    }

    ['mouseenter', 'touchstart', 'focusin'].forEach(evt => {
        slider.addEventListener(evt, stopAutoplay, { passive: true });
    });

    ['mouseleave', 'touchend', 'blur'].forEach(evt => {
        slider.addEventListener(evt, () => { 
            if (isMobile()) startAutoplay(); 
        }, { passive: true });
    });

    window.addEventListener('resize', () => {
        if (isMobile()) {
            goTo(index);
            startAutoplay();
        } else {
            stopAutoplay();
        }
    });

    if (isMobile()) {
        goTo(0);
        startAutoplay();
    }
}

// ===== INICIALIZAÇÃO =====
function initHomePage() {
    loadServices();
    loadBarbers();
    initGallerySlider();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}