// Menú móvil y desplazamiento suave compartidos por las portadas de los módulos (DEIM, ISDE).
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            navList.classList.toggle('active');
        });
    }

    // Smooth scroll for anchor links (optional polyfill-like behavior if needed, 
    // but CSS scroll-behavior: smooth handles most modern cases)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (navList && menuToggle && navList.classList.contains('active')) {
                    navList.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }

                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
