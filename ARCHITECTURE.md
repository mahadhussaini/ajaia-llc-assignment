# Architecture Note

## Stack
- Frontend: Next.js App Router + React + Tailwind CSS
- Backend: Next.js API routes (serverless functions in `app/api`)
- Persistence: file-based JSON store in `data/users.json` and `data/docs.json`

## Data Model
- User: `{ id, name }`
- Document: `{ id, title, content (HTML), ownerId, sharedWith, createdAt, updatedAt }`

## Core flows
1. User selects a seeded account (Alice/Bob/Carol). This is mocked auth state in client local storage.
2. UI loads docs via `/api/docs?userId=<current>` and splits into owned vs shared.
3. Document editing is done in a `contentEditable` area, toolbar calls `document.execCommand`.
4. Save triggers `PUT /api/docs/:id`; share triggers `POST /api/docs/:id/share`.
5. File upload reads text and creates docs via `POST /api/docs`.

## Prioritization
- Completed robust document CRUD, sharing, and persistence.
- File upload for key formats and inline import.
- Minimal but meaningful UX with clear owner/shared status.
- Kept everything local to avoid external service/dependency complexity.
