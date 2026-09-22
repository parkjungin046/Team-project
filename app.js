/**
 * ==========================================================================
 * PARK JUNG IN - GREEN SMART CITY & GIS PORTFOLIO
 * Application Engine & Dynamic Data Renderer
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // Ensure data configuration is available
  if (typeof PORTFOLIO_DATA !== "undefined") {
    renderPortfolioData(PORTFOLIO_DATA);
  }

  // Initialize interactive features
  initGisCanvas();
  initThemeToggle();
  initMobileDrawer();
  initScrollSpyAndHeader();
  initProjectFiltering();
  initProjectModal();
  initClipboardActions();
  initContactForm();
  initBackToTop();
  initShareMenu();
});

/* ==========================================================================
   0. DYNAMIC DATA RENDERER (Connects portfolio-data.js to HTML)
   ========================================================================== */
function renderPortfolioData(data) {
  const p = data.profile;

  // 1) Update Header & Brand Info
  setText("nav-logo-name", p.name.toUpperCase());
  setText("nav-logo-dept", `${p.department} ${p.studentId.replace("학번", "'")}`);
  setText("nav-crs-text", p.crs);
  setText("drawer-logo-name", p.name.toUpperCase());
  setText("drawer-logo-dept", p.department);
  setText("footer-logo-name", p.name.toUpperCase());
  setText("footer-logo-dept", `${p.department} ${p.studentId} 포트폴리오`);

  // 2) Hero Section
  setText("hero-badge", p.sloganBadge);
  setText("hero-display-name", p.enName.replace(/-/g, " ").toUpperCase());
  setText("hero-handle", `${p.department} ${p.studentId}`);
  setHTML("hero-main-title", p.mainHeadline);
  setHTML("hero-sub-title", p.subHeadline);

  // Hero Quick Stats Strip
  const statsContainer = document.getElementById("hero-stats-container");
  if (statsContainer && data.heroStats) {
    statsContainer.innerHTML = data.heroStats
      .map(
        (st, idx) => `
        <div class="stat-item">
          <div class="stat-num">${st.num}<span class="unit">${st.unit}</span></div>
          <div class="stat-label">${st.label}</div>
        </div>
        ${idx < data.heroStats.length - 1 ? '<div class="stat-divider"></div>' : ''}
      `
      )
      .join("");
  }

  // 3) About Section: Profile Card
  const profileContainer = document.getElementById("about-profile-container");
  if (profileContainer) {
    profileContainer.innerHTML = `
      <div class="profile-avatar-box">
        <div class="avatar-glow"></div>
        <div class="avatar-content">
          <i class="ph-thin ph-buildings"></i>
          <span class="avatar-initials">${p.name.substring(1)}</span>
        </div>
      </div>
      <h3 class="profile-name">${p.name} <span class="profile-en">${p.enName}</span></h3>
      <p class="profile-role">${p.department} ${p.studentId} ${p.status}</p>

      <div class="profile-meta-list">
        <div class="meta-row">
          <i class="ph-bold ph-graduation-cap"></i>
          <span class="label">소속/전공:</span>
          <span class="value">${p.department} (${p.studentId})</span>
        </div>
        <div class="meta-row">
          <i class="ph-bold ph-map-pin"></i>
          <span class="label">활동 지역:</span>
          <span class="value">${p.location}</span>
        </div>
        <div class="meta-row">
          <i class="ph-bold ph-envelope"></i>
          <span class="label">이메일:</span>
          <span class="value">${p.email}</span>
        </div>
        <div class="meta-row">
          <i class="ph-bold ph-sparkle"></i>
          <span class="label">연구 키워드:</span>
          <span class="value">GIS, 스마트시티, 생태복원</span>
        </div>
      </div>

      <div class="profile-quote">
        <i class="ph-fill ph-quotes"></i>
        <p>${p.quote}</p>
      </div>
    `;
  }

  // About Section: Narrative, Values, Interests
  const narrativeContainer = document.getElementById("about-narrative-container");
  if (narrativeContainer && data.about) {
    const bioHtml = data.about.bioParagraphs.map((para) => `<p>${para}</p>`).join("");

    const valuesHtml = data.about.coreValues
      .map(
        (v) => `
        <div class="value-card">
          <div class="value-icon"><i class="ph-bold ${v.icon}"></i></div>
          <h4>${v.step}. ${v.title}</h4>
          <p>${v.desc}</p>
        </div>
      `
      )
      .join("");

    const interestsHtml = data.about.interests
      .map((tag) => `<span class="interest-pill"><i class="ph-bold ph-check"></i> ${tag}</span>`)
      .join("");

    narrativeContainer.innerHTML = `
      <div class="narrative-block">
        <h3><i class="ph-bold ph-compass-tool"></i> 소개 & 학업 비전</h3>
        ${bioHtml}
      </div>

      <div class="values-grid">
        ${valuesHtml}
      </div>

      <div class="interest-areas-container">
        <h4 class="subhead"><i class="ph-bold ph-circles-three-plus"></i> 주요 관심 및 탐구 분야</h4>
        <div class="interest-tags-wrap">
          ${interestsHtml}
        </div>
      </div>
    `;
  }

  // 4) Project Section
  const projectsContainer = document.getElementById("projects-container");
  if (projectsContainer && data.projects) {
    const curatedHtml = data.projects
      .map((proj) => {
        const toolPills = proj.tools.map((t) => `<span>${t}</span>`).join("");
        const svgHeader = getProjectSvgThumbnail(proj.themeColor, proj.id);

        return `
        <article class="project-card" data-category="${proj.category}" data-id="${proj.id}">
          <div class="card-thumb-wrapper">
            <div class="project-badge ${proj.category.split(' ')[0]}">${proj.categoryLabel}</div>
            <div class="card-visual-header ${proj.themeColor}">
              ${svgHeader}
            </div>
          </div>
          <div class="project-card-body">
            <div class="project-meta">
              <span class="project-year"><i class="ph-bold ph-calendar"></i> ${proj.period.split(' ')[0]}</span>
              <span class="project-role"><i class="ph-bold ph-user-circle"></i> ${proj.role.split('/')[0].trim()}</span>
            </div>
            <h3 class="project-title">${proj.title}</h3>
            <div class="project-card-focus">
              <span class="card-label">문제 정의</span>
              <p>${proj.modalDetails.background}</p>
            </div>
            <p class="project-summary">${proj.summary}</p>
            <div class="project-card-result">
              <span class="card-label">주요 결과</span>
              <p>${proj.modalDetails.results}</p>
            </div>
            <div class="project-tool-pills">
              ${toolPills}
            </div>
            <button class="project-open-btn" data-project-id="${proj.id}">
              <span>상세 분석 보고서 보기</span>
              <i class="ph-bold ph-arrow-up-right"></i>
            </button>
          </div>
        </article>
      `;
      })
      .join("");

    // 관리자 페이지에서 "공개"로 등록한 프로젝트를 같은 그리드에 이어서 표시
    const managedHtml = getManagedProjectsHtml();

    projectsContainer.innerHTML = curatedHtml + managedHtml;
  }

  // 5) Skills Section
  const skillsContainer = document.getElementById("skills-container");
  if (skillsContainer && data.skills) {
    skillsContainer.innerHTML = data.skills
      .map((cat) => {
        const itemsHtml = cat.items
          .map(
            (item) => `
            <div class="skill-item">
              <div class="skill-info">
                <span class="skill-name"><strong>${item.name}</strong> (${item.levelText})</span>
                <span class="skill-pct">${item.percent}%</span>
              </div>
              <div class="skill-bar-track"><div class="skill-bar-fill" style="width: ${item.percent}%"></div></div>
            </div>
          `
          )
          .join("");

        return `
        <div class="skill-category-card">
          <div class="skill-card-header">
            <div class="category-icon ${cat.iconClass}">
              <i class="ph-bold ${cat.icon}"></i>
            </div>
            <div>
              <h3 class="category-title">${cat.category}</h3>
              <span class="category-tag">${cat.engTag}</span>
            </div>
          </div>
          <p class="category-desc">${cat.desc}</p>
          <div class="skill-items-list">
            ${itemsHtml}
          </div>
        </div>
      `;
      })
      .join("");
  }

  // 6) Career Section
  const careerContainer = document.getElementById("career-container");
  if (careerContainer && data.career) {
    // Column 1: Certifications
    const certsHtml = data.career.certifications
      .map(
        (c) => `
        <div class="career-item-card">
          <div class="career-badge ${c.status}">${c.statusText}</div>
          <h4 class="career-item-title">${c.title}</h4>
          <div class="career-org">${c.org}</div>
          <p class="career-desc">${c.desc}</p>
        </div>
      `
      )
      .join("");

    // Column 2: Activities
    const actHtml = data.career.activities
      .map(
        (a) => `
        <div class="career-item-card">
          <div class="career-period">${a.period}</div>
          <h4 class="career-item-title">${a.title}</h4>
          <div class="career-org">${a.org}</div>
          <p class="career-desc">${a.desc}</p>
        </div>
      `
      )
      .join("");

    // Column 3: Awards
    const awardsHtml = data.career.awards
      .map(
        (aw) => `
        <div class="career-item-card award-highlight">
          <div class="award-trophy-icon"><i class="ph-fill ph-medal"></i></div>
          <div class="career-period">${aw.period}</div>
          <h4 class="career-item-title">${aw.title}</h4>
          <div class="career-org">${aw.org}</div>
          <p class="career-desc">${aw.desc}</p>
        </div>
      `
      )
      .join("");

    careerContainer.innerHTML = `
      <div class="career-column">
        <div class="column-header">
          <i class="ph-bold ph-certificate"></i>
          <h3>자격증 & 교육 이수</h3>
        </div>
        <div class="career-cards-stack">${certsHtml}</div>
      </div>

      <div class="career-column">
        <div class="column-header">
          <i class="ph-bold ph-users-three"></i>
          <h3>학술 활동 & 대외활동</h3>
        </div>
        <div class="career-cards-stack">${actHtml}</div>
      </div>

      <div class="career-column">
        <div class="column-header">
          <i class="ph-bold ph-trophy"></i>
          <h3>수상 및 학업 성과</h3>
        </div>
        <div class="career-cards-stack">${awardsHtml}</div>
      </div>
    `;
  }

  // 7) Contact Info Panel
  const contactInfoContainer = document.getElementById("contact-info-container");
  if (contactInfoContainer) {
    contactInfoContainer.innerHTML = `
      <div class="contact-card-box">
        <div class="contact-icon"><i class="ph-bold ph-envelope-simple"></i></div>
        <div class="contact-text">
          <span class="label">이메일 (Email)</span>
          <a href="mailto:${p.email}" class="link">${p.email}</a>
        </div>
        <button class="copy-btn icon-btn" id="copy-email-btn" data-email="${p.email}" title="이메일 주소 복사">
          <i class="ph-bold ph-copy"></i>
        </button>
      </div>

      <div class="contact-card-box">
        <div class="contact-icon"><i class="ph-bold ph-phone-call"></i></div>
        <div class="contact-text">
          <span class="label">연락처 (Phone)</span>
          <span class="link">${p.phone}</span>
        </div>
        <button class="copy-btn icon-btn" id="copy-phone-btn" data-phone="${p.phone}" title="연락처 복사">
          <i class="ph-bold ph-copy"></i>
        </button>
      </div>

      <div class="contact-card-box">
        <div class="contact-icon"><i class="ph-bold ph-map-pin-line"></i></div>
        <div class="contact-text">
          <span class="label">위치 & 활동 거점 (Location)</span>
          <span class="link">${p.location}</span>
        </div>
      </div>

      <div class="social-channels">
        <h4 class="social-title">포트폴리오 & 채널</h4>
        <div class="social-links-row">
          <a href="${p.socialLinks.github}" target="_blank" rel="noopener noreferrer" class="social-chip" title="GitHub">
            <i class="ph-bold ph-github-logo"></i>
            <span>GitHub</span>
          </a>
          <a href="${p.socialLinks.notion}" target="_blank" rel="noopener noreferrer" class="social-chip" title="Notion Research Log">
            <i class="ph-bold ph-notebook"></i>
            <span>Notion Study Log</span>
          </a>
          <a href="${p.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer" class="social-chip" title="LinkedIn">
            <i class="ph-bold ph-linkedin-logo"></i>
            <span>LinkedIn</span>
          </a>
          <a href="${p.socialLinks.department}" target="_blank" rel="noopener noreferrer" class="social-chip department-homepage-chip" title="그린스마트시티학과 홈페이지">
            <i class="ph-bold ph-buildings"></i>
            <span>학과 홈페이지</span>
          </a>
        </div>
      </div>

      <div class="gis-location-banner">
        <div class="gis-banner-header">
          <i class="ph-bold ph-crosshair"></i>
          <span>SPATIAL REFERENCE</span>
        </div>
        <div class="gis-coords-code">
          ${p.coordinates}<br>
          CRS: ${p.crs}
        </div>
      </div>
    `;
  }
}

// Utility helper functions
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// SVG Vector Thumbnail Generator for projects
function getProjectSvgThumbnail(themeColor, id) {
  if (themeColor === "green-theme") {
    return `
      <svg viewBox="0 0 360 200" class="thumb-svg">
        <circle cx="120" cy="100" r="70" fill="#ef4444" opacity="0.35"/>
        <circle cx="120" cy="100" r="45" fill="#f97316" opacity="0.45"/>
        <circle cx="260" cy="90" r="60" fill="#10b981" opacity="0.4"/>
        <path d="M 30 160 Q 150 140, 240 70 T 340 40" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 3"/>
        <rect x="110" y="60" width="20" height="20" rx="3" fill="#0f766e"/>
        <rect x="230" y="70" width="24" height="24" rx="4" fill="#059669"/>
      </svg>`;
  } else if (themeColor === "blue-theme") {
    return `
      <svg viewBox="0 0 360 200" class="thumb-svg">
        <polygon points="120,200 160,80 200,80 240,200" fill="#334155" opacity="0.3"/>
        <polygon points="20,200 110,200 155,80 140,80" fill="#10b981" opacity="0.35"/>
        <polygon points="250,200 340,200 220,80 205,80" fill="#10b981" opacity="0.35"/>
        <circle cx="80" cy="140" r="14" fill="#059669"/>
        <line x1="110" y1="120" x2="110" y2="170" stroke="#38bdf8" stroke-width="3"/>
        <circle cx="110" cy="120" r="5" fill="#38bdf8"/>
      </svg>`;
  } else if (themeColor === "teal-theme") {
    return `
      <svg viewBox="0 0 360 200" class="thumb-svg">
        <path d="M 0 120 Q 90 70, 180 110 T 360 80" fill="none" stroke="#0284c7" stroke-width="22" stroke-linecap="round" opacity="0.4"/>
        <path d="M 0 120 Q 90 70, 180 110 T 360 80" fill="none" stroke="#38bdf8" stroke-width="10" stroke-linecap="round"/>
        <circle cx="80" cy="70" r="24" fill="#047857" opacity="0.5"/>
        <circle cx="200" cy="145" r="28" fill="#047857" opacity="0.5"/>
        <line x1="80" y1="70" x2="200" y2="145" stroke="#10b981" stroke-width="2" stroke-dasharray="4 2"/>
      </svg>`;
  } else if (themeColor === "indigo-theme") {
    return `
      <svg viewBox="0 0 360 200" class="thumb-svg">
        <rect x="20" y="30" width="320" height="140" rx="8" fill="#1e1b4b" opacity="0.2"/>
        <path d="M 40 50 L 100 90 L 180 110 L 260 100 L 320 140" fill="none" stroke="#6366f1" stroke-width="3"/>
        <circle cx="100" cy="90" r="10" fill="#10b981"/>
        <circle cx="260" cy="100" r="14" fill="#10b981"/>
        <circle cx="260" cy="100" r="22" fill="none" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3 2"/>
      </svg>`;
  } else {
    return `
      <svg viewBox="0 0 360 200" class="thumb-svg">
        <polygon points="120,40 145,55 145,85 120,100 95,85 95,55" fill="#0284c7" opacity="0.3" stroke="#38bdf8" stroke-width="1.5"/>
        <polygon points="175,40 200,55 200,85 175,100 150,85 150,55" fill="#f59e0b" opacity="0.4" stroke="#f59e0b" stroke-width="1.5"/>
        <polygon points="148,90 173,105 173,135 148,150 123,135 123,105" fill="#ef4444" opacity="0.4" stroke="#ef4444" stroke-width="2"/>
        <circle cx="148" cy="120" r="6" fill="#ffffff"/>
      </svg>`;
  }
}

/* ==========================================================================
   1. GIS PARTICLE NETWORK BACKGROUND CANVAS
   ========================================================================== */
function initGisCanvas() {
  const canvas = document.getElementById("gis-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];
  const particleCount = 45;
  const maxDistance = 140;

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = Math.random() * 2.2 + 1.2;
      this.type = Math.random() > 0.4 ? "node" : "eco";
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.type === "node" ? "rgba(16, 185, 129, 0.7)" : "rgba(14, 165, 233, 0.7)";
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance) * 0.22;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    particles.forEach((p) => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   2. THEME TOGGLE (LIGHT / DARK MODE)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const body = document.body;

  const savedTheme = localStorage.getItem("park_theme") || "light";
  setTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currentTheme = body.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      showToast(newTheme === "dark" ? "🌙 다크 모드로 전환되었습니다." : "☀️ 라이트 모드로 전환되었습니다.");
    });
  }

  function setTheme(theme) {
    body.setAttribute("data-theme", theme);
    localStorage.setItem("park_theme", theme);
    if (themeIcon) {
      if (theme === "dark") {
        themeIcon.className = "ph-bold ph-sun";
      } else {
        themeIcon.className = "ph-bold ph-moon";
      }
    }
  }
}

/* ==========================================================================
   3. MOBILE DRAWER NAVIGATION
   ========================================================================== */
function initMobileDrawer() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const drawerCloseBtn = document.getElementById("drawer-close-btn");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");
  const drawerLinks = document.querySelectorAll(".drawer-link");

  function openDrawer() {
    mobileDrawer.classList.add("open");
    drawerOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    mobileDrawer.classList.remove("open");
    drawerOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  drawerLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeDrawer();
    });
  });
}

/* ==========================================================================
   4. SCROLLSPY & HEADER SCROLL EFFECT
   ========================================================================== */
function initScrollSpyAndHeader() {
  const header = document.getElementById("main-header");
  const navLinks = document.querySelectorAll(".desktop-nav .nav-link");
  const sections = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;

    if (scrollY > 20) {
      header.style.boxShadow = "var(--shadow-md)";
    } else {
      header.style.boxShadow = "none";
    }

    let currentId = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentId = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentId}`) {
        link.classList.add("active");
      }
    });
  });
}

/* ==========================================================================
   5. PROJECT FILTERING LOGIC
   ========================================================================== */
function initProjectFiltering() {
  const filterBtns = document.querySelectorAll(".filter-btn");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");
      const projectCards = document.querySelectorAll(".project-card");

      projectCards.forEach((card) => {
        const categories = card.getAttribute("data-category").split(" ");

        if (filterValue === "all" || categories.includes(filterValue)) {
          card.classList.remove("hidden");
          card.style.animation = "fadeInCard 0.4s ease forwards";
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
}

/* ==========================================================================
   5-1. ADMIN-MANAGED PROJECTS (관리자 페이지에서 "공개"로 등록한 프로젝트)
   data/public-projects.generated.js 가 존재하면 window.ADMIN_MANAGED_PROJECTS 에
   공개 프로젝트 배열이 채워진다. 기존 project-card 스타일을 그대로 재사용한다.
   ========================================================================== */
const MANAGED_PROJECT_THEMES = ["green-theme", "blue-theme", "teal-theme", "indigo-theme", "slate-theme"];

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function getManagedProjectsHtml() {
  const managedProjects = window.ADMIN_MANAGED_PROJECTS;
  if (!Array.isArray(managedProjects) || managedProjects.length === 0) return "";

  return managedProjects
    .map((proj, idx) => {
      const theme = MANAGED_PROJECT_THEMES[idx % MANAGED_PROJECT_THEMES.length];
      const svgHeader = getProjectSvgThumbnail(theme, proj.id);
      const noteLine = proj.notes ? ` · ${escapeHtml(proj.notes)}` : "";

      return `
        <article class="project-card" data-category="managed" data-id="${escapeHtml(proj.id)}">
          <div class="card-thumb-wrapper">
            <div class="project-badge managed">관리자 등록</div>
            <div class="card-visual-header ${theme}">
              ${svgHeader}
            </div>
          </div>
          <div class="project-card-body">
            <div class="project-meta">
              <span class="project-year"><i class="ph-bold ph-calendar"></i> ${escapeHtml(proj.date)}</span>
              <span class="project-role"><i class="ph-bold ph-user-circle"></i> ${escapeHtml(proj.role)}</span>
            </div>
            <h3 class="project-title">${escapeHtml(proj.title)}</h3>
            <div class="project-card-focus">
              <span class="card-label">프로젝트 설명</span>
              <p>${escapeHtml(proj.description)}</p>
            </div>
            <div class="project-card-result">
              <span class="card-label">참여 인원</span>
              <p>${escapeHtml(proj.participants)}${noteLine}</p>
            </div>
            <button class="project-open-btn" data-project-id="${escapeHtml(proj.id)}">
              <span>상세 내용 보기</span>
              <i class="ph-bold ph-arrow-up-right"></i>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

/* ==========================================================================
   6. PROJECT MODAL SYSTEM
   ========================================================================== */
function initProjectModal() {
  const modalBackdrop = document.getElementById("project-modal");
  const modalContent = document.getElementById("modal-dynamic-content");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  // Event delegation to catch dynamically created open buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-project-id]");
    if (!btn) return;

    e.preventDefault();
    const pId = btn.getAttribute("data-project-id");

    // Find project from PORTFOLIO_DATA (기존 큐레이션 프로젝트)
    const project = PORTFOLIO_DATA.projects.find((pr) => pr.id === pId);
    if (project) {
      renderModalContent(project);
      openModal();
      return;
    }

    // 없으면 관리자 페이지에서 등록한 프로젝트에서 찾기
    const managedProjects = window.ADMIN_MANAGED_PROJECTS || [];
    const managedProject = managedProjects.find((pr) => pr.id === pId);
    if (managedProject) {
      renderManagedModalContent(managedProject);
      openModal();
    }
  });

  function openModal() {
    modalBackdrop.classList.add("open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalBackdrop.classList.remove("open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
      closeModal();
    }
  });

  function renderModalContent(item) {
    const d = item.modalDetails;
    const objectivesHtml = d.objectives.map((obj) => `<li>${obj}</li>`).join("");
    const methodologyHtml = d.methodology.map((m) => `<li>${m}</li>`).join("");
    const toolsHtml = item.tools.map((t) => `<span>${t}</span>`).join("");

    modalContent.innerHTML = `
      <div class="modal-header-hero">
        <span class="modal-badge">${item.categoryLabel}</span>
        <h2 class="modal-title">${item.title}</h2>
        
        <div class="modal-meta-grid">
          <div class="modal-meta-item">
            <span class="meta-label">프로젝트 기간</span>
            <span class="meta-val">${item.period}</span>
          </div>
          <div class="modal-meta-item">
            <span class="meta-label">수행 역할</span>
            <span class="meta-val">${item.role}</span>
          </div>
          <div class="modal-meta-item">
            <span class="meta-label">연구 분야</span>
            <span class="meta-val">그린스마트시티 / 공간분석</span>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="modal-sec">
          <h3 class="modal-section-title"><i class="ph-bold ph-target"></i> 01. 문제 정의</h3>
          <p>${d.background}</p>
        </div>

        <div class="modal-sec">
          <h3 class="modal-section-title"><i class="ph-bold ph-check-square"></i> 02. 목표</h3>
          <ul class="modal-bullet-list">
            ${objectivesHtml}
          </ul>
        </div>

        <div class="modal-sec">
          <h3 class="modal-section-title"><i class="ph-bold ph-tree-structure"></i> 03. 데이터 & 방법</h3>
          <ul class="modal-bullet-list">
            ${methodologyHtml}
          </ul>
        </div>

        <div class="modal-sec">
          <h3 class="modal-section-title"><i class="ph-bold ph-user-circle"></i> 04. 본인의 기여</h3>
          <p>${item.role}</p>
        </div>

        <div class="modal-sec">
          <h3 class="modal-section-title"><i class="ph-bold ph-trophy"></i> 05. 결과와 의미</h3>
          <p>${d.results}</p>
        </div>

        <div class="modal-sec">
          <h3 class="modal-section-title"><i class="ph-bold ph-stack"></i> 활용 소프트웨어 & 툴킷</h3>
          <div class="modal-tools-tags">
            ${toolsHtml}
          </div>
        </div>
      </div>
    `;
  }

  // 관리자 페이지에서 등록한 프로젝트용 간단 모달 (title/role/description/date/participants/notes)
  function renderManagedModalContent(item) {
    modalContent.innerHTML = `
      <div class="modal-header-hero">
        <span class="modal-badge">관리자 등록</span>
        <h2 class="modal-title">${escapeHtml(item.title)}</h2>

        <div class="modal-meta-grid">
          <div class="modal-meta-item">
            <span class="meta-label">날짜</span>
            <span class="meta-val">${escapeHtml(item.date)}</span>
          </div>
          <div class="modal-meta-item">
            <span class="meta-label">수행 역할</span>
            <span class="meta-val">${escapeHtml(item.role)}</span>
          </div>
          <div class="modal-meta-item">
            <span class="meta-label">참여 인원</span>
            <span class="meta-val">${escapeHtml(item.participants)}</span>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="modal-sec">
          <h3 class="modal-section-title"><i class="ph-bold ph-target"></i> 프로젝트 설명</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>

        ${
          item.notes
            ? `<div class="modal-sec">
                <h3 class="modal-section-title"><i class="ph-bold ph-note"></i> 참고사항</h3>
                <p>${escapeHtml(item.notes)}</p>
              </div>`
            : ""
        }
      </div>
    `;
  }
}

/* ==========================================================================
   7. CLIPBOARD COPY ACTIONS
   ========================================================================== */
function initClipboardActions() {
  document.addEventListener("click", (e) => {
    const heroBtn = e.target.closest("#copy-email-hero-btn");
    const emailBtn = e.target.closest("#copy-email-btn");
    const phoneBtn = e.target.closest("#copy-phone-btn");

    if (heroBtn || emailBtn) {
      const email = PORTFOLIO_DATA.profile.email;
      copyToClipboard(email, `이메일 주소(${email})가 복사되었습니다!`);
    } else if (phoneBtn) {
      const phone = PORTFOLIO_DATA.profile.phone;
      copyToClipboard(phone, `연락처(${phone})가 복사되었습니다!`);
    }
  });

  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showToast(successMsg);
      } catch (err) {
        showToast("복사에 실패했습니다. 수동으로 복사해주세요.");
      }
      document.body.removeChild(textArea);
    }
  }
}

/* ==========================================================================
   8. CONTACT FORM VALIDATION & SIMULATION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const nameInput = document.getElementById("sender-name");
  const emailInput = document.getElementById("sender-email");
  const messageInput = document.getElementById("sender-message");
  const submitBtn = document.getElementById("form-submit-btn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;

    if (!nameInput.value.trim()) {
      setError(nameInput, true);
      isValid = false;
    } else {
      setError(nameInput, false);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      setError(emailInput, true);
      isValid = false;
    } else {
      setError(emailInput, false);
    }

    if (!messageInput.value.trim()) {
      setError(messageInput, true);
      isValid = false;
    } else {
      setError(messageInput, false);
    }

    if (!isValid) return;

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph-bold ph-spinner ph-spin"></i> <span>전송 중...</span>`;

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
      form.reset();
      showToast(`🌿 메시지가 ${PORTFOLIO_DATA.profile.name} 님에게 전송되었습니다!`);
    }, 1000);
  });

  function setError(inputElem, hasError) {
    const parent = inputElem.closest(".form-group");
    if (hasError) {
      parent.classList.add("has-error");
    } else {
      parent.classList.remove("has-error");
    }
  }

  [nameInput, emailInput, messageInput].forEach((input) => {
    if (input) {
      input.addEventListener("input", () => {
        setError(input, false);
      });
    }
  });
}

/* ==========================================================================
   9. BACK TO TOP BUTTON
   ========================================================================== */
function initBackToTop() {
  const backToTopBtn = document.getElementById("back-to-top");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

/* ==========================================================================
   10. TOAST NOTIFICATION UTILITY
   ========================================================================== */
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toast-text");
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
