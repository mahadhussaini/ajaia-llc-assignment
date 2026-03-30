# AI Workflow Note

- Used GitHub Copilot-like assistance (this ChatGPT agent) to write and iterate the codebase.
- AI helped by generating the project structure, API routes, client page, and helper methods quickly.
- I updated/verified generated code manually to ensure robust data flow, error handling, and user experience.
- Rejected or modified AI output when:
  - `create-next-app` introduced Node 20 engine warnings; kept Node 18 compatibility in README.
  - Simplified from full rich-text library to `contentEditable` plus toolbar to meet timeline.
- Verified correctness by:
  - Running `npm test` for unit coverage.
  - Manual UI test through browser flow (user switch, create/edit/save/share, file upload).
