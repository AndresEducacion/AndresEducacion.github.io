document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');

    function closeMenu() {
        if (!navList || !menuToggle) return;
        navList.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    }

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!isExpanded));
            navList.classList.toggle('active');
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                closeMenu();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Aparición progresiva de tarjetas y recursos
    const reveals = document.querySelectorAll('.section-title, .section-description, .module-card, .resource-item');
    reveals.forEach(el => el.classList.add('reveal'));
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
        reveals.forEach(el => io.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('in'));
    }

    // Marca el enlace de navegación de la sección visible
    const links = document.querySelectorAll('.nav-link');
    const sections = [...links]
        .map(l => document.querySelector(l.getAttribute('href')))
        .filter(Boolean);

    function onScroll() {
        let current = sections[0];
        sections.forEach(s => {
            if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s;
        });
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current.id));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
});
