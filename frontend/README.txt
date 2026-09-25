
VFS NEXUS — QUICK START

1. Open the backend folder in a terminal.
2. Run npm install if dependencies are not installed.
3. Run npm run dev.
4. Confirm that http://localhost:5000/api/health works.

5. Open the frontend folder in a second terminal.
6. Confirm that frontend/.env contains:
   VITE_API_URL=http://localhost:5000/api

7. Run npm install if required.
8. Run npm run dev.
9. Open the Vite URL shown in the terminal.

DATABASE:
SQLite database location: backend/data/vfs_nexus.db

IMPORTANT:
Keep the backend running while using the frontend.
Wait for changes to save before refreshing or closing the browser.
Avoid editing the simulator in multiple tabs.

See README.md for complete project instructions.