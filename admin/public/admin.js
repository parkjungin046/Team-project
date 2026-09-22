/**
 * 관리자 페이지 프론트엔드 로직.
 *
 * 중요: 비밀번호는 로그인 요청 한 번 보내는 데만 사용하고 즉시 버립니다.
 * localStorage/sessionStorage 등 브라우저 저장소에 비밀번호나 로그인 여부를
 * 절대 저장하지 않습니다. 로그인 상태는 오직 서버의 세션 쿠키로만 유지되며,
 * 그 쿠키는 브라우저를 닫으면 자동으로 사라집니다.
 */
(() => {
  const loginScreen = document.getElementById("login-screen");
  const adminScreen = document.getElementById("admin-screen");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");

  const form = document.getElementById("project-form");
  const formTitle = document.getElementById("form-title");
  const formError = document.getElementById("form-error");
  const idField = document.getElementById("project-id");
  const fields = {
    title: document.getElementById("field-title"),
    role: document.getElementById("field-role"),
    description: document.getElementById("field-description"),
    date: document.getElementById("field-date"),
    participants: document.getElementById("field-participants"),
    notes: document.getElementById("field-notes"),
  };
  const newBtn = document.getElementById("new-btn");
  const projectListEl = document.getElementById("project-list");
  const projectCountEl = document.getElementById("project-count");
  const duplicatePanel = document.getElementById("duplicate-panel");
  const duplicateGroupsEl = document.getElementById("duplicate-groups");

  const REQUIRED_FOR_PUBLISH = ["title", "role", "description", "date", "participants"];

  async function api(url, options = {}) {
    const res = await fetch(url, {
      credentials: "include", // 세션 쿠키를 항상 함께 전송
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `요청에 실패했습니다. (${res.status})`);
    }
    return data;
  }

  /* ---------------- 로그인 / 세션 ---------------- */

  async function checkSession() {
    try {
      const { loggedIn } = await api("/api/admin/session");
      showScreen(loggedIn);
      if (loggedIn) await loadAll();
    } catch {
      showScreen(false);
    }
  }

  function showScreen(loggedIn) {
    loginScreen.hidden = loggedIn;
    adminScreen.hidden = !loggedIn;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const passwordInput = document.getElementById("login-password");
    const password = passwordInput.value;

    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      passwordInput.value = ""; // 입력값을 즉시 비움 (메모리/화면에 남기지 않음)
      showScreen(true);
      await loadAll();
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST" });
    showScreen(false);
  });

  /* ---------------- 프로젝트 목록 ---------------- */

  async function loadAll() {
    await Promise.all([loadProjects(), loadDuplicates()]);
  }

  async function loadProjects() {
    const { projects } = await api("/api/admin/projects");
    renderProjectList(projects);
  }

  function renderProjectList(projects) {
    projectCountEl.textContent = projects.length;

    if (projects.length === 0) {
      projectListEl.innerHTML = `<p class="empty-msg">아직 등록된 프로젝트가 없습니다. 왼쪽 폼에서 새로 추가해 보세요.</p>`;
      return;
    }

    projectListEl.innerHTML = projects
      .map((p) => {
        const statusLabel = p.status === "published" ? "공개" : "초안";
        return `
        <div class="project-row" data-id="${escapeAttr(p.id)}">
          <div class="project-row-main">
            <span class="status-badge ${p.status}">${statusLabel}</span>
            <h3>${escapeHtml(p.title) || "(제목 없음)"}</h3>
            <p class="project-row-meta">${escapeHtml(p.date) || "날짜 미입력"} · ${escapeHtml(p.role) || "역할 미입력"} · 참여인원 ${escapeHtml(p.participants) || "미입력"}</p>
            <p class="project-row-desc">${escapeHtml(p.description) || "설명이 아직 없습니다."}</p>
          </div>
          <div class="project-row-actions">
            <button type="button" class="edit-btn" data-id="${escapeAttr(p.id)}">수정</button>
            <button type="button" class="delete-btn" data-id="${escapeAttr(p.id)}">삭제</button>
          </div>
        </div>`;
      })
      .join("");
  }

  projectListEl.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (editBtn) {
      const id = editBtn.dataset.id;
      const { projects } = await api("/api/admin/projects");
      const project = projects.find((p) => p.id === id);
      if (project) loadIntoForm(project);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm("이 프로젝트를 삭제할까요? 되돌릴 수 없습니다.")) return;
      await api(`/api/admin/projects/${id}`, { method: "DELETE" });
      resetForm();
      await loadAll();
    }
  });

  /* ---------------- 입력 폼 ---------------- */

  function loadIntoForm(project) {
    idField.value = project.id;
    fields.title.value = project.title || "";
    fields.role.value = project.role || "";
    fields.description.value = project.description || "";
    fields.date.value = project.date || "";
    fields.participants.value = project.participants || "";
    fields.notes.value = project.notes || "";
    document.querySelector(`input[name="status"][value="${project.status}"]`).checked = true;
    formTitle.textContent = "프로젝트 수정";
    formError.textContent = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    idField.value = "";
    Object.values(fields).forEach((f) => (f.value = ""));
    document.querySelector('input[name="status"][value="draft"]').checked = true;
    formTitle.textContent = "새 프로젝트 등록";
    formError.textContent = "";
  }

  newBtn.addEventListener("click", resetForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";

    const status = document.querySelector('input[name="status"]:checked').value;
    const payload = {
      title: fields.title.value.trim(),
      role: fields.role.value.trim(),
      description: fields.description.value.trim(),
      date: fields.date.value.trim(),
      participants: fields.participants.value.trim(),
      notes: fields.notes.value.trim(),
      status,
    };

    if (status === "published") {
      const missing = REQUIRED_FOR_PUBLISH.filter((key) => !payload[key]);
      if (missing.length > 0) {
        formError.textContent = "공개하려면 참고사항을 제외한 모든 칸을 입력해야 합니다.";
        return;
      }
    }

    try {
      const id = idField.value;
      if (id) {
        await api(`/api/admin/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/admin/projects", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await loadAll();
    } catch (err) {
      formError.textContent = err.message;
    }
  });

  /* ---------------- 중복 프로젝트 ---------------- */

  async function loadDuplicates() {
    const { groups } = await api("/api/admin/duplicates");
    if (!groups || groups.length === 0) {
      duplicatePanel.hidden = true;
      return;
    }
    duplicatePanel.hidden = false;
    duplicateGroupsEl.innerHTML = groups
      .map((group) => {
        const items = group
          .map(
            (p) => `
            <div class="duplicate-item">
              <span>${escapeHtml(p.title) || "(제목 없음)"} · ${p.status === "published" ? "공개" : "초안"} · 수정일 ${formatDate(p.updatedAt)}</span>
              <button type="button" class="keep-btn" data-keep="${escapeAttr(p.id)}" data-group="${escapeAttr(group.map((g) => g.id).join(","))}">
                이것만 남기기
              </button>
            </div>`
          )
          .join("");
        return `
        <div class="duplicate-group">
          <div class="duplicate-group-title">"${escapeHtml(group[0].title)}" 제목으로 ${group.length}건이 중복 등록되어 있습니다.</div>
          ${items}
        </div>`;
      })
      .join("");
  }

  duplicateGroupsEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".keep-btn");
    if (!btn) return;
    const keepId = btn.dataset.keep;
    const allIds = btn.dataset.group.split(",");
    const removeIds = allIds.filter((id) => id !== keepId);

    if (!confirm(`선택한 1건만 남기고 나머지 ${removeIds.length}건을 삭제(통합)할까요?`)) return;

    await api("/api/admin/duplicates/resolve", {
      method: "POST",
      body: JSON.stringify({ keepId, removeIds }),
    });
    await loadAll();
  });

  /* ---------------- 유틸 ---------------- */

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }
  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  checkSession();
})();
