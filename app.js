const STORAGE_KEY = "lumilist-clone-v1";

const themes = ["theme-1", "theme-2", "theme-3", "theme-4"];
const wallpapers = [
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10000.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10006.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10008.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10021.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10038.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10040.jpg",
];

function id() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialState() {
  const todayBoard = {
    id: id(),
    name: "Today",
    links: [
      { id: id(), title: "Vite", url: "https://vite.dev" },
      { id: id(), title: "React", url: "https://react.dev" },
    ],
  };

  return {
    pages: [
      {
        id: id(),
        name: "Work",
        boards: [
          todayBoard,
          {
            id: id(),
            name: "Research",
            links: [{ id: id(), title: "MDN", url: "https://developer.mozilla.org" }],
          },
        ],
      },
    ],
    activePageId: "",
    trash: [],
    themeIndex: 0,
    todos: [
      { id: id(), text: "Plan your boards", done: false },
      { id: id(), text: "Add key links", done: false },
    ],
    wallpaperUrl: "",
    boardReorderEnabled: true,
    wallpaperVisibility: "semi",
    panelVisibility: "semi",
    activePageColor: "#7c3aed",
    linkButtonColor: "#8b5cf6",
  };
}

let state = initialState();
state.activePageId = state.pages[0].id;

let loaded = false;
let draggedLink = null;
let draggedBoardId = null;

function extensionStorage() {
  return globalThis.chrome && chrome.storage && chrome.storage.local;
}

function loadState() {
  const storage = extensionStorage();
  if (storage) {
    return new Promise((resolve) => {
      storage.get([STORAGE_KEY], (items) => resolve(items[STORAGE_KEY] || null));
    });
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return Promise.resolve(null);

  try {
    return Promise.resolve(JSON.parse(raw));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve(null);
  }
}

function saveState() {
  if (!loaded) return;

  const storage = extensionStorage();
  if (storage) {
    storage.set({ [STORAGE_KEY]: state });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeUrl(url) {
  const value = url.trim();
  if (!value) return "#";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function searchTarget(value) {
  const term = value.trim();
  if (!term) return "";

  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(term);
  const isLocalhost = /^localhost(:\d+)?(\/.*)?$/i.test(term);
  const looksLikeDomain = /^[^\s]+\.[^\s]{2,}(\/.*)?$/i.test(term);
  const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(term);

  if (hasProtocol || isLocalhost || looksLikeDomain || looksLikeIp) {
    return normalizeUrl(term);
  }

  return `https://www.google.com/search?q=${encodeURIComponent(term)}`;
}

function activePage() {
  return state.pages.find((page) => page.id === state.activePageId) || state.pages[0];
}

function setState(updater) {
  state = updater(state);
  saveState();
  render();
}

function icon(name) {
  const icons = {
    trash: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M13 7l4 4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.3 2.1 3.1-.5.8 3 2.8 1.6-1.4 2.8 1.4 2.8-2.8 1.6-.8 3-3.1-.5L12 22l-2.3-2.1-3.1.5-.8-3-2.8-1.6 1.4-2.8-1.4-2.8 2.8-1.6.8-3 3.1.5z"/><circle cx="12" cy="12" r="3.2"/></svg>',
  };
  return icons[name] || "";
}

function render() {
  const page = activePage();
  document.documentElement.style.setProperty("--active-color", state.activePageColor);
  document.documentElement.style.setProperty("--link-color", state.linkButtonColor);

  const wallpaperStyle = state.wallpaperUrl
    ? `style="background-image:url('${normalizeUrl(state.wallpaperUrl).replaceAll("'", "%27")}')"`
    : "";
  const overlayWallpaper = state.wallpaperUrl ? `wallpaper-${state.wallpaperVisibility}` : "";
  const panelClass = state.panelVisibility === "visible" ? "visible" : "";

  document.querySelector("#app").innerHTML = `
    <div class="shell">
      <div class="wallpaper" ${wallpaperStyle}></div>
      <div class="overlay ${themes[state.themeIndex] || themes[0]} ${overlayWallpaper}"></div>
      <div class="layout">
        <aside class="sidebar panel ${panelClass}">
          <p class="brand">Minimalista</p>
          <h1>Workspace</h1>
          <div class="page-list">
            ${state.pages
              .map(
                (item) => `
                  <div class="page-row">
                    <button class="page-button ${item.id === state.activePageId ? "active" : ""}" data-action="select-page" data-page-id="${item.id}">
                      ${escapeHtml(item.name)}
                    </button>
                    <button class="icon-button" title="Delete page" data-action="delete-page" data-page-id="${item.id}">
                      ${icon("trash")}
                    </button>
                  </div>`
              )
              .join("")}
          </div>
          <button class="secondary-button full" data-action="add-page">+ New page</button>
          <button class="secondary-button full" data-action="restore-link" ${state.trash.length ? "" : "disabled"}>
            Restore from trash (${state.trash.length})
          </button>
          <div class="divider">
            <p class="section-label">To do</p>
            <form class="todo-form" data-form="todo">
              <input name="todo" placeholder="Add task" />
              <button class="secondary-button" type="submit">Add</button>
            </form>
            <div class="todo-list">
              ${state.todos
                .slice(0, 6)
                .map(
                  (todo) => `
                    <label class="todo-item ${todo.done ? "done" : ""}">
                      <input type="checkbox" data-action="toggle-todo" data-todo-id="${todo.id}" ${todo.done ? "checked" : ""} />
                      <span>${escapeHtml(todo.text)}</span>
                      <button class="todo-remove" type="button" data-action="delete-todo" data-todo-id="${todo.id}">x</button>
                    </label>`
                )
                .join("")}
            </div>
          </div>
        </aside>
        <main class="main panel ${panelClass}">
          <form class="toolbar" data-form="web-search">
            <input id="search" name="search" autocomplete="off" placeholder="Search Google or type a URL" />
            <button class="secondary-button" type="submit">Search</button>
            <button class="secondary-button" type="button" data-action="add-board">+ Board</button>
            <button class="primary-button" type="button" data-action="open-add-link" ${page.boards.length ? "" : "disabled"}>+ Link</button>
          </form>
          <section class="boards">
            ${page.boards.map((board) => renderBoard(page, board)).join("")}
          </section>
        </main>
      </div>
      <button class="settings-button" data-action="open-settings">${icon("settings")} Settings</button>
    </div>
  `;

  bindEvents();
}

function renderBoard(page, board) {
  return `
    <article class="board" draggable="${state.boardReorderEnabled}" data-board-id="${board.id}" data-page-id="${page.id}">
      <div class="board-header">
        <h2 class="board-title">${escapeHtml(board.name)}</h2>
        <div class="board-actions">
          <button class="icon-button" title="Rename board" data-action="rename-board" data-board-id="${board.id}">${icon("edit")}</button>
          <button class="icon-button" title="Add link" data-action="open-add-link" data-board-id="${board.id}">${icon("plus")}</button>
          <button class="icon-button danger" title="Delete board" data-action="delete-board" data-board-id="${board.id}">${icon("trash")}</button>
        </div>
      </div>
      <div class="link-list">
        ${
          board.links.length
            ? board.links
                .map(
                  (link) => `
                    <div class="link-card" draggable="true" data-link-id="${link.id}" data-board-id="${board.id}">
                      <a href="${escapeAttribute(normalizeUrl(link.url))}" target="_blank" rel="noreferrer">${escapeHtml(link.title)}</a>
                      <p class="link-url">${escapeHtml(link.url)}</p>
                      <button class="remove-link" data-action="remove-link" data-page-id="${page.id}" data-board-id="${board.id}" data-link-id="${link.id}">Delete bookmark</button>
                    </div>`
                )
                .join("")
            : '<p class="empty-board">Drop links here</p>'
        }
      </div>
    </article>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
  });

  document.querySelector('[data-form="todo"]').addEventListener("submit", addTodo);
  document.querySelector('[data-form="web-search"]').addEventListener("submit", submitWebSearch);

  document.querySelectorAll(".link-card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggedLink = { linkId: card.dataset.linkId, boardId: card.dataset.boardId };
    });
    card.addEventListener("dragend", () => {
      draggedLink = null;
    });
  });

  document.querySelectorAll(".board").forEach((board) => {
    board.addEventListener("dragstart", (event) => {
      if (!state.boardReorderEnabled || event.target.closest(".link-card")) return;
      draggedBoardId = board.dataset.boardId;
      board.classList.add("dragging");
    });
    board.addEventListener("dragend", () => {
      draggedBoardId = null;
      board.classList.remove("dragging");
    });
    board.addEventListener("dragover", (event) => event.preventDefault());
    board.addEventListener("drop", () => {
      const targetBoardId = board.dataset.boardId;
      if (draggedBoardId && draggedBoardId !== targetBoardId) {
        moveBoard(draggedBoardId, targetBoardId);
        draggedBoardId = null;
        return;
      }
      if (draggedLink) {
        moveLink(draggedLink.boardId, targetBoardId, draggedLink.linkId);
        draggedLink = null;
      }
    });
  });
}

function handleAction(event) {
  const target = event.currentTarget;
  const action = target.dataset.action;

  if (action === "select-page") selectPage(target.dataset.pageId);
  if (action === "delete-page") deletePage(target.dataset.pageId);
  if (action === "add-page") addPage();
  if (action === "restore-link") restoreLink();
  if (action === "add-board") addBoard();
  if (action === "rename-board") renameBoard(target.dataset.boardId);
  if (action === "delete-board") deleteBoard(target.dataset.boardId);
  if (action === "open-add-link") openAddLink(target.dataset.boardId || "");
  if (action === "remove-link") removeLink(target.dataset.pageId, target.dataset.boardId, target.dataset.linkId);
  if (action === "toggle-todo") toggleTodo(target.dataset.todoId);
  if (action === "delete-todo") deleteTodo(target.dataset.todoId);
  if (action === "open-settings") openSettings();
}

function submitWebSearch(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const target = searchTarget(String(form.get("search") || ""));
  if (target) window.location.href = target;
}

function selectPage(pageId) {
  setState((prev) => ({ ...prev, activePageId: pageId }));
}

function addPage() {
  const name = prompt("Page name", "New page");
  if (!name || !name.trim()) return;

  const page = { id: id(), name: name.trim(), boards: [{ id: id(), name: "Inbox", links: [] }] };
  setState((prev) => ({ ...prev, pages: [...prev.pages, page], activePageId: page.id }));
}

function deletePage(pageId) {
  if (state.pages.length <= 1) {
    alert("At least one page is required.");
    return;
  }
  if (!confirm("Delete this page and all its boards?")) return;

  setState((prev) => {
    const pages = prev.pages.filter((page) => page.id !== pageId);
    return { ...prev, pages, activePageId: prev.activePageId === pageId ? pages[0].id : prev.activePageId };
  });
}

function addBoard() {
  const name = prompt("Board name", "New board");
  if (!name || !name.trim()) return;
  const board = { id: id(), name: name.trim(), links: [] };

  setState((prev) => ({
    ...prev,
    pages: prev.pages.map((page) =>
      page.id === prev.activePageId ? { ...page, boards: [...page.boards, board] } : page
    ),
  }));
}

function renameBoard(boardId) {
  const page = activePage();
  const board = page.boards.find((item) => item.id === boardId);
  if (!board) return;
  const name = prompt("Rename board", board.name);
  if (!name || !name.trim()) return;

  setState((prev) => ({
    ...prev,
    pages: prev.pages.map((item) =>
      item.id === page.id
        ? { ...item, boards: item.boards.map((candidate) => (candidate.id === boardId ? { ...candidate, name: name.trim() } : candidate)) }
        : item
    ),
  }));
}

function deleteBoard(boardId) {
  const page = activePage();
  const board = page.boards.find((item) => item.id === boardId);
  if (!board) return;

  if (page.boards.length <= 1) {
    alert("At least one board is required.");
    return;
  }

  if (!confirm(`Delete "${board.name}" and all bookmarks inside it?`)) return;

  setState((prev) => ({
    ...prev,
    pages: prev.pages.map((item) =>
      item.id === page.id ? { ...item, boards: item.boards.filter((candidate) => candidate.id !== boardId) } : item
    ),
  }));
}

function openAddLink(preferredBoardId) {
  const page = activePage();
  if (!page.boards.length) return;
  const selectedBoardId = page.boards.some((board) => board.id === preferredBoardId) ? preferredBoardId : "";

  openModal(`
    <div class="modal">
      <h2>Add bookmark</h2>
      <form data-form="link">
        <input name="title" placeholder="Title" required />
        <input name="url" placeholder="https://" value="https://" required />
        <select name="boardId" required>
          <option value="">Choose board</option>
          ${page.boards
            .map(
              (board) => `<option value="${board.id}" ${board.id === selectedBoardId ? "selected" : ""}>${escapeHtml(board.name)}</option>`
            )
            .join("")}
        </select>
        <div class="modal-actions">
          <button type="button" class="secondary-button" data-modal-close>Cancel</button>
          <button type="submit" class="primary-button">Save</button>
        </div>
      </form>
    </div>
  `);

  document.querySelector('[data-form="link"]').addEventListener("submit", submitLink);
}

function submitLink(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const title = String(form.get("title") || "").trim();
  const url = String(form.get("url") || "").trim();
  const boardId = String(form.get("boardId") || "");
  if (!title || !url || !boardId) return;

  const link = { id: id(), title, url: normalizeUrl(url) };
  const pageId = state.activePageId;

  setState((prev) => ({
    ...prev,
    pages: prev.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            boards: page.boards.map((board) =>
              board.id === boardId ? { ...board, links: [link, ...board.links] } : board
            ),
          }
        : page
    ),
  }));

  closeModal();
}

function removeLink(pageId, boardId, linkId) {
  const page = state.pages.find((item) => item.id === pageId);
  const board = page && page.boards.find((item) => item.id === boardId);
  const link = board && board.links.find((item) => item.id === linkId);
  if (!link) return;
  if (!confirm(`Delete bookmark "${link.title}"?`)) return;

  setState((prev) => ({
    ...prev,
    trash: [{ id: id(), pageId, boardId, link }, ...prev.trash],
    pages: prev.pages.map((pageItem) =>
      pageItem.id === pageId
        ? {
            ...pageItem,
            boards: pageItem.boards.map((boardItem) =>
              boardItem.id === boardId
                ? { ...boardItem, links: boardItem.links.filter((candidate) => candidate.id !== linkId) }
                : boardItem
            ),
          }
        : pageItem
    ),
  }));
}

function restoreLink() {
  const entry = state.trash[0];
  if (!entry) return;

  setState((prev) => ({
    ...prev,
    trash: prev.trash.slice(1),
    pages: prev.pages.map((page) =>
      page.id === entry.pageId
        ? {
            ...page,
            boards: page.boards.map((board) =>
              board.id === entry.boardId ? { ...board, links: [entry.link, ...board.links] } : board
            ),
          }
        : page
    ),
  }));
}

function addTodo(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const text = String(form.get("todo") || "").trim();
  if (!text) return;
  event.target.reset();

  setState((prev) => ({ ...prev, todos: [{ id: id(), text, done: false }, ...prev.todos] }));
}

function toggleTodo(todoId) {
  setState((prev) => ({
    ...prev,
    todos: prev.todos.map((todo) => (todo.id === todoId ? { ...todo, done: !todo.done } : todo)),
  }));
}

function deleteTodo(todoId) {
  const todo = state.todos.find((item) => item.id === todoId);
  if (todo && !confirm(`Delete task "${todo.text}"?`)) return;

  setState((prev) => ({ ...prev, todos: prev.todos.filter((todo) => todo.id !== todoId) }));
}

function moveLink(sourceBoardId, targetBoardId, linkId) {
  if (sourceBoardId === targetBoardId) return;
  let picked = null;

  setState((prev) => {
    const pages = prev.pages.map((page) => ({
      ...page,
      boards: page.boards.map((board) => {
        if (board.id !== sourceBoardId) return board;
        picked = board.links.find((link) => link.id === linkId) || null;
        return { ...board, links: board.links.filter((link) => link.id !== linkId) };
      }),
    }));

    if (!picked) return prev;

    return {
      ...prev,
      pages: pages.map((page) => ({
        ...page,
        boards: page.boards.map((board) =>
          board.id === targetBoardId ? { ...board, links: [...board.links, picked] } : board
        ),
      })),
    };
  });
}

function moveBoard(sourceBoardId, targetBoardId) {
  if (sourceBoardId === targetBoardId) return;

  setState((prev) => ({
    ...prev,
    pages: prev.pages.map((page) => {
      if (page.id !== prev.activePageId) return page;
      const from = page.boards.findIndex((board) => board.id === sourceBoardId);
      const to = page.boards.findIndex((board) => board.id === targetBoardId);
      if (from < 0 || to < 0) return page;
      const boards = [...page.boards];
      const [moved] = boards.splice(from, 1);
      boards.splice(to, 0, moved);
      return { ...page, boards };
    }),
  }));
}

function openSettings() {
  openModal(`
    <div class="modal">
      <h2>Settings</h2>
      <div class="settings-grid">
        <section class="settings-section">
          <p class="section-label">Theme</p>
          <div class="theme-grid">
            ${themes
              .map(
                (theme, index) =>
                  `<button class="theme-button ${state.themeIndex === index ? "active" : ""} ${theme}" data-setting="theme" data-value="${index}" title="Theme ${index + 1}"></button>`
              )
              .join("")}
          </div>
        </section>
        <section class="settings-section">
          <p class="section-label">Board move</p>
          <button class="toggle-button ${state.boardReorderEnabled ? "active" : ""}" data-setting="boardReorder">
            ${state.boardReorderEnabled ? "Enabled" : "Disabled"}
          </button>
        </section>
        <section class="settings-section">
          <p class="section-label">Panel visibility</p>
          <div class="button-row">
            <button class="toggle-button ${state.panelVisibility === "visible" ? "active" : ""}" data-setting="panelVisibility" data-value="visible">Visible</button>
            <button class="toggle-button ${state.panelVisibility === "semi" ? "active" : ""}" data-setting="panelVisibility" data-value="semi">Semi visible</button>
          </div>
        </section>
        <section class="settings-section">
          <p class="section-label">Label colors</p>
          <div class="color-grid">
            <label class="field-label">Active page<input type="color" data-setting="activePageColor" value="${escapeAttribute(state.activePageColor)}" /></label>
            <label class="field-label">+ Link button<input type="color" data-setting="linkButtonColor" value="${escapeAttribute(state.linkButtonColor)}" /></label>
          </div>
        </section>
        <section class="settings-section">
          <p class="section-label">Wallpaper</p>
          <div class="button-row">
            <button class="toggle-button ${state.wallpaperVisibility === "pure" ? "active" : ""}" data-setting="wallpaperVisibility" data-value="pure">Pure visible</button>
            <button class="toggle-button ${state.wallpaperVisibility === "semi" ? "active" : ""}" data-setting="wallpaperVisibility" data-value="semi">Semi transparent</button>
          </div>
          <div class="wallpaper-grid">
            ${wallpapers
              .map(
                (url, index) =>
                  `<button class="wallpaper-button" data-setting="wallpaperPreset" data-value="${url}" style="background-image:linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url('${url}')">Preset ${index + 1}</button>`
              )
              .join("")}
          </div>
          <input data-setting-input="wallpaperUrl" value="${escapeAttribute(state.wallpaperUrl)}" placeholder="https://example.com/wallpaper.jpg" />
          <div class="modal-actions">
            <button class="primary-button" data-setting="applyWallpaper">Apply URL</button>
            <button class="secondary-button" data-setting="removeWallpaper">Remove</button>
            <button class="secondary-button" data-modal-close>Close</button>
          </div>
        </section>
      </div>
    </div>
  `);

  document.querySelectorAll("[data-setting]").forEach((element) => {
    element.addEventListener("click", handleSetting);
    element.addEventListener("input", handleSetting);
  });
}

function handleSetting(event) {
  const target = event.currentTarget;
  const setting = target.dataset.setting;

  if (setting === "theme") state.themeIndex = Number(target.dataset.value);
  if (setting === "boardReorder") state.boardReorderEnabled = !state.boardReorderEnabled;
  if (setting === "panelVisibility") state.panelVisibility = target.dataset.value;
  if (setting === "wallpaperVisibility") state.wallpaperVisibility = target.dataset.value;
  if (setting === "activePageColor") state.activePageColor = target.value;
  if (setting === "linkButtonColor") state.linkButtonColor = target.value;
  if (setting === "wallpaperPreset") state.wallpaperUrl = target.dataset.value;
  if (setting === "applyWallpaper") {
    const input = document.querySelector('[data-setting-input="wallpaperUrl"]');
    state.wallpaperUrl = input.value.trim();
  }
  if (setting === "removeWallpaper") state.wallpaperUrl = "";

  saveState();
  closeModal();
  render();
}

function openModal(html) {
  closeModal();
  const wrapper = document.createElement("div");
  wrapper.className = "modal-backdrop";
  wrapper.innerHTML = html;
  document.body.append(wrapper);
  wrapper.addEventListener("click", (event) => {
    if (event.target === wrapper || event.target.hasAttribute("data-modal-close")) closeModal();
  });
}

function closeModal() {
  const existing = document.querySelector(".modal-backdrop");
  if (existing) existing.remove();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

loadState().then((stored) => {
  if (stored && Array.isArray(stored.pages) && stored.pages.length) {
    state = { ...state, ...stored };
    if (!state.pages.some((page) => page.id === state.activePageId)) {
      state.activePageId = state.pages[0].id;
    }
  }
  loaded = true;
  saveState();
  render();
});
