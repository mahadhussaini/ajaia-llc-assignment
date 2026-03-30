# Submission checklist

- Source code (complete Next.js + Tailwind app)
- README.md with setup and run instructions
- ARCHITECTURE.md
- AI_WORKFLOW.md
- this file SUBMISSION.md
- `data/users.json` and `data/docs.json` data files
- `lib/data.test.ts` automated test

## Included behaviour
- Document create/edit/save/reopen
- Rich text formatting controls
- File upload .txt/.md
- Sharing model with owner + share-to-user
- Persistence in JSON store

## Validation checklist
- `npm test` passes (2 tests)
- `npm run lint` passes with warnings only
- `npm run build` passes after node-tailwind compatibility fix
- Manual UI flow verified with local dev server

## Notes
- Seeded users: `alice`, `bob`, `carol`
- Mock login via dropdown; clear distinction documented in README.
