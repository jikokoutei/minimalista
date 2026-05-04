# Minimalista

Minimalista is a clean browser-extension workspace for saving useful links, arranging them into boards, tracking a short to-do list, and personalizing the popup with themes, wallpaper, and accent colors. The extension now runs as a plain HTML/CSS/JS app, so npm is not required to load it in the browser.

---

## 🔗 Live Preview

👉 https://minimalista.pages.dev/

---
<p align="center">
  <img src="https://github.com/user-attachments/assets/5a355dbf-a0b4-481c-baed-d60221403fe0" width="48%" />
  <img src="https://github.com/user-attachments/assets/3399b36a-d687-4905-ad95-bb8974f07220" width="48%" />
</p>


---

## ✨ Features

* Save bookmarks with a title, URL, and target board
* Search Google or open a typed URL from the new tab search box
* Organize links across pages and draggable boards
* Move links between boards with drag and drop
* Delete bookmarks or whole boards when no longer needed
* Restore recently removed links from trash
* Keep a compact to-do list beside bookmarks
* Customize theme, wallpaper presets, uploaded wallpapers, panel visibility, active page color, and link button color
* Persist user changes with `chrome.storage.local` (extension) and `localStorage` (HTML preview)

---

## 🚀 Install From Release (Recommended)

1. Download the latest release (`minimalista.zip`)
2. Extract the ZIP file
3. Open your browser and go to `chrome://extensions`
4. Enable **Developer mode**
5. Click **Load unpacked**
6. Select the extracted **Minimalista** folder
7. Done — Minimalista is ready to use 🎉

Open a new tab to start exploring your workspace.

---

## 🛠️ Development

Open `index.html` directly in a browser to preview the static version.

### Core Files

```text
manifest.json
index.html
styles.css
app.js
```

The previous Vite/React setup is still included for reference but is no longer required.

---

## 🚀 How To Use

### 🔎 Search The Web Or Open A URL

1. Enter a search query or URL in the top search bar
2. Press **Enter** or click **Search**
3. Direct URLs open instantly, while text triggers Google search

---

### ➕ Add A Link

1. Click **+ Link**
2. Enter title and URL
3. Select a board
4. Click **Save**

---

### 📁 Manage Boards

* Click **+ Board** to create a new board
* Use ✏️ to rename boards
* Use 🗑️ to delete boards (and their links)
* Drag boards to reorder (if enabled)

---

### 🔄 Move Or Remove Links

* Drag links between boards
* Delete links → moved to trash
* Restore using **Restore from trash**

---

### 📄 Manage Pages

* Click **+ New page** to create a workspace
* Switch pages via sidebar
* Delete pages using 🗑️ icon

---

### 🎨 Customize The UI

1. Open **Settings**
2. Choose theme
3. Toggle board movement
4. Adjust panel visibility (visible / semi / transparent)
5. Pick accent colors
6. Set wallpaper (preset, URL, or upload JPG/PNG)

---

## 📂 Project Structure

```text
src/
  App.tsx       Previous React version (reference only)
app.js          Core JavaScript logic
styles.css      Styling
index.html      Main UI
manifest.json   Extension config
```

---

## 📝 Notes

* Uses **Manifest V3**
* Requires `storage` permission for persistence
* Supports remote + uploaded wallpapers
* No npm / build step required
* Toolbar icon opens full tab view
* Replaces the browser new tab page while enabled

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the repo and submit pull requests.

---

## ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub!
