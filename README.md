# Web UI Starter

A small, dependency-free starting point for a web app. The current page is a single `index.html` file with embedded styles and a tiny interaction.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static web server:

```powershell
npx.cmd http-server . -p 7777 -a 0.0.0.0
```

Then visit <http://localhost:7777> on the same machine, or <http://<IP>:7777> from another device on the same network.

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
- `GET api/root/co/{cid}`: return the selected public navigation item's data as an array of JSON objects (or `{ "items": [...] }`). The frontend displays `academic_year` and `term` together as 學(年)期, followed by `section_name` (課程名稱), `course_code` (課號), and `student_count` (人數). Clicking a column heading sorts its values; clicking it again reverses the order.
- Teacher submenu items display their `name`; when `n > 0`, the count is appended. Every leaf item can be clicked to load its detail list from `api/root/co/{cid}`.
- `GET api/subclass/pcid/4`: return the first-level navigation as `{ "items": [{ "cid": 1, "name": "授課", "icon": "presentation" }] }`.
- `GET api/subclass/pcid/{cid}`: return that navigation item's children in the same `{ "items": [{ "cid": 2, "name": "課程" }] }` format.
- `GET api/auth/google/login`: begin Google OAuth and redirect the browser.
- `GET api/auth/me`: return the signed-in profile as JSON, for example `{ "name": "王老師", "email": "teacher@example.com", "picture": "https://..." }`.
- `POST api/auth/logout`: clear the server-side session and authentication cookie, and revoke any stored Google OAuth token if the app retains one; return a successful status such as `204 No Content`.
- Return `401 Unauthorized` from `api/auth/me` when the visitor is not signed in. The frontend then keeps the sign-in link visible.

The frontend uses a same-origin session (`credentials: "same-origin"`). The backend must validate the Google identity and `email_verified` server-side, then manage the session with secure cookie attributes such as `HttpOnly`, `Secure`, and an appropriate `SameSite` policy. Do not put Google client secrets in browser code.

The `api/root` navigation is shown in a separate, always-visible sidebar section. Its items also populate the dashboard cards with each item's `name` and `n` count. The teacher function menu is shown separately below it only after sign-in; it remains empty for signed-out visitors. Clicking a card's details button calls the same `api/root/co/{cid}` endpoint as its sidebar item.
