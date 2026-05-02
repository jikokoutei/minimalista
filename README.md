# Minimalista

Minimalista is a clean browser-extension workspace for saving useful links, arranging them into boards, tracking a short to-do list, and personalizing the popup with themes, wallpaper, and accent colors. The extension now runs as a plain HTML/CSS/JS app, so npm is not required to load it in the browser.

![Minimalista extension UI](assets/minimalista-ui.png)

## Features

- Save bookmarks with a title, URL, and target board.
- Organize links across pages and draggable boards.
- Move links between boards with drag and drop.
- Restore recently removed links from trash.
- Keep a compact to-do list beside your bookmarks.
- Customize theme, wallpaper, panel visibility, active page color, and link button color.
- Persist user changes with `chrome.storage.local` in the extension and `localStorage` during local HTML preview.

## Install As A Browser Extension

1. Download or clone this project.
2. Open Chrome or another Chromium-based browser.
3. Go to `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select this project folder, not `dist`.
7. Pin **Minimalista** from the extensions menu.
8. Open a new browser tab to see Minimalista as your new tab page.
9. You can also click the Minimalista icon to open the workspace in a tab.

## Development

Open `index.html` directly in a browser to preview the static version. The extension files are:

```text
manifest.json
index.html
styles.css
app.js
```

The old Vite/React files are still in the repository for reference, but they are no longer required to run the extension.

## How To Use

### Add A Link

1. Click **+ Link**.
2. Enter the bookmark title.
3. Enter the URL.
4. Choose the board.
5. Click **Save**.

### Add Or Rename Boards

- Click **+ Board** to create a new board.
- Click the pencil button on a board to rename it.
- Drag one board over another to reorder boards when board movement is enabled.

### Move Or Remove Links

- Drag a link onto another board to move it.
- Use **Remove** on a link to send it to trash.
- Click **Restore from trash** to bring back the most recently removed link.

### Manage Pages

- Click **+ New page** to create another workspace page.
- Use the page buttons in the sidebar to switch pages.
- Use the trash button beside a page to delete it.

### Customize The UI

1. Click **Settings**.
2. Choose a theme.
3. Toggle board movement.
4. Set panel visibility.
5. Pick active page and link button colors.
6. Choose a wallpaper preset or paste an image URL.

## Project Structure

```text
src/
  App.tsx       Previous React version kept for reference
app.js          Plain JavaScript extension logic
styles.css      Plain CSS extension styling
index.html      Extension popup page
manifest.json   Extension manifest
```

## Notes

- The extension uses Manifest V3.
- `storage` permission is required so user changes survive popup reloads.
- Remote wallpaper URLs are stored as user settings; custom images must be reachable by the browser.
- No npm install or build step is required for the plain HTML extension.
- The toolbar icon opens Minimalista as a full tab instead of a small popup.
- Minimalista replaces the browser new tab page while the extension is enabled.
