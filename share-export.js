/**
 * ==========================================================================
 * SHARE MENU & STRUCTURED PDF EXPORT
 * - Link share: native share sheet on touch devices, clipboard elsewhere
 * - PDF share: typesets portfolio-data.js into an A4 document with pdfmake.
 *   It is a new layout built from the data, not a print of the web page.
 * ==========================================================================
 */

const PDFMAKE_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/pdfmake.min.js";
const PDF_FONT_BASE = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/alternative/";
const PDF_SECTION_PREFIX = "pdf-sec-";

const PDF_COLORS = {
  ink: "#141210",
  body: "#3d3833",
  muted: "#857d74",
  line: "#e3ddd4",
  paper: "#f3efe9",
  panel: "#f7f3ee",
  accent: "#e8683a",
  accentInk: "#b4461d",
  pink: "#f0a0bc",
};

const PDF_PAGE = { width: 595.28, height: 841.89, marginX: 56 };
const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_PAGE.marginX * 2;

const PDF_STYLES = {
  kicker: { fontSize: 8, bold: true, color: PDF_COLORS.accent, characterSpacing: 0.5 },
  h1: { fontSize: 18, bold: true, color: PDF_COLORS.ink, lineHeight: 1.2, margin: [0, 4, 0, 0] },
  h2: { fontSize: 12, bold: true, color: PDF_COLORS.ink, margin: [0, 14, 0, 6] },
  lead: { fontSize: 10, color: PDF_COLORS.ink, lineHeight: 1.5 },
  body: { fontSize: 9, color: PDF_COLORS.body, lineHeight: 1.5 },
  meta: { fontSize: 8, color: PDF_COLORS.muted, lineHeight: 1.45 },
  label: { fontSize: 8, bold: true, color: PDF_COLORS.muted, margin: [0, 1, 0, 0] },
  coverTitle: { fontSize: 46, bold: true, color: PDF_COLORS.ink, lineHeight: 0.95, characterSpacing: -1.2 },
};

const PDF_LINK_LABELS = {
  github: "GitHub",
  notion: "Notion",
  linkedin: "LinkedIn",
  department: "학과 홈페이지",
};

/* ==========================================================================
   1. SHARE MENU
   ========================================================================== */
function initShareMenu() {
  const toggle = document.getElementById("share-toggle");
  const menu = document.getElementById("share-menu");
  const linkBtn = document.getElementById("share-link-btn");
  const pdfBtn = document.getElementById("share-pdf-btn");
  if (!toggle || !menu) return;

  function setOpen(open) {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });

  document.addEventListener("click", (e) => {
    if (!menu.hidden && !e.target.closest(".share-menu-wrap")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });

  if (linkBtn) {
    linkBtn.addEventListener("click", async () => {
      setOpen(false);
      await sharePortfolioLink();
    });
  }

  if (pdfBtn) {
    pdfBtn.addEventListener("click", async () => {
      if (pdfBtn.getAttribute("aria-busy") === "true") return;

      const icon = pdfBtn.querySelector("i");
      const desc = document.getElementById("share-pdf-desc");
      const idle = { icon: icon.className, desc: desc.textContent };

      pdfBtn.setAttribute("aria-busy", "true");
      icon.className = "ph-bold ph-spinner share-spin";
      desc.textContent = "문서를 만드는 중…";

      try {
        const result = await exportPortfolioPdf(PORTFOLIO_DATA);
        setOpen(false);
        if (result === "downloaded") showToast("핵심 내용을 정리한 PDF를 저장했습니다.");
        if (result === "shared") showToast("PDF를 공유했습니다.");
      } catch (err) {
        console.error("[PDF export]", err);
        showToast("PDF를 만들지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.");
      } finally {
        pdfBtn.removeAttribute("aria-busy");
        icon.className = idle.icon;
        desc.textContent = idle.desc;
      }
    });
  }
}

async function sharePortfolioLink() {
  if (window.location.protocol === "file:") {
    showToast("내 컴퓨터에서 연 파일이라 공유할 링크가 없습니다. 웹에 올린 주소에서 사용해 주세요.");
    return;
  }

  const url = window.location.href.split("#")[0];
  const p = PORTFOLIO_DATA.profile;

  if (isTouchDevice() && navigator.share) {
    try {
      await navigator.share({ title: `${p.name} | ${p.department} 포트폴리오`, url });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }

  const copied = await copyText(url);
  showToast(copied ? "포트폴리오 링크가 복사되었습니다." : "링크 복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // fall through to the legacy path
    }
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (err) {
    ok = false;
  }
  document.body.removeChild(textArea);
  return ok;
}

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches;
}

/* ==========================================================================
   2. PDF EXPORT PIPELINE
   ========================================================================== */
let pdfMakeLoading = null;

function loadPdfMake() {
  if (window.pdfMake) return Promise.resolve(window.pdfMake);
  if (!pdfMakeLoading) {
    pdfMakeLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PDFMAKE_URL;
      script.async = true;
      script.onload = () => (window.pdfMake ? resolve(window.pdfMake) : reject(new Error("pdfmake did not load")));
      script.onerror = () => {
        pdfMakeLoading = null;
        reject(new Error("pdfmake script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return pdfMakeLoading;
}

async function exportPortfolioPdf(data) {
  const pdfMake = await loadPdfMake();
  pdfMake.setFonts({
    Pretendard: {
      normal: PDF_FONT_BASE + "Pretendard-Regular.ttf",
      bold: PDF_FONT_BASE + "Pretendard-Bold.ttf",
      italics: PDF_FONT_BASE + "Pretendard-Regular.ttf",
      bolditalics: PDF_FONT_BASE + "Pretendard-Bold.ttf",
    },
  });

  // Pass 1 lays the document out only to learn the page each section starts on.
  // Pass 2 repeats the identical layout with those section names in the header.
  const sectionPages = {};
  await pdfMake
    .createPdf(buildPortfolioDoc(data, { onSectionStart: (id, page) => (sectionPages[id] = page) }))
    .getBuffer();
  const blob = await pdfMake.createPdf(buildPortfolioDoc(data, { sectionPages })).getBlob();

  const fileName = `${data.profile.name}_포트폴리오_${formatDate(new Date(), "-")}.pdf`;
  return deliverPdf(blob, fileName, `${data.profile.name} 포트폴리오`);
}

async function deliverPdf(blob, fileName, title) {
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (isTouchDevice() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (err) {
      if (err.name === "AbortError") return "cancelled";
      // share sheet unavailable (e.g. activation expired) -> download instead
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return "downloaded";
}

/* ==========================================================================
   3. DOCUMENT DEFINITION
   Order follows CLAUDE.MD section 4: Cover, Contents, About, Core Skills,
   Projects, Career, Contact. Every sentence comes from portfolio-data.js.
   ========================================================================== */
function buildPortfolioDoc(data, { sectionPages = {}, onSectionStart = null } = {}) {
  const p = data.profile;
  const sections = describePdfSections(data);
  const generatedOn = formatDate(new Date(), ".");

  return {
    pageSize: "A4",
    pageMargins: [PDF_PAGE.marginX, 72, PDF_PAGE.marginX, 56],
    language: "ko-KR",
    info: {
      title: `${p.name} 포트폴리오`,
      author: `${p.name} (${p.enName})`,
      subject: p.sloganBadge,
      keywords: (data.about?.interests || []).join(", "),
    },
    defaultStyle: { font: "Pretendard", fontSize: 9, lineHeight: 1.45, color: PDF_COLORS.body },
    styles: PDF_STYLES,
    background: pdfCoverBackground,
    header: (currentPage) => pdfRunningHeader(currentPage, sections, sectionPages, p),
    footer: (currentPage, pageCount) =>
      currentPage === 1
        ? null
        : {
            margin: [PDF_PAGE.marginX, 26, PDF_PAGE.marginX, 0],
            columns: [
              { text: `${p.name} · ${p.enName}`, fontSize: 7.5, color: PDF_COLORS.muted },
              { text: `${currentPage} / ${pageCount}`, alignment: "right", fontSize: 7.5, color: PDF_COLORS.muted },
            ],
          },
    pageBreakBefore: (node) => {
      if (onSectionStart && node.id && node.id.startsWith(PDF_SECTION_PREFIX)) {
        onSectionStart(node.id, node.pageNumbers[0]);
      }
      return false;
    },
    content: [
      ...pdfCover(data, generatedOn),
      ...pdfContents(),
      ...pdfAbout(data),
      ...pdfSkills(data),
      ...pdfProjectsOverview(data),
      ...pdfProjects(data),
      ...pdfCareer(data),
      ...pdfContact(data, generatedOn),
    ],
  };
}

function describePdfSections(data) {
  const list = [
    { id: "contents", label: "Contents" },
    { id: "about", label: "About" },
    { id: "skills", label: "Core Skills" },
    { id: "projects", label: "Projects" },
    ...(data.projects || []).map((proj, i) => ({
      id: `project-${proj.id}`,
      label: `Project ${pad2(i + 1)}`,
      project: proj.title,
    })),
    { id: "career", label: "Career" },
    { id: "contact", label: "Contact" },
  ];
  return Object.fromEntries(list.map((s) => [PDF_SECTION_PREFIX + s.id, s]));
}

// "페이지 번호 / 섹션명 / 프로젝트명" (CLAUDE.MD section 4)
function pdfRunningHeader(currentPage, sections, sectionPages, profile) {
  if (currentPage === 1) return null;

  let current = null;
  let startPage = 0;
  Object.entries(sectionPages).forEach(([id, page]) => {
    if (page <= currentPage && page >= startPage) {
      startPage = page;
      current = sections[id];
    }
  });

  const trail = [pad2(currentPage), current && current.label, current && current.project && truncate(current.project, 30)]
    .filter(Boolean)
    .join("   /   ");

  return {
    margin: [PDF_PAGE.marginX, 34, PDF_PAGE.marginX, 0],
    stack: [
      {
        columns: [
          { width: "*", text: trail, fontSize: 7.5, color: PDF_COLORS.muted, noWrap: true },
          { width: "auto", text: `${displayName(profile)} — PORTFOLIO`, fontSize: 7.5, color: PDF_COLORS.muted },
        ],
      },
      { canvas: [{ type: "line", x1: 0, y1: 8, x2: PDF_CONTENT_WIDTH, y2: 8, lineWidth: 0.5, lineColor: PDF_COLORS.line }] },
    ],
  };
}

function pdfCoverBackground(currentPage, pageSize) {
  if (currentPage !== 1) return null;

  // Soft gradient orb (same motif as the web hero), faked with stacked translucent circles
  const steps = 40;
  const rings = Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const r = 240 - t * 180;
    return {
      type: "ellipse",
      x: pageSize.width - 60,
      y: 420,
      r1: r,
      r2: r,
      color: mixHex(PDF_COLORS.pink, PDF_COLORS.accent, t),
      fillOpacity: 0.02 + t * 0.022,
    };
  });

  return {
    canvas: [{ type: "rect", x: 0, y: 0, w: pageSize.width, h: pageSize.height, color: PDF_COLORS.paper }, ...rings],
  };
}

/* --- Cover ------------------------------------------------------------- */
function pdfCover(data, generatedOn) {
  const p = data.profile;

  const contacts = [
    ["EMAIL", p.email],
    ["PHONE", p.phone],
    ["LOCATION", p.location],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => ({
      width: "auto",
      stack: [
        { text: label, fontSize: 7, bold: true, color: PDF_COLORS.muted, characterSpacing: 0.4 },
        { text: words(value), fontSize: 9, color: PDF_COLORS.ink, margin: [0, 2, 0, 0] },
      ],
    }));

  return [
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "PORTFOLIO", style: "kicker" },
            { text: p.sloganBadge, style: "meta", margin: [0, 3, 0, 0] },
          ],
        },
        { width: "auto", text: generatedOn, style: "meta" },
      ],
    },
    { text: displayName(p), style: "coverTitle", margin: [0, 170, 0, 0] },
    { text: "PORTFOLIO", style: "coverTitle" },
    {
      text: words(`${p.name}  ·  ${p.department} ${p.studentId} ${p.status}`),
      fontSize: 11.5,
      color: PDF_COLORS.ink,
      margin: [0, 14, 0, 0],
    },
    {
      columns: [
        {
          width: 300,
          stack: [
            {
              text: words(htmlToPlain(p.mainHeadline, "\n")),
              fontSize: 15,
              bold: true,
              color: PDF_COLORS.ink,
              lineHeight: 1.35,
              margin: [0, 40, 0, 10],
            },
            { text: words(htmlToRuns(p.subHeadline, { br: " " })), style: "body" },
          ],
        },
        { width: "*", text: "" },
      ],
    },
    { absolutePosition: { x: PDF_PAGE.marginX, y: 744 }, columns: contacts, columnGap: 36 },
  ];
}

/* --- Contents ---------------------------------------------------------- */
function pdfContents() {
  return [
    pdfSectionOpener("contents", "CONTENTS", "목차", { toc: false }),
    {
      toc: {
        textStyle: { fontSize: 10.5, color: PDF_COLORS.ink },
        numberStyle: { fontSize: 10.5, color: PDF_COLORS.muted },
      },
    },
  ];
}

/* --- About ------------------------------------------------------------- */
function pdfAbout(data) {
  const p = data.profile;
  const a = data.about || {};
  const blocks = [
    pdfSectionOpener("about", "01  ABOUT", "소개"),
    pdfKeyValueTable([
      ["이름", `${p.name} (${p.enName})`],
      ["소속", `${p.department} ${p.studentId}`],
      ["상태", p.status],
      ["활동 지역", p.location],
    ]),
  ];

  if (p.quote) blocks.push(pdfQuote(htmlToPlain(p.quote)));

  if (a.bioParagraphs && a.bioParagraphs.length) {
    blocks.push(
      ...pdfGroup(
        "소개 & 학업 비전",
        a.bioParagraphs.map((para) => ({ text: words(htmlToRuns(para)), style: "body", margin: [0, 0, 0, 8] }))
      )
    );
  }

  if (a.coreValues && a.coreValues.length) {
    blocks.push(
      ...pdfGroup("핵심 가치", [
        {
          table: {
            widths: [26, "*"],
            body: a.coreValues.map((v) => [
              { text: v.step, bold: true, fontSize: 10, color: PDF_COLORS.accent },
              {
                stack: [
                  { text: words(v.title), bold: true, fontSize: 10.5, color: PDF_COLORS.ink },
                  { text: words(v.desc), style: "body", margin: [0, 2, 0, 0] },
                ],
              },
            ]),
          },
          layout: pdfRuledLayout(),
        },
      ])
    );
  }

  if (a.interests && a.interests.length) {
    const half = Math.ceil(a.interests.length / 2);
    blocks.push(
      ...pdfGroup("주요 관심 및 탐구 분야", [
        {
          columnGap: 24,
          columns: [a.interests.slice(0, half), a.interests.slice(half)].map((column) => ({
            width: "*",
            ul: column.map((item) => ({ text: words(item), margin: [0, 0, 0, 3] })),
            markerColor: PDF_COLORS.accent,
            style: "body",
          })),
        },
      ])
    );
  }

  return blocks;
}

/* --- Core Skills ------------------------------------------------------- */
function pdfSkills(data) {
  const blocks = [pdfSectionOpener("skills", "02  CORE SKILLS", "핵심 역량")];

  (data.skills || []).forEach((cat) => {
    blocks.push({
      unbreakable: true,
      margin: [0, 0, 0, 12],
      stack: [
        {
          columns: [
            { width: "*", text: words(cat.category), fontSize: 12.5, bold: true, color: PDF_COLORS.ink },
            { width: "auto", text: cat.engTag || "", style: "meta", margin: [0, 4, 0, 0] },
          ],
        },
        cat.desc ? { text: words(cat.desc), style: "body", margin: [0, 2, 0, 6] } : null,
        {
          table: {
            widths: ["*", 150, 88],
            body: (cat.items || []).map((item) => [
              { text: words(item.name), bold: true, color: PDF_COLORS.ink },
              { text: words(item.levelText || ""), style: "meta", margin: [0, 1, 0, 0] },
              pdfLevelBar(item.percent),
            ]),
          },
          layout: pdfRuledLayout(),
        },
      ].filter(Boolean),
    });
  });

  return blocks;
}

function pdfLevelBar(percent) {
  const width = 54;
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  return {
    columnGap: 6,
    columns: [
      {
        width,
        canvas: [
          { type: "rect", x: 0, y: 6, w: width, h: 3, r: 1.5, color: PDF_COLORS.line },
          { type: "rect", x: 0, y: 6, w: (width * value) / 100, h: 3, r: 1.5, color: PDF_COLORS.accent },
        ],
      },
      { width: "*", text: `${value}%`, alignment: "right", fontSize: 8.5, color: PDF_COLORS.ink },
    ],
  };
}

/* --- Projects ---------------------------------------------------------- */
function pdfProjectsOverview(data) {
  const projects = data.projects || [];
  if (!projects.length) return [];

  // Reuse the section description already written on the web page
  const intro = document.querySelector("#projects .section-desc");

  return [
    pdfSectionOpener("projects", "03  PROJECTS", "프로젝트"),
    intro ? { text: words(intro.textContent.trim()), style: "body", margin: [0, 0, 0, 14] } : null,
    {
      table: {
        headerRows: 1,
        widths: [22, "*", 92, 96],
        body: [
          pdfTableHead(["No.", "프로젝트", "분야", "기간"]),
          ...projects.map((proj, i) => [
            { text: pad2(i + 1), bold: true, color: PDF_COLORS.accent },
            { text: words(proj.title), bold: true, color: PDF_COLORS.ink },
            { text: words(proj.categoryLabel || ""), style: "meta", margin: [0, 1, 0, 0] },
            { text: words(proj.period || ""), style: "meta", margin: [0, 1, 0, 0] },
          ]),
        ],
      },
      layout: pdfRuledLayout({ header: true }),
    },
  ].filter(Boolean);
}

function pdfProjects(data) {
  return (data.projects || []).flatMap((proj, i) => {
    const d = proj.modalDetails || {};
    const nodes = [
      {
        pageBreak: "before",
        stack: [
          { text: `03  PROJECT ${pad2(i + 1)}`, style: "kicker" },
          {
            text: words(proj.title),
            style: "h1",
            id: `${PDF_SECTION_PREFIX}project-${proj.id}`,
            tocItem: true,
            tocStyle: { fontSize: 9.5, color: PDF_COLORS.body },
            tocMargin: [14, 3, 0, 0],
          },
          proj.summary ? { text: words(proj.summary), style: "lead", margin: [0, 6, 0, 10] } : { text: "", margin: [0, 0, 0, 10] },
          pdfKeyValueTable([
            ["기간", proj.period],
            ["분야", proj.categoryLabel],
            ["사용 도구", (proj.tools || []).join(", ")],
          ]),
        ],
      },
    ];

    // Same five steps and labels as the web project modal
    const steps = [
      ["01", "문제 정의", d.background && { text: words(htmlToRuns(d.background)), style: "body" }],
      ["02", "목표", d.objectives && d.objectives.length && pdfBulletList(d.objectives)],
      ["03", "데이터 & 방법", d.methodology && d.methodology.length && pdfBulletList(d.methodology)],
      ["04", "본인의 기여", proj.role && { text: words(htmlToRuns(proj.role)), style: "body" }],
      ["05", "결과와 의미", d.results && pdfHighlight(htmlToRuns(d.results))],
    ];

    steps.filter(([, , body]) => body).forEach(([number, title, body]) => nodes.push(pdfNumberedBlock(number, title, body)));
    return nodes;
  });
}

/* --- Career ------------------------------------------------------------ */
function pdfCareer(data) {
  const c = data.career || {};
  const blocks = [pdfSectionOpener("career", "04  CAREER", "자격증 · 활동 · 수상")];

  if (c.certifications && c.certifications.length) {
    blocks.push(
      ...pdfGroup("자격증 & 교육 이수", [
        {
          table: {
            headerRows: 1,
            widths: ["*", 62, 120],
            body: [
              pdfTableHead(["자격 · 교육", "상태", "기관"]),
              ...c.certifications.map((cert) => [
                {
                  stack: [
                    { text: words(cert.title), bold: true, color: PDF_COLORS.ink },
                    cert.desc ? { text: words(cert.desc), style: "meta", margin: [0, 1, 0, 0] } : null,
                  ].filter(Boolean),
                },
                {
                  text: cert.statusText || "",
                  bold: true,
                  fontSize: 8.5,
                  color: cert.status === "pass" ? PDF_COLORS.accentInk : PDF_COLORS.muted,
                },
                { text: words(cert.org || ""), style: "meta", margin: [0, 1, 0, 0] },
              ]),
            ],
          },
          layout: pdfRuledLayout({ header: true }),
        },
      ])
    );
  }

  [
    ["학술 활동 & 대외활동", c.activities],
    ["수상 및 학업 성과", c.awards],
  ].forEach(([title, items]) => {
    if (!items || !items.length) return;
    blocks.push(
      ...pdfGroup(
        title,
        items.map((item) => ({
          unbreakable: true,
          margin: [0, 0, 0, 12],
          columnGap: 12,
          columns: [
            { width: 118, text: item.period || "", fontSize: 8.5, bold: true, color: PDF_COLORS.accentInk, margin: [0, 1.5, 0, 0] },
            {
              width: "*",
              stack: [
                { text: words(item.title), bold: true, fontSize: 10.5, color: PDF_COLORS.ink },
                item.org ? { text: words(item.org), style: "meta" } : null,
                item.desc ? { text: words(item.desc), style: "body", margin: [0, 3, 0, 0] } : null,
              ].filter(Boolean),
            },
          ],
        }))
      )
    );
  });

  return blocks;
}

/* --- Contact ----------------------------------------------------------- */
function pdfContact(data, generatedOn) {
  const p = data.profile;
  const rows = [
    ["이메일", { text: p.email, link: `mailto:${p.email}`, color: PDF_COLORS.ink }],
    ["연락처", p.phone],
    ["활동 지역", p.location],
  ];

  const pageUrl = shareablePageUrl();
  if (pageUrl) rows.push(["웹 포트폴리오", { text: pageUrl, link: pageUrl, color: PDF_COLORS.accentInk }]);
  pdfUsableLinks(p.socialLinks).forEach(([label, url]) => {
    rows.push([label, { text: url, link: url, color: PDF_COLORS.accentInk }]);
  });

  return [
    pdfSectionOpener("contact", "05  CONTACT", "연락처"),
    {
      text: words(htmlToPlain(p.mainHeadline, " ")),
      fontSize: 15,
      bold: true,
      color: PDF_COLORS.ink,
      lineHeight: 1.35,
      margin: [0, 0, 0, 18],
    },
    pdfKeyValueTable(rows),
    { text: words(`이 문서는 웹 포트폴리오의 내용을 바탕으로 ${generatedOn}에 생성되었습니다.`), style: "meta", margin: [0, 24, 0, 0] },
  ];
}

/* ==========================================================================
   4. BUILDING BLOCKS
   ========================================================================== */
function pdfSectionOpener(id, kicker, title, { toc = true } = {}) {
  const heading = { text: words(title), style: "h1", id: PDF_SECTION_PREFIX + id };
  if (toc) {
    heading.tocItem = true;
    heading.tocStyle = { fontSize: 10.5, bold: true, color: PDF_COLORS.ink };
    heading.tocMargin = [0, 12, 0, 0];
  }
  return {
    pageBreak: "before",
    stack: [
      { text: kicker, style: "kicker" },
      heading,
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: PDF_CONTENT_WIDTH, y2: 0, lineWidth: 1, lineColor: PDF_COLORS.ink }],
        margin: [0, 6, 0, 14],
      },
    ],
  };
}

// Keeps a sub-heading on the same page as its first block
function pdfGroup(title, nodes) {
  if (!nodes.length) return [];
  const [first, ...rest] = nodes;
  return [{ unbreakable: true, stack: [{ text: words(title), style: "h2" }, first] }, ...rest];
}

function pdfNumberedBlock(number, title, body) {
  return {
    unbreakable: true,
    margin: [0, 11, 0, 0],
    stack: [
      {
        margin: [0, 0, 0, 4],
        columns: [
          { width: 24, text: number, fontSize: 9, bold: true, color: PDF_COLORS.accent, margin: [0, 1.5, 0, 0] },
          { width: "*", text: words(title), fontSize: 10.5, bold: true, color: PDF_COLORS.ink },
        ],
      },
      { margin: [24, 0, 0, 0], stack: [body] },
    ],
  };
}

function pdfBulletList(items) {
  return {
    ul: items.map((item) => ({ text: words(htmlToRuns(item)), margin: [0, 0, 0, 2] })),
    markerColor: PDF_COLORS.accent,
    style: "body",
  };
}

function pdfHighlight(runs) {
  return {
    table: {
      widths: ["*"],
      body: [[{ text: words(runs), style: "body", color: PDF_COLORS.ink, fillColor: PDF_COLORS.panel, margin: [10, 8, 10, 8] }]],
    },
    layout: "noBorders",
  };
}

function pdfQuote(text) {
  return {
    margin: [0, 4, 0, 6],
    table: { widths: ["*"], body: [[{ text: words(text), fontSize: 10.5, color: PDF_COLORS.ink, lineHeight: 1.55 }]] },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (i) => (i === 0 ? 2 : 0),
      vLineColor: () => PDF_COLORS.accent,
      paddingLeft: () => 12,
      paddingRight: () => 0,
      paddingTop: () => 2,
      paddingBottom: () => 2,
    },
  };
}

function pdfKeyValueTable(rows) {
  return {
    margin: [0, 0, 0, 10],
    table: {
      widths: [72, "*"],
      body: rows
        .filter(([, value]) => value)
        .map(([label, value]) => [
          { text: label, style: "label" },
          typeof value === "string" ? { text: words(value), color: PDF_COLORS.ink } : value,
        ]),
    },
    layout: pdfRuledLayout(),
  };
}

function pdfTableHead(labels) {
  return labels.map((label) => ({ text: label, style: "label" }));
}

function pdfRuledLayout({ header = false } = {}) {
  return {
    hLineWidth: (i, node) => {
      if (i === 0 || i === node.table.body.length) return 0;
      return header && i === 1 ? 0.8 : 0.5;
    },
    vLineWidth: () => 0,
    hLineColor: (i) => (header && i === 1 ? PDF_COLORS.ink : PDF_COLORS.line),
    paddingLeft: (i) => (i === 0 ? 0 : 10),
    paddingRight: () => 0,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  };
}

/* ==========================================================================
   5. TEXT HELPERS
   ========================================================================== */

// pdfmake may wrap Hangul between any two syllables. Emitting every space-separated
// word as its own noWrap run leaves spaces as the only break points ("keep-all").
function words(input) {
  const runs = typeof input === "string" ? [{ text: input }] : input;
  const out = [];
  runs.forEach(({ text, ...style }) => {
    String(text)
      .split(/(\n)/)
      .forEach((segment) => {
        if (segment === "\n") {
          out.push({ text: "\n" });
          return;
        }
        segment.split(/(?<= )/).forEach((word) => {
          if (word) out.push({ ...style, text: word, noWrap: true });
        });
      });
  });
  return out;
}

// "<strong>" -> bold runs; other tags are dropped
function htmlToRuns(html, { br = "\n" } = {}) {
  const runs = [];
  let bold = false;
  String(html == null ? "" : html)
    .replace(/<br\s*[^>]*>/gi, br)
    .split(/(<\/?(?:strong|b)>)/i)
    .forEach((chunk) => {
      if (/^<(strong|b)>$/i.test(chunk)) {
        bold = true;
        return;
      }
      if (/^<\/(strong|b)>$/i.test(chunk)) {
        bold = false;
        return;
      }
      const text = decodeHtml(chunk.replace(/<[^>]+>/g, ""));
      if (text) runs.push(bold ? { text, bold: true } : { text });
    });
  return runs;
}

function htmlToPlain(html, br = " ") {
  return htmlToRuns(html, { br })
    .map((run) => run.text)
    .join("")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function decodeHtml(text) {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

function displayName(profile) {
  return profile.enName.replace(/-/g, " ").toUpperCase();
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDate(date, sep) {
  return [date.getFullYear(), pad2(date.getMonth() + 1), pad2(date.getDate())].join(sep);
}

function mixHex(from, to, t) {
  const a = from.match(/\w\w/g).map((h) => parseInt(h, 16));
  const b = to.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `#${a.map((v, i) => pad2(Math.round(v + (b[i] - v) * t).toString(16))).join("")}`;
}

// Only a real web address is worth printing (not file:// or localhost)
function shareablePageUrl() {
  const { protocol, hostname, href } = window.location;
  if (!/^https?:$/.test(protocol) || ["localhost", "127.0.0.1", ""].includes(hostname)) return null;
  return href.split("#")[0];
}

// Skips placeholder links such as "https://github.com" that point to no profile
function pdfUsableLinks(links = {}) {
  return Object.entries(links || {})
    .filter(([, url]) => {
      try {
        return new URL(url).pathname.replace(/\/+$/, "") !== "";
      } catch (err) {
        return false;
      }
    })
    .map(([key, url]) => [PDF_LINK_LABELS[key] || key, url]);
}
