
# VFS NEXUS — Persistent OS Simulator

VFS NEXUS is a full-stack Operating System simulator built using React, Vite, Express.js and SQLite.

It demonstrates virtual file management, indexed disk block allocation, reader-writer synchronization, disk scheduling and an integrated operating system pipeline.

## Technology Stack

- Frontend: React, Vite and Tailwind CSS
- Backend: Node.js and Express.js
- Database: SQLite
- Icons: Lucide React

## Features

- Create, edit and delete virtual files and directories
- Allocate and release virtual disk blocks
- View the 64-block virtual disk allocation map
- Simulate reader-writer synchronization
- Compare FCFS, SSTF, SCAN and C-SCAN disk scheduling
- Run the integrated operating system pipeline
- View kernel logs and simulator statistics
- Save and restore simulator state using SQLite

## Project Structure

```text
VFS-NEXUS-PERSISTENT-FULLSTACK/
├── backend/
│   ├── data/
│   │   └── vfs_nexus.db
│   ├── db/
│   │   ├── check-db.js
│   │   └── database.js
│   ├── routes/
│   │   └── state.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── .env
│   ├── index.html
│   ├── main.jsx
│   ├── package.json
│   └── vfs_nexus_os_simulator.jsx
├── .gitignore
├── START-WINDOWS.bat
├── vercel.json
└── README.md
```

The SQLite WAL and SHM files may also appear inside `backend/data/` while the database is in use.

## Run Locally

### Step 1: Start the Backend

Open a terminal in the project directory.

```bash
cd backend
npm install
npm run dev
```

The backend runs at:

http://localhost:5000

Check the backend health endpoint:

http://localhost:5000/api/health

The SQLite database is stored at:

`backend/data/vfs_nexus.db`

### Step 2: Start the Frontend

Open a second terminal in the project directory.

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at the URL displayed by Vite, normally:

http://localhost:5173

### Step 3: Configure the Frontend

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart the frontend after changing environment variables.

## Data Persistence

VFS NEXUS saves simulator state through the Express API into SQLite.

The saved state includes:

- Virtual files and directories
- File contents and metadata
- Disk block allocations
- Disk scheduling data
- Reader-writer thread state
- Kernel logs
- Integrated pipeline progress

### Persistence Test

1. Start the backend and frontend.
2. Open the Virtual File System module.
3. Create a new file.
4. Add content and save it.
5. Wait for the automatic save request to finish.
6. Refresh the browser.
7. Verify that the file and its content are still present.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and database status |
| GET | `/api/state` | Retrieve saved simulator state |
| PUT | `/api/state` | Save simulator state |
| POST | `/api/reset` | Restore the default simulator state |

## Deployment

The frontend can be deployed to Vercel.

The backend requires a Node.js hosting service with persistent storage for the SQLite database.

Do not deploy SQLite to an ephemeral filesystem without configuring persistent storage, because the database could be lost during restarts or redeployments.

Set the production frontend environment variable to:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

Configure the backend's allowed frontend origin for your deployed frontend.

## Notes

- Keep the backend running while using the frontend.
- Do not delete the SQLite database unless you intentionally want to reset stored data.
- Avoid editing the simulator in multiple browser tabs simultaneously.
- Never commit `.env` files containing secrets.