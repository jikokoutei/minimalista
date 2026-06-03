<div align="center">

<br/>

<img src="https://github.com/user-attachments/assets/5a355dbf-a0b4-481c-baed-d60221403fe0" width="100px" style="border-radius: 16px;" />

<br/>

# Minimalista

**A clean, distraction-free browser workspace — right in your new tab.**

Save links. Build boards. Check off tasks. Make it yours.

[![Live Preview](https://img.shields.io/badge/Live%20Preview-minimalista.pages.dev-black?style=for-the-badge&logo=googlechrome&logoColor=white)](https://minimalista.pages.dev/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-informational?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![No Build Required](https://img.shields.io/badge/No%20Build-Required-success?style=for-the-badge)](https://minimalista.pages.dev/)
[![License](https://img.shields.io/badge/License-MIT-blueviolet?style=for-the-badge)](LICENSE)

<br/>

<img src="https://github.com/user-attachments/assets/5a355dbf-a0b4-481c-baed-d60221403fe0" width="48%" />
<img src="https://github.com/user-attachments/assets/3399b36a-d687-4905-ad95-bb8974f07220" width="48%" />

<br/><br/>

</div>

---

## ✦ What is Minimalista?

Minimalista is a **browser extension** that replaces your new tab with a sleek personal workspace. It lets you organize bookmarks into boards, manage a to-do list, and personalize every visual detail — all without a build tool or npm. Just open and go.

---

## ✨ Features

| Category | Details |
|---|---|
| 🔗 **Bookmarks** | Save links with a title, URL, and target board |
| 🔍 **Smart Search** | Google search or direct URL from the search bar |
| 📋 **Boards** | Create, rename, reorder, and drag-drop boards |
| ♻️ **Trash & Restore** | Recover recently deleted links with one click |
| ✅ **To-Do List** | Keep a compact task list alongside your links |
| 🎨 **Themes** | Choose themes, wallpapers, accent colors, panel styles |
| 💾 **Persistence** | `chrome.storage.local` (extension) · `localStorage` (preview) |
| ⚡ **Zero Setup** | No npm, no build step — plain HTML/CSS/JS |

---

## 🚀 Install From Release

> **Recommended** — no setup needed.

1. **[⬇ Download the latest release `minimalista.zip`](https://github.com/jikokoutei/minimalista/releases/latest)**
2. Extract the ZIP file
3. Navigate to `chrome://extensions` in your browser
4. Enable **Developer Mode** (toggle, top-right)
5. Click **Load Unpacked**
6. Select the extracted **Minimalista** folder
7. Open a new tab — you're all set 🎉

---

## 🛠️ Development

No build tools required. Just open `index.html` in a browser for a live static preview.

```
minimalista/
├── manifest.json       Extension config (Manifest V3)
├── index.html          Main UI entry point
├── styles.css          All styling
├── app.js              Core JavaScript logic
└── assets/
    └── fonts/        
```

> The Vite/React setup is preserved for reference but is **not required**.

---

## 📖 Usage Guide

<details>
<summary><strong>🔎 Search the Web or Open a URL</strong></summary>

<br/>

1. Type a query or URL in the top search bar
2. Press **Enter** or click **Search**
3. URLs open instantly — text triggers a Google search

</details>

<details>
<summary><strong>➕ Add a Link</strong></summary>

<br/>

1. Click **+ Link**
2. Enter a title and URL
3. Select a target board
4. Click **Save**

</details>

<details>
<summary><strong>📁 Manage Boards</strong></summary>

<br/>

- Click **+ Board** to create a new board
- Use ✏️ to rename · 🗑️ to delete
- Drag boards to reorder (when enabled in settings)

</details>

<details>
<summary><strong>🔄 Move or Remove Links</strong></summary>

<br/>

- Drag links between boards freely
- Deleted links go to **Trash**
- Recover them anytime via **Restore from Trash**

</details>

<details>
<summary><strong>📄 Manage Pages</strong></summary>

<br/>

- Click **+ New Page** to create a fresh workspace
- Switch between pages via the sidebar
- Delete pages using the 🗑️ icon

</details>

<details>
<summary><strong>🎨 Customize the UI</strong></summary>

<br/>

1. Open **Settings**
2. Choose a theme (light, dark, or custom)
3. Toggle board drag-and-drop
4. Adjust panel visibility — visible / semi / transparent
5. Pick accent colors for the active page and link buttons
6. Set a wallpaper via preset, URL, or upload (JPG / PNG)

</details>

---

## 📝 Notes

- Built on **Manifest V3**
- Requires the `storage` permission for data persistence
- Supports remote wallpaper URLs and local image uploads
- Toolbar icon opens the full workspace in a new tab
- Replaces the browser's default new tab page while enabled

---

## 🤝 Contributing

Contributions are welcome and appreciated!

Fork the repository, make your changes, and open a pull request. For significant changes, opening an issue first to discuss is encouraged.

---

## ⭐ Support

If Minimalista makes your browser feel a little more like home, consider leaving a **star on GitHub** — it helps more than you'd think.

---

<div align="center">

Made with care · MIT License

</div>
