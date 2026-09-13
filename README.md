# Web UI Starter

A small, dependency-free starting point for a web app. The current page is a single `index.html` file with embedded styles and a tiny interaction.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static web server:

```powershell
npx.cmd http-server . -p 7777 -a 0.0.0.0
```

Then visit <http://localhost:7777> on the same machine, or <http://10.21.26.181:7777> from another device on the same network.

Port `6666` is blocked by many browsers as an unsafe port. Port `7777` is suitable unless another local service or firewall rule already uses it.

## Publish to GitHub

Create an empty repository on GitHub, then run:

```powershell
git add index.html README.md .gitignore
git commit -m "Create web UI starter"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL.
