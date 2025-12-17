// ===========================
// home.js - Lógica da Homepage
// ===========================

// ===== CARREGAR SERVIÇOS DA API =====
async function loadServices() {
    const container = document.getElementById('services-grid');
    if (!container) return;

    try {
        const result = await utils.apiRequest('/api_servicos');
        
        if (result.ok && result.data.success) {
            const services = result.data.servicos;
            
            // Mapear ícones para serviços
            const serviceIcons = {
                'Corte': 'haircut.svg',
                'Corte e Barba': 'beard.svg',
                'Corte até 12 anos': 'child.svg',
                'Corte na máquina': 'hair-clipper.svg',
                'Sobrancelha': 'eyebrow.svg',
                'Barba': 'beard-full.svg',
                'Barbaterapia': 'spa.svg',
                'Corte Estudante': 'student.svg'
            };

            container.innerHTML = services.map(service => {
                const iconName = serviceIcons[service.nome] || 'haircut.svg';
                return `
                    <div class="service-card">
                        <img src="images/services/${iconName}" alt="${service.nome}" class="service-icon">
                        <h3>${service.nome}</h3>
                        <p class="service-price">${service.preco}€</p>
                    </div>
                `;
            }).join('');
        } else {
            // Fallback para dados estáticos se API falhar
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
        { nome: 'Corte', icon: 'haircut.svg' },
        { nome: 'Corte e Barba', icon: 'beard.svg' },
        { nome: 'Corte até 12 anos', icon: 'child.svg' },
        { nome: 'Corte na máquina', icon: 'hair-clipper.svg' },
        { nome: 'Sobrancelha', icon: 'eyebrow.svg' },
        { nome: 'Barba', icon: 'beard-full.svg' },
        { nome: 'Barbaterapia', icon: 'spa.svg' },
        { nome: 'Preços Estudante', icon: 'student.svg' }
    ];

    container.innerHTML = staticServices.map(service => `
        <div class="service-card">
            <img src="images/services/${service.icon}" alt="${service.nome}" class="service-icon">
            <h3>${service.nome}</h3>
        </div>
    `).join('');
}

// ===== CARREGAR BARBEIROS DA API =====
async function loadBarbers() {
    const container = document.getElementById('team-grid');
    if (!container) return;

    try {
        const result = await utils.apiRequest('/api_barbeiros');
        
        if (result.ok && result.data.success) {
            const barbers = result.data.barbeiros;
            
            container.innerHTML = barbers.map(barber => {
                const imagePath = barber.imagem || `images/barbers/${barber.nome.split(' ')[0]}.png`;
                const specialty = barber.especialidade || 'Barbeiro Profissional';
                
                return `
                    <div class="team-member">
                        <div class="member-photo">
                            <img src="${imagePath}" alt="${barber.nome}" loading="lazy">
                        </div>
                        <h3>${barber.nome}</h3>
                        <p class="specialty">${specialty}</p>
                    </div>
                `;
            }).join('');
        } else {
            // Fallback para dados estáticos se API falhar
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
        { nome: 'Gui Pereira', specialty: 'Cortes à Tesoura e Máquina, Barboterapia' },
        { nome: 'Johtta Barros', specialty: 'Cortes clássicos, Degrade, Barboterapia' },
        { nome: 'Weslley Santos', specialty: 'Degrade, Cortes à Máquina, Barboterapia' },
        { nome: 'Marco Bonucci', specialty: 'Cortes Clássicos, Degrade, Barboterapia' },
        { nome: 'Ricardo Graça', specialty: 'Cortes à tesoura e Máquina, Barboterapia' }
    ];

    container.innerHTML = staticBarbers.map(barber => {
        const firstName = barber.nome.split(' ')[0];
        return `
            <div class="team-member">
                <div class="member-photo">
                    <img src="images/barbers/${firstName}.png" alt="${barber.nome}" loading="lazy">
                </div>
                <h3>${barber.nome}</h3>
                <p class="specialty">${barber.specialty}</p>
            </div>
        `;
    }).join('');
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
    const interval = 5000; // 5 segundos

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

    // Atualizar index baseado no scroll
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

    // Botões de navegação
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

    // Pausar autoplay em hover/touch
    ['mouseenter', 'touchstart', 'focusin'].forEach(evt => {
        slider.addEventListener(evt, stopAutoplay, { passive: true });
    });

    ['mouseleave', 'touchend', 'blur'].forEach(evt => {
        slider.addEventListener(evt, () => { 
            if (isMobile()) startAutoplay(); 
        }, { passive: true });
    });

    // Reagir a resize
    window.addEventListener('resize', () => {
        if (isMobile()) {
            goTo(index);
            startAutoplay();
        } else {
            stopAutoplay();
        }
    });

    // Inicialização
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

// Executar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}