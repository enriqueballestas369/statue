# /api (not used yet)

This folder is empty on purpose. It's the reserved spot for a future
server-side AI backend.

Vercel automatically treats any `.js` file placed directly in this folder
as a serverless function, reachable at `/api/<filename>`. For example,
adding `api/explain.js` that exports a default handler function would make
it callable at `POST /api/explain` with no other configuration needed —
no `vercel.json` required for this either.

`js/api.js` in the front-end is already written to call functions like
`fetch('/api/explain')` once this exists — see the commented-out code in
that file. Until then, `StatuteAPI.isConnected()` returns `false` and the
app's "Analyze for me" mode shows an honest "not connected yet" state
instead of guessing.

Nothing here should require a rewrite of the front end. The front end only
ever talks to `js/api.js`.
