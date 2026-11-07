# Web UI Starter

A dependency-free school administration frontend using HTML, CSS, and native JavaScript ES modules.

## Run locally

Serve the folder over HTTP; native ES modules should not be opened through `file://`. For example:

```powershell
npx.cmd http-server . -p 7777 -a 0.0.0.0
```

The page uses `<base href="/s115999999/">`. Configure your server to mount this folder at `/s115999999/`, or use a local-only base URL adjustment when serving at `/`. API routes must be available under the same prefix and origin; a static server alone does not provide the backend.

## Publish to GitHub

Create an empty repository on GitHub, then run:

```powershell
git add index.html README.md .gitignore
git commit -m "Create web UI starter"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL.

## Google sign-in API contract

The frontend expects these FastAPI routes under the app's deployment prefix (for example, `/s115999999/`):

- `GET api/root`: return the public sidebar navigation and dashboard data as `{ "items": [{ "cid": 1, "name": "Department", "icon": "school", "n": 12 }] }`. Dashboard card names map `Department`, `Semester`, `Course`, `Member`, and `Section` to 系所、學期、課程、教職員生數、開設數; `n` is displayed without a unit suffix. This data is loaded for every visitor, including signed-out visitors.
- `GET api/root/co/{cid}`: return the selected public navigation item's data as an array of JSON objects (or `{ "items": [...] }`). Course records display `academic_year` and `term` together as 學(年)期, followed by `section_name` (課程名稱), `course_code` (課號), and `student_count` (人數). When records contain `entity_data`, the frontend displays its fields except `oid`; `dept_code` and `dept_name` are labeled 系所代碼 and 系所名稱, and other fields use their API key as the heading. Clicking a column heading sorts its values; clicking it again reverses the order.
- When a course record has a `nextcid`, its `student_count` is a link to `GET api/root/co/{nextcid}`. The student list caption uses the course name, class, count, and 修課學生; its returned fields are displayed as columns with Chinese labels when available, excluding `fullname` and record IDs.
- When a student record has a `nextcid`, its `completed_count` links to `GET api/root/co/{nextcid}`. The resulting course history table shows student name/number, admission year, status, section ID/name, course code, credits, semester, and final grade, sorted newest semester first. Nested `c.course_code` and `sem.academic_year` / `sem.term` fields are supported.
- Teacher submenu items display their `name`; when `n > 0`, the count is appended. Every leaf item can be clicked to load its detail list from `api/root/co/{cid}`.
- `GET api/subclass/pcid/4`: return the first-level navigation as `{ "items": [{ "cid": 1, "name": "授課", "icon": "presentation" }] }`.
- `GET api/subclass/pcid/{cid}`: return that navigation item's children in the same `{ "items": [{ "cid": 2, "name": "課程" }] }` format.
- `GET api/auth/google/login`: begin Google OAuth and redirect the browser.
- `GET api/auth/me`: return the signed-in profile as JSON, for example `{ "name": "王老師", "email": "teacher@example.com", "picture": "https://..." }`.
- `POST api/auth/logout`: clear the server-side session and authentication cookie, and revoke any stored Google OAuth token if the app retains one; return a successful status such as `204 No Content`.
- Return `401 Unauthorized` from `api/auth/me` when the visitor is not signed in. The frontend then keeps the sign-in link visible.

The frontend uses a same-origin session (`credentials: "same-origin"`). The backend must validate the Google identity and `email_verified` server-side, then manage the session with secure cookie attributes such as `HttpOnly`, `Secure`, and an appropriate `SameSite` policy. Do not put Google client secrets in browser code.

The `api/root` navigation is shown in a separate, always-visible sidebar section. Its items also populate the dashboard cards with each item's `name` and `n` count. The teacher function menu is shown separately below it only after sign-in; it remains empty for signed-out visitors. Clicking a card's details button calls the same `api/root/co/{cid}` endpoint as its sidebar item.

## JavaScript modules

- `app.js`: initialization, independent public/account loading, and interaction wiring.
- `api.js`: base-relative URLs, same-origin requests, HTTP and JSON response helpers.
- `account.js`: profile display, account menu, and logout.
- `sidebar.js`: sidebar toggle, backdrop, and mobile closing.
- `navigation.js`: public/teacher navigation, child loading, and active selection.
- `dashboard.js`: summary cards and detail selection callbacks.
- `data-view.js`: data requests, loading/error display, and stale-response protection.
- `data-table.js`: table rendering, sorting, and drill-down callbacks.
- `records.js`: column discovery, nested values, labels, sorting, and formatting without DOM access.

UI modules receive callbacks from `app.js`; tables and cards do not import the page controller or inspect navigation internals. Module initialization binds event listeners explicitly. Existing unused `showDashboard` and `formatAcademicTerm` helpers are retained for later cleanup.

This refactor preserves the current implementation: both count-column drill-downs use `api/root/co/{nextcid}` (falling back to `cid`), and teacher navigation starts from `profile.id`. Count-column drill-downs use the confirmed root endpoint. Teacher navigation starts from the signed-in profile ID.

Manual checks: signed-out public cards/navigation; signed-in teacher menus; account menu and logout; count-column drill-downs; nested fields and empty results; ascending/descending sorting and newest-term history order; fast selection changes; failed API responses; mobile sidebar controls. Inspect the Network panel for module paths and API URLs under the deployment prefix.
