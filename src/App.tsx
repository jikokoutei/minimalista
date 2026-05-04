import { FormEvent, SyntheticEvent, useEffect, useMemo, useState } from "react";

type LinkItem = {
  id: string;
  title: string;
  url: string;
};

type Board = {
  id: string;
  name: string;
  links: LinkItem[];
};

type Page = {
  id: string;
  name: string;
  boards: Board[];
};

type DeletedLink = {
  id: string;
  pageId: string;
  boardId: string;
  link: LinkItem;
};

type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

const STORAGE_KEY = "lumilist-clone-v1";

type PersistedState = {
  pages: Page[];
  activePageId: string;
  trash: DeletedLink[];
  themeIndex: number;
  todos: TodoItem[];
  wallpaperUrl: string;
  boardReorderEnabled: boolean;
  wallpaperVisibility: "semi" | "pure";
  panelVisibility: "semi" | "visible";
  activePageColor: string;
  linkButtonColor: string;
};

type ChromeStorageArea = {
  get(keys: string[], callback: (items: Record<string, unknown>) => void): void;
  set(items: Record<string, unknown>, callback?: () => void): void;
};

type ChromeGlobal = {
  chrome?: {
    storage?: {
      local?: ChromeStorageArea;
    };
  };
};

function getExtensionStorage(): ChromeStorageArea | undefined {
  return (globalThis as ChromeGlobal).chrome?.storage?.local;
}

async function loadPersistedState(): Promise<PersistedState | null> {
  const extensionStorage = getExtensionStorage();

  if (extensionStorage) {
    return new Promise((resolve) => {
      extensionStorage.get([STORAGE_KEY], (items) => {
        resolve((items[STORAGE_KEY] as PersistedState | undefined) || null);
      });
    });
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as PersistedState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

async function savePersistedState(state: PersistedState): Promise<void> {
  const extensionStorage = getExtensionStorage();

  if (extensionStorage) {
    await new Promise<void>((resolve) => {
      extensionStorage.set({ [STORAGE_KEY]: state }, resolve);
    });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const THEMES = [
  "from-slate-900 via-slate-800 to-slate-900",
  "from-indigo-950 via-violet-900 to-indigo-950",
  "from-emerald-950 via-teal-900 to-slate-900",
  "from-neutral-950 via-zinc-900 to-neutral-950",
];

const WALLPAPER_PRESETS = [
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10000.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10006.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10008.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10021.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10038.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10040.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10050.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10117.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10180.jpg",
  "https://raw.githubusercontent.com/jikokoutei/Gostlist/main/Wallpaper/10217.jpg",
];

const initialPages: Page[] = [
  {
    id: crypto.randomUUID(),
    name: "Work",
    boards: [
      {
        id: crypto.randomUUID(),
        name: "Today",
        links: [
          { id: crypto.randomUUID(), title: "GITHUB", url: "https://github.com/avinashsinghkashyap3-sys" },
          { id: crypto.randomUUID(), title: "IG", url: "https://www.instagram.com/_.avinash_singh_01" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Research",
        links: [{ id: crypto.randomUUID(), title: "GH JIK", url: "https://github.com/jikokoutei" }],
      },
    ],
  },
];

function moveLink(pages: Page[], sourceBoardId: string, targetBoardId: string, linkId: string, targetLinkId?: string): Page[] {
  const cloned = structuredClone(pages) as Page[];
  let picked: LinkItem | null = null;

  cloned.forEach((page) => {
    page.boards.forEach((board) => {
      if (board.id !== sourceBoardId) return;
      const index = board.links.findIndex((link) => link.id === linkId);
      if (index >= 0) {
        picked = board.links[index];
        board.links.splice(index, 1);
      }
    });
  });

  if (!picked) return pages;

  cloned.forEach((page) => {
    page.boards.forEach((board) => {
      if (board.id !== targetBoardId) return;
      const targetIndex = targetLinkId ? board.links.findIndex((link) => link.id === targetLinkId) : -1;
      if (targetIndex >= 0) {
        board.links.splice(targetIndex, 0, picked as LinkItem);
      } else {
        board.links.push(picked as LinkItem);
      }
    });
  });

  return cloned;
}

function ensureHttpUrl(url: string): string {
  const value = url.trim();
  if (!value) return "#";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function faviconUrl(url: string): string {
  try {
    const parsed = new URL(ensureHttpUrl(url));
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(parsed.origin)}&sz=64`;
  } catch {
    return "";
  }
}

function fallbackFaviconUrl(label: string): string {
  const initial = (label.trim()[0] || "?").toUpperCase().replace(/[<&>"]/g, "") || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#334155"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="30" font-weight="700">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function handleFaviconError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  const fallback = image.dataset.fallbackSrc || "";
  if (fallback && image.src !== fallback) {
    image.src = fallback;
  }
}

function moveBoard(pages: Page[], pageId: string, sourceBoardId: string, targetBoardId: string): Page[] {
  if (sourceBoardId === targetBoardId) return pages;

  return pages.map((page) => {
    if (page.id !== pageId) return page;

    const fromIndex = page.boards.findIndex((board) => board.id === sourceBoardId);
    const toIndex = page.boards.findIndex((board) => board.id === targetBoardId);
    if (fromIndex < 0 || toIndex < 0) return page;

    const reordered = [...page.boards];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    return { ...page, boards: reordered };
  });
}

export default function App() {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [activePageId, setActivePageId] = useState<string>(initialPages[0].id);
  const [trash, setTrash] = useState<DeletedLink[]>([]);
  const [query, setQuery] = useState("");
  const [themeIndex, setThemeIndex] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftUrl, setDraftUrl] = useState("https://");
  const [draftBoardId, setDraftBoardId] = useState("");
  const [dragging, setDragging] = useState<{ linkId: string; boardId: string } | null>(null);
  const [draggingBoardId, setDraggingBoardId] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: crypto.randomUUID(), text: "Plan your boards", done: false },
    { id: crypto.randomUUID(), text: "Add key links", done: false },
  ]);
  const [todoDraft, setTodoDraft] = useState("");
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [wallpaperVisibility, setWallpaperVisibility] = useState<"semi" | "pure">("semi");
  const [panelVisibility, setPanelVisibility] = useState<"semi" | "visible">("semi");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [wallpaperDraft, setWallpaperDraft] = useState("");
  const [boardReorderEnabled, setBoardReorderEnabled] = useState(true);
  const [activePageColor, setActivePageColor] = useState("#7c3aed");
  const [linkButtonColor, setLinkButtonColor] = useState("#8b5cf6");
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);

  function openAddLinkModal(preferredBoardId?: string) {
    if (!activePage?.boards.length) return;
    const fallbackBoardId = preferredBoardId && activePage.boards.some((board) => board.id === preferredBoardId)
      ? preferredBoardId
      : "";

    setShowAdd(true);
    setDraftTitle("");
    setDraftUrl("https://");
    setDraftBoardId(fallbackBoardId);
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreStoredState() {
      const parsed = await loadPersistedState();
      if (cancelled) return;

      if (parsed && parsed.pages.length) {
        setPages(parsed.pages);
        setActivePageId(
          parsed.pages.some((page) => page.id === parsed.activePageId)
            ? parsed.activePageId
            : parsed.pages[0].id
        );
        setTrash(parsed.trash || []);
        setThemeIndex(parsed.themeIndex ?? 0);
        setTodos(parsed.todos || []);
        setWallpaperUrl(parsed.wallpaperUrl || "");
        setBoardReorderEnabled(parsed.boardReorderEnabled ?? true);
        setWallpaperVisibility(parsed.wallpaperVisibility ?? "semi");
        setPanelVisibility(parsed.panelVisibility ?? "semi");
        setActivePageColor(parsed.activePageColor || "#7c3aed");
        setLinkButtonColor(parsed.linkButtonColor || "#8b5cf6");
      }

      setHasLoadedStoredState(true);
    }

    void restoreStoredState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredState) return;

    void savePersistedState({
      pages,
      activePageId,
      trash,
      themeIndex,
      todos,
      wallpaperUrl,
      boardReorderEnabled,
      wallpaperVisibility,
      panelVisibility,
      activePageColor,
      linkButtonColor,
    });
  }, [
    hasLoadedStoredState,
    pages,
    activePageId,
    trash,
    themeIndex,
    todos,
    wallpaperUrl,
    boardReorderEnabled,
    wallpaperVisibility,
    panelVisibility,
    activePageColor,
    linkButtonColor,
  ]);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) || pages[0],
    [pages, activePageId]
  );

  useEffect(() => {
    if (!activePage) return;
    if (!activePage.boards.length) {
      const fallbackBoard: Board = { id: crypto.randomUUID(), name: "Inbox", links: [] };
      setPages((prev) =>
        prev.map((page) => (page.id === activePage.id ? { ...page, boards: [fallbackBoard] } : page))
      );
      setDraftBoardId(fallbackBoard.id);
      return;
    }

    if (showAdd && draftBoardId && !activePage.boards.some((board) => board.id === draftBoardId)) {
      setDraftBoardId("");
    }
  }, [activePage, draftBoardId, showAdd]);

  useEffect(() => {
    const handleQuickSave = (event: KeyboardEvent) => {
      const hotkey = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "y";
      if (!hotkey) return;
      event.preventDefault();
      if (!activePage?.boards.length) return;
      setShowAdd(true);
      setDraftUrl(window.location.href);
      setDraftTitle(document.title || "New link");
      setDraftBoardId(activePage.boards[0].id);
    };

    window.addEventListener("keydown", handleQuickSave);
    return () => window.removeEventListener("keydown", handleQuickSave);
  }, [activePage.boards]);

  const filteredBoards = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return activePage.boards;

    return activePage.boards.map((board) => ({
      ...board,
      links: board.links.filter((link) => {
        return link.title.toLowerCase().includes(term) || link.url.toLowerCase().includes(term);
      }),
    }));
  }, [activePage.boards, query]);

  function addPage() {
    const name = window.prompt("Page name", "New page");
    if (!name) return;

    const nextPage: Page = { id: crypto.randomUUID(), name, boards: [{ id: crypto.randomUUID(), name: "Inbox", links: [] }] };
    setPages((prev) => [...prev, nextPage]);
    setActivePageId(nextPage.id);
  }

  function deletePage(pageId: string) {
    if (pages.length <= 1) {
      window.alert("At least one page is required.");
      return;
    }

    const confirmed = window.confirm("Delete this page and all its boards?");
    if (!confirmed) return;

    const nextPages = pages.filter((page) => page.id !== pageId);
    setPages(nextPages);

    if (activePageId === pageId) {
      setActivePageId(nextPages[0].id);
    }
  }

  function addBoard() {
    const name = window.prompt("Board name", "New board");
    const nextName = name?.trim();
    if (!nextName || !activePage) return;

    const boardId = crypto.randomUUID();

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id ? { ...page, boards: [...page.boards, { id: boardId, name: nextName, links: [] }] } : page
      )
    );

    setDraftBoardId(boardId);
  }

  function renameBoard(boardId: string) {
    if (!activePage) return;
    const targetBoard = activePage.boards.find((board) => board.id === boardId);
    if (!targetBoard) return;

    const nextName = window.prompt("Rename board", targetBoard.name)?.trim();
    if (!nextName) return;

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? {
              ...page,
              boards: page.boards.map((board) =>
                board.id === boardId ? { ...board, name: nextName } : board
              ),
            }
          : page
      )
    );
  }

  function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activePage || !draftTitle.trim() || !draftUrl.trim()) return;
    if (!draftBoardId) {
      window.alert("Please choose a board first.");
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(draftUrl.trim())
      ? draftUrl.trim()
      : `https://${draftUrl.trim()}`;

    const item: LinkItem = {
      id: crypto.randomUUID(),
      title: draftTitle.trim(),
      url: normalizedUrl,
    };

    if (!activePage.boards.some((board) => board.id === draftBoardId)) {
      window.alert("Please choose a valid board.");
      return;
    }

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? {
              ...page,
              boards: page.boards.map((board) =>
                board.id === draftBoardId ? { ...board, links: [item, ...board.links] } : board
              ),
            }
          : page
      )
    );

    setShowAdd(false);
    setDraftTitle("");
    setDraftUrl("https://");
    setDraftBoardId(activePage.boards[0]?.id || "");
  }

  function removeLink(pageId: string, boardId: string, link: LinkItem) {
    setTrash((prev) => [{ id: crypto.randomUUID(), pageId, boardId, link }, ...prev]);
    setPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? { ...page, boards: page.boards.map((board) => (board.id === boardId ? { ...board, links: board.links.filter((item) => item.id !== link.id) } : board)) }
          : page
      )
    );
  }

  function restoreLast() {
    const entry = trash[0];
    if (!entry) return;

    setPages((prev) =>
      prev.map((page) =>
        page.id === entry.pageId
          ? {
              ...page,
              boards: page.boards.map((board) =>
                board.id === entry.boardId ? { ...board, links: [entry.link, ...board.links] } : board
              ),
            }
          : page
      )
    );

    setTrash((prev) => prev.slice(1));
  }

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = todoDraft.trim();
    if (!text) return;

    setTodos((prev) => [{ id: crypto.randomUUID(), text, done: false }, ...prev]);
    setTodoDraft("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function applyWallpaper(url: string) {
    setWallpaperUrl(url.trim());
    setWallpaperDraft(url.trim());
  }

  return (
    <div className="relative min-h-screen p-4 text-slate-100 md:p-6">
      {wallpaperUrl && (
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${ensureHttpUrl(wallpaperUrl)})` }}
        />
      )}
      <div
        className={`fixed inset-0 -z-10 bg-gradient-to-br ${THEMES[themeIndex]} transition-all duration-700 ${
          wallpaperUrl ? (wallpaperVisibility === "semi" ? "opacity-85" : "opacity-40") : "opacity-100"
        }`}
      />
      <div className="mx-auto flex max-w-7xl gap-4">
        <aside
          className={`w-64 shrink-0 rounded-2xl border border-white/10 p-4 backdrop-blur-md ${
            panelVisibility === "visible" ? "bg-black/45" : "bg-black/20"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.28em] text-violet-200/80">minimalista</p>
          <h1 className="mt-1 text-2xl font-semibold">Workspace</h1>
          <div className="mt-5 space-y-2">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => setActivePageId(page.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition ${
                    activePageId === page.id ? "text-white" : "hover:bg-white/10"
                  }`}
                  style={activePageId === page.id ? { backgroundColor: activePageColor } : undefined}
                >
                  {page.name}
                </button>
                <button
                  onClick={() => deletePage(page.id)}
                  title="Delete page"
                  aria-label="Delete page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 text-slate-200 hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button onClick={addPage} className="mt-3 w-full rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
            + New page
          </button>
          <button
            onClick={restoreLast}
            disabled={!trash.length}
            className="mt-2 w-full rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-35 hover:bg-white/10"
          >
            Restore from trash ({trash.length})
          </button>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">To do</p>
            <form onSubmit={addTodo} className="mt-2 flex gap-2">
              <input
                value={todoDraft}
                onChange={(event) => setTodoDraft(event.target.value)}
                placeholder="Add task"
                className="h-9 flex-1 rounded-lg border border-white/20 bg-white/5 px-2 text-xs"
              />
              <button type="submit" className="h-9 rounded-lg border border-white/20 px-2 text-xs hover:bg-white/10">
                Add
              </button>
            </form>
            <div className="mt-3 space-y-2">
              {todos.slice(0, 6).map((todo) => (
                <div key={todo.id} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <p className={`flex-1 ${todo.done ? "text-slate-400 line-through" : "text-slate-200"}`}>{todo.text}</p>
                  <button onClick={() => deleteTodo(todo.id)} className="text-slate-400 hover:text-rose-200">
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main
          className={`flex-1 rounded-2xl border border-white/10 p-4 backdrop-blur-md md:p-5 ${
            panelVisibility === "visible" ? "bg-black/50" : "bg-black/25"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bookmarks"
              className="h-10 min-w-52 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm outline-none ring-violet-400 transition focus:ring"
            />
            <button onClick={addBoard} className="h-10 rounded-lg border border-white/20 px-3 text-sm hover:bg-white/10">
              + Board
            </button>
            <button
              onClick={() => openAddLinkModal()}
              disabled={!activePage?.boards.length}
              className="h-10 rounded-lg px-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
              style={{ backgroundColor: linkButtonColor }}
            >
              + Link
            </button>
          </div>

          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBoards.map((board) => (
              <div
                key={board.id}
                draggable={boardReorderEnabled}
                onDragStart={() => {
                  if (boardReorderEnabled) setDraggingBoardId(board.id);
                }}
                onDragEnd={() => setDraggingBoardId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (boardReorderEnabled && draggingBoardId && draggingBoardId !== board.id) {
                    setPages((prev) => moveBoard(prev, activePage.id, draggingBoardId, board.id));
                    setDraggingBoardId(null);
                    return;
                  }
                  if (!dragging) return;
                  setPages((prev) => moveLink(prev, dragging.boardId, board.id, dragging.linkId));
                  setDragging(null);
                }}
                className="rounded-xl border border-white/15 bg-white/5 p-3 transition hover:bg-white/10"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-100">{board.name}</h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => renameBoard(board.id)}
                      title="Rename board"
                      aria-label="Rename board"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 text-slate-200 hover:bg-white/10"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 20h4l10-10-4-4L4 16v4z" />
                        <path d="M13 7l4 4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openAddLinkModal(board.id)}
                      title="Add link"
                      aria-label="Add link"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 text-slate-200 hover:bg-white/10"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {board.links.map((link) => (
                    <div
                      key={link.id}
                      draggable
                      onDragStart={() => setDragging({ linkId: link.id, boardId: board.id })}
                      onDragEnd={() => setDragging(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.stopPropagation();
                        if (!dragging) return;
                        setPages((prev) => moveLink(prev, dragging.boardId, board.id, dragging.linkId, link.id));
                        setDragging(null);
                      }}
                      className="group rounded-lg border border-white/15 bg-black/20 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/35"
                    >
                      <a href={ensureHttpUrl(link.url)} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-100">
                        <img
                          src={faviconUrl(link.url)}
                          data-fallback-src={fallbackFaviconUrl(link.title || link.url)}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={handleFaviconError}
                          className="h-[18px] w-[18px] shrink-0 rounded bg-white/10"
                        />
                        <span className="truncate">{link.title}</span>
                      </a>
                      <p className="ml-[26px] truncate text-xs text-slate-300">{link.url}</p>
                      <button
                        onClick={() => removeLink(activePage.id, board.id, link)}
                        className="mt-2 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {!board.links.length && <p className="rounded-lg border border-dashed border-white/20 p-3 text-xs text-slate-300">Drop links here</p>}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>

      <button
        onClick={() => {
          setWallpaperDraft(wallpaperUrl);
          setShowSettingsModal(true);
        }}
        className="fixed right-5 bottom-5 z-10 inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-slate-950/80 px-4 text-sm text-slate-100 backdrop-blur-md hover:bg-slate-900"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.3 2.1 3.1-.5.8 3 2.8 1.6-1.4 2.8 1.4 2.8-2.8 1.6-.8 3-3.1-.5L12 22l-2.3-2.1-3.1.5-.8-3-2.8-1.6 1.4-2.8-1.4-2.8 2.8-1.6.8-3 3.1.5z" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
        Settings
      </button>

      {showAdd && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/65 p-4">
          <form onSubmit={submitLink} className="w-full max-w-md space-y-3 rounded-2xl border border-white/15 bg-slate-950 p-5 shadow-xl shadow-black/40 animate-pop">
            <h3 className="text-lg font-semibold">Add bookmark</h3>
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Title"
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm"
            />
            <input
              value={draftUrl}
              onChange={(event) => setDraftUrl(event.target.value)}
              placeholder="https://"
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm"
            />
            <select
              value={draftBoardId}
              onChange={(event) => setDraftBoardId(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/40 bg-transparent px-3 text-sm text-white"
            >
              <option value="" className="bg-slate-900 text-slate-200">
                Choose board
              </option>
              {activePage.boards.map((board) => (
                <option key={board.id} value={board.id} className="bg-slate-900 text-white">
                  {board.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="h-10 flex-1 rounded-lg border border-white/20 text-sm">
                Cancel
              </button>
              <button type="submit" className="h-10 flex-1 rounded-lg bg-violet-500 text-sm font-semibold">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {showSettingsModal && (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-black/65 p-4"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-slate-950 p-5"
          >
            <h3 className="text-lg font-semibold">Settings</h3>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-200">Theme</p>
              <div className="grid gap-2 sm:grid-cols-4">
                {THEMES.map((theme, index) => (
                  <button
                    key={theme}
                    onClick={() => setThemeIndex(index)}
                    className={`h-12 rounded-lg border ${themeIndex === index ? "border-white" : "border-white/20"} bg-gradient-to-br ${theme}`}
                    title={`Theme ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-slate-200">Board move</p>
              <button
                onClick={() => setBoardReorderEnabled((prev) => !prev)}
                className={`h-10 rounded-lg border px-3 text-sm ${boardReorderEnabled ? "border-white bg-white/10" : "border-white/20"}`}
              >
                {boardReorderEnabled ? "Enabled" : "Disabled"}
              </button>
              <p className="text-xs text-slate-400">When enabled, drag one board over another to reorder.</p>
            </div>

            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-slate-200">Panel visibility</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPanelVisibility("visible")}
                  className={`h-9 rounded-lg border px-3 text-xs ${
                    panelVisibility === "visible" ? "border-white bg-white/10" : "border-white/20"
                  }`}
                >
                  Visible
                </button>
                <button
                  onClick={() => setPanelVisibility("semi")}
                  className={`h-9 rounded-lg border px-3 text-xs ${
                    panelVisibility === "semi" ? "border-white bg-white/10" : "border-white/20"
                  }`}
                >
                  Semi visible
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-slate-200">Label colors</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-slate-300">
                  Active page (Work)
                  <input
                    type="color"
                    value={activePageColor}
                    onChange={(event) => setActivePageColor(event.target.value)}
                    className="h-9 w-full rounded border border-white/20 bg-transparent"
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-300">
                  + Link button
                  <input
                    type="color"
                    value={linkButtonColor}
                    onChange={(event) => setLinkButtonColor(event.target.value)}
                    className="h-9 w-full rounded border border-white/20 bg-transparent"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-slate-200">Wallpaper</p>
              <p className="mt-1 text-sm text-slate-300">Pick a Gostlist preset or paste your own image URL.</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setWallpaperVisibility("pure")}
                  className={`h-9 rounded-lg border px-3 text-xs ${
                    wallpaperVisibility === "pure" ? "border-white bg-white/10" : "border-white/20"
                  }`}
                >
                  Pure visible
                </button>
                <button
                  onClick={() => setWallpaperVisibility("semi")}
                  className={`h-9 rounded-lg border px-3 text-xs ${
                    wallpaperVisibility === "semi" ? "border-white bg-white/10" : "border-white/20"
                  }`}
                >
                  Semi transparent
                </button>
              </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {WALLPAPER_PRESETS.map((url, index) => (
                <button
                  key={url}
                  onClick={() => applyWallpaper(url)}
                  className="h-20 rounded-lg border border-white/20 bg-cover bg-center text-left text-xs text-white/90"
                  style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${url})` }}
                >
                  <span className="px-2">Preset {index + 1}</span>
                </button>
              ))}
            </div>
            <input
              value={wallpaperDraft}
              onChange={(event) => setWallpaperDraft(event.target.value)}
              placeholder="https://example.com/wallpaper.jpg"
              className="mt-3 h-10 w-full rounded-lg border border-white/20 bg-white/5 px-3 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => applyWallpaper(wallpaperDraft)}
                className="h-10 flex-1 rounded-lg bg-violet-500 text-sm font-medium"
              >
                Apply URL
              </button>
              <button
                onClick={() => {
                  setWallpaperUrl("");
                  setWallpaperDraft("");
                }}
                className="h-10 rounded-lg border border-white/20 px-3 text-sm"
              >
                Remove
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="h-10 rounded-lg border border-white/20 px-3 text-sm"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
