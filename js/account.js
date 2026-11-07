import { apiUrl, request } from "./api.js";

export function initAccount() {
    const loginButton = document.querySelector("#loginButton");
    const accountMenuToggle = document.querySelector("#accountMenuToggle");
    const accountMenu = document.querySelector("#accountMenu");
    const logoutButton = document.querySelector("#logoutButton");
    const accountProfile = document.querySelector("#accountProfile");
    const accountAvatar = document.querySelector("#accountAvatar");
    const accountName = document.querySelector("#accountName");
    const welcomeHeading = document.querySelector("#welcomeHeading");

    loginButton.href = apiUrl("auth/google/login").href;

    async function loadAccountProfile() {
        const response = await request("auth/me");
        if (response.status === 401) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`登入狀態載入失敗：${response.status}`);
        }

        const profile = await response.json();
        renderAccountProfile(profile);
        return profile;
    }

    function renderAccountProfile(profile) {
        const displayName = profile.name || profile.email;
        if (!displayName) {
            return;
        }

        accountName.textContent = displayName;
        accountAvatar.textContent = Array.from(displayName.trim())[0] || "?";
        if (profile.picture) {
            const pictureUrl = new URL(profile.picture);
            if (pictureUrl.protocol === "https:") {
                const image = document.createElement("img");
                image.src = pictureUrl.href;
                image.alt = "";
                accountAvatar.replaceChildren(image);
            }
        }
        if (welcomeHeading) {
            welcomeHeading.textContent = `早安，${displayName}`;
        }
        loginButton.hidden = true;
        accountProfile.hidden = false;
    }

    async function logout() {
        if (!window.confirm("確定要登出嗎？")) {
            return;
        }

        logoutButton.disabled = true;
        try {
            const response = await request("auth/logout", {
                method: "POST",
                credentials: "same-origin"
            });
            if (!response.ok) {
                throw new Error(`登出失敗：${response.status}`);
            }
            window.location.reload();
        } catch (error) {
            logoutButton.disabled = false;
            console.error("無法登出", error);
            window.alert("登出失敗，稍後再試");
        }
    }

    logoutButton.addEventListener("click", logout);
    accountMenuToggle.addEventListener("click", () => {
        const isExpanded = accountMenuToggle.getAttribute("aria-expanded") === "true";
        accountMenuToggle.setAttribute("aria-expanded", String(!isExpanded));
        accountMenu.hidden = isExpanded;
    });

    function closeAccountMenu() {
        accountMenu.hidden = true;
        accountMenuToggle.setAttribute("aria-expanded", "false");
    }

    document.addEventListener("click", (event) => {
        if (!accountProfile.contains(event.target)) {
            closeAccountMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAccountMenu();
        }
    });

    return { loadAccountProfile };
}
