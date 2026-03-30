# Ajaia Docs Lite

A lightweight collaborative doc editor inspired by Google Docs.

## Features

- Create and edit documents in-browser
- Bold / italic / underline / headings / lists via rich text toolbar
- Persistent storage using local file DB (`data/docs.json` and `data/users.json`)
- File upload: `.txt` and `.md` import as doc content
- Sharing: owner can share docs with other seeded users
- Owned/shared document splits
- Mock login via user dropdown (Alice, Bob, Carol)

## Setup

Required: Node.js 18+ (tested on 18.20.8). The project also works on Node 20 with latest Next behavior.

```bash
cd c:\ajaia-llc-assignment
npm install --legacy-peer-deps
npm run dev
```

If you use a Node 20+ environment, standard `npm install` works without `--legacy-peer-deps`.

Open `http://localhost:3000`.

## API

- `GET /api/users` list users
- `GET /api/docs?userId=...` list owned + shared docs
- `POST /api/docs` create doc
- `PUT /api/docs/:docId` update doc
- `DELETE /api/docs/:docId` delete doc
- `POST /api/docs/:docId/share` share doc

## Test

```bash
npm test
```

## What works

- Document creation, editing, rename, save, reopen
- Rich text toolbar commands for style
- File import from .txt/.md
- Sharing and distinguishing owned/shared docs
- Data persistence through JSON files (local dev)

## Read-only deployment note

In environments with read-only filesystem (e.g., Vercel serverless), the app falls back to in-memory document state in `lib/data.ts` (document operations still succeed for the current VM lifetime, but do not persist across cold starts). For local development, it persists to `data/docs.json`. 

## Known limitations

- No real multi-user auth; dropdown user switch simulates accounts
- Editor uses contentEditable + `document.execCommand` for speed
- No real-time live collaboration (stretch goal)

