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
                if (navList.classList.contains('active')) {
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

// ===============================
//   DATOS DE BLOQUES Y LECCIONES
// ===============================
const lessonData = {
    introduccion: {
        title: "[Introducción a la programación]",
        lessons: [
            {
                id: "intro-p5",
                title: "1. Básicos de la programación en P5.js",
                file: "lessons/1introduccionp5.html"
            }
        ]
    }

    // AÑADE MÁS CATEGORÍAS AQUÍ
    /*
    ,
    variables: {
      title: "Variables",
      lessons: [
        { id: "vars-basico", title: "Variables básicas", file: "lessons/variables1.html" }
      ]
    }
    */
};

document.addEventListener("DOMContentLoaded", () => {
    const sidebarNav = document.getElementById("sidebarNav");
    const homeGrid = document.getElementById("homeGrid");

    const lessonWrapper = document.getElementById("lessonWrapper");
    const lessonTitle = document.getElementById("lessonTitle");
    const lessonCategoryLabel = document.getElementById("lessonCategory");
    const lessonFrame = document.getElementById("lessonFrame");

    const topbarSubtitle = document.getElementById("topbarSubtitle");

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");

    const heroStartBtn = document.getElementById("heroStartBtn");
    const heroBrowseBtn = document.getElementById("heroBrowseBtn");

    // Construir navegación lateral y grid inicial
    buildSidebar(sidebarNav);
    buildHomeGrid(homeGrid);

    // =======================
    //   BOTONES DEL HERO
    // =======================

    if (heroStartBtn) {
        heroStartBtn.addEventListener("click", () => {
            const catKeys = Object.keys(lessonData);
            if (!catKeys.length) return;

            const firstCatKey = catKeys[0];
            const firstCategory = lessonData[firstCatKey];
            if (!firstCategory.lessons || !firstCategory.lessons.length) return;

            const firstLesson = firstCategory.lessons[0];
            selectLesson(firstCatKey, firstLesson.id);
        });
    }

    if (heroBrowseBtn) {
        heroBrowseBtn.addEventListener("click", () => {
            if (!homeGrid) return;
            homeGrid.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    // =======================
    //   SIDEBAR MÓVIL
    // =======================

    function toggleSidebar() {
        if (!sidebar) return;
        const isOpen = sidebar.classList.toggle("is-open");
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.toggle("is-visible", isOpen);
        }
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove("is-open");
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.remove("is-visible");
        }
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebar);
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", closeSidebar);
    }

    // Cierra sidebar al cambiar tamaño (por si se queda abierto)
    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    });

    // =======================
    //   FUNCIÓN PRINCIPAL:
    //   SELECCIONAR LECCIÓN
    // =======================

    function selectLesson(catKey, lessonId) {
        const category = lessonData[catKey];
        if (!category) return;

        const lesson = category.lessons.find((l) => l.id === lessonId);
        if (!lesson) return;

        // Actualizar estado activo de categorías
        document.querySelectorAll(".sidebar-category").forEach((catEl) => {
            const isThis = catEl.dataset.catKey === catKey;
            catEl.classList.toggle("is-active", isThis);
            if (isThis) {
                catEl.classList.remove("is-collapsed");
            }
        });

        // Actualizar lección activa en sidebar
        document.querySelectorAll(".sidebar-lesson-btn").forEach((btn) => {
            const isCurrent =
                btn.dataset.catKey === catKey &&
                btn.dataset.lessonId === lessonId;
            btn.classList.toggle("is-current", isCurrent);
        });

        // Títulos en la zona de contenido
        if (lessonTitle) {
            // opcional: quitar numeración inicial tipo "1. "
            const cleanTitle = lesson.title.replace(/^[0-9.]+\s*/, "");
            lessonTitle.textContent = cleanTitle;
        }
        if (lessonCategoryLabel) {
            lessonCategoryLabel.textContent = category.title;
        }

        // Mostrar contenedor de lección
        if (lessonWrapper) {
            lessonWrapper.classList.remove("is-empty");
        }

        // Cargar lección en iframe
        if (lessonFrame) {
            lessonFrame.src = lesson.file;
        }

        // Actualizar subtítulo de la topbar
        if (topbarSubtitle) {
            topbarSubtitle.textContent = `${category.title} · ${lesson.title}`;
        }

        // Cerrar sidebar en móvil
        closeSidebar();

        // Scroll suave hasta la lección
        if (lessonWrapper) {
            lessonWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    // =======================
    //   CONSTRUIR SIDEBAR
    // =======================

    function buildSidebar(navEl) {
        if (!navEl) return;

        Object.entries(lessonData).forEach(([catKey, category], index) => {
            const catDiv = document.createElement("div");
            catDiv.className = "sidebar-category";
            catDiv.dataset.catKey = catKey;

            // Primera categoría abierta por defecto
            if (index !== 0) {
                catDiv.classList.add("is-collapsed");
            } else {
                catDiv.classList.add("is-active");
            }

            const headerBtn = document.createElement("button");
            headerBtn.className = "sidebar-cat-header";
            headerBtn.innerHTML = `
        <span class="sidebar-cat-dot"></span>
        <span class="sidebar-cat-title">${category.title}</span>
        <span class="sidebar-cat-chevron">▾</span>
      `;

            headerBtn.addEventListener("click", () => {
                catDiv.classList.toggle("is-collapsed");
            });

            const ul = document.createElement("ul");
            ul.className = "sidebar-lesson-list";

            (category.lessons || []).forEach((lesson) => {
                const li = document.createElement("li");
                li.className = "sidebar-lesson-item";

                const btn = document.createElement("button");
                btn.className = "sidebar-lesson-btn";
                btn.dataset.catKey = catKey;
                btn.dataset.lessonId = lesson.id;
                btn.innerHTML = `
          <span class="sidebar-lesson-bullet"></span>
          <span>${lesson.title}</span>
        `;

                btn.addEventListener("click", () => {
                    selectLesson(catKey, lesson.id);
                });

                li.appendChild(btn);
                ul.appendChild(li);
            });

            catDiv.appendChild(headerBtn);
            catDiv.appendChild(ul);
            navEl.appendChild(catDiv);
        });
    }

    // =======================
    //   GRID INICIAL
    // =======================

    function buildHomeGrid(gridEl) {
        if (!gridEl) return;
        gridEl.innerHTML = "";

        Object.entries(lessonData).forEach(([catKey, category]) => {
            (category.lessons || []).forEach((lesson, index) => {
                const card = document.createElement("article");
                card.className = "card";
                card.dataset.catKey = catKey;
                card.dataset.lessonId = lesson.id;

                // Iconito diferente depende del índice (solo por variedad)
                const icons = ["💡", "🧩", "🎯", "🕹️", "📐", "📊"];
                const icon = icons[index % icons.length];

                card.innerHTML = `
          <div class="card-icon">${icon}</div>
          <h3>${lesson.title}</h3>
          <p>Abre la lección en el visor y prueba el código directamente.</p>
          <div class="card-category">${category.title}</div>
        `;

                card.addEventListener("click", () => {
                    selectLesson(catKey, lesson.id);
                });

                gridEl.appendChild(card);
            });
        });
    }
});
