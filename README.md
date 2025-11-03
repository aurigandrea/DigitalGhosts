# Digital Ghosts — frontend

This repository contains a very small frontend used in the Digital Ghosts exhibition to submit pages to the Internet Archive's Wayback Machine.

What I changed
- Extracted inline CSS into `css/styles.css`.
- Extracted inline JavaScript into `js/app.js`.
- Updated `index.html` to reference the external assets.

How to preview
1. Open `index.html` in your browser (double-click or use a local server).
2. Enter a URL and click "Archive" — note that direct requests to `web.archive.org/save/` may be blocked by CORS in some browsers; the original implementation used `mode: "no-cors"` which yields an opaque response but triggers the archive request.

Notes / next steps
- Consider moving the archiving request to a server-side proxy to avoid CORS limitations and provide reliable success/failure reporting.
- Add basic tests or linting if this project grows.
