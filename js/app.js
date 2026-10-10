const DATA_PATH = new URL("json/", document.baseURI);
const API_PATH = new URL("api/", document.baseURI);
const NAVIGATION_ICONS = ["dashboard", "presentation", "handshake", "school", "settings"];
const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector("#menuToggle");
const sidebarBackdrop = document.querySelector("#sidebarBackdrop");
const sideNavigation = document.querySelector("#sideNavigation");
const dashboardCards = document.querySelector("#dashboardCards");
const loginButton = document.querySelector("#loginButton");
const accountMenuToggle = document.querySelector("#accountMenuToggle");
const accountMenu = document.querySelector("#accountMenu");
const logoutButton = document.querySelector("#logoutButton");
const accountProfile = document.querySelector("#accountProfile");
const accountAvatar = document.querySelector("#accountAvatar");
const accountName = document.querySelector("#accountName");
const welcomeHeading = document.querySelector("#welcomeHeading");

loadPageData();
loadAccountProfile();

async function loadAccountProfile() {
    try {
        const response = await fetch(new URL("auth/me", API_PATH), { credentials: "same-origin" });
        if (response.status === 401) {
            return;
        }
        if (!response.ok) {
            throw new Error(`登入狀態載入失敗：${response.status}`);
        }

        renderAccountProfile(await response.json());
    } catch (error) {
        console.error("無法載入登入資料", error);
    }
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
    welcomeHeading.textContent = `早安，${displayName}`;
    loginButton.hidden = true;
    accountProfile.hidden = false;
}

async function logout() {
    if (!window.confirm("確定要登出嗎？")) {
        return;
    }

    logoutButton.disabled = true;
    try {
        const response = await fetch(new URL("auth/logout", API_PATH), {
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

async function loadPageData() {
    const navigationRequest = fetch(new URL("subclass/pcid/4", API_PATH), { credentials: "same-origin" }).then(readJson);
    const dashboardRequest = fetch(new URL("dashboard_cards.json", DATA_PATH)).then(readJson);

    try {
        const navigation = await navigationRequest;
        renderNavigation(getItems(navigation));
    } catch (error) {
        renderNavigationError(error);
    }

    try {
        const dashboard = await dashboardRequest;
        renderDashboard(dashboard.cards);
    } catch (error) {
        renderDashboardError(error);
    }
}

function readJson(response) {
    if (!response.ok) {
        const error = new Error(`資料載入失敗：${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

function getItems(data) {
    const items = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(items)) {
        throw new Error("API 回應缺少 items 陣列");
    }
    return items;
}

function renderNavigation(items) {
    sideNavigation.replaceChildren();
    items.forEach((item, index) => {
        sideNavigation.append(createNavigationGroup(item, index));
    });
}

function createNavigationGroup(item, index) {
    const group = document.createElement("div");
    group.className = "navigation-group";

    const button = document.createElement("button");
    button.className = "navigation-button";
    button.type = "button";
    button.setAttribute("aria-expanded", "false");

    const icon = document.createElement("span");
    icon.className = "navigation-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = getIcon(item.icon || item.id || NAVIGATION_ICONS[index]);
    const label = document.createElement("span");
    label.textContent = item.child_name;
    const arrow = document.createElement("span");
    arrow.className = "navigation-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "⌄";
    button.append(icon, label, arrow);
    group.append(button);

    const children = document.createElement("div");
    children.className = "navigation-children";
    children.hidden = true;
    group.append(children);

    button.addEventListener("click", async () => {
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        if (isExpanded) {
            button.setAttribute("aria-expanded", "false");
            children.hidden = true;
            return;
        }

        document.querySelectorAll(".navigation-group").forEach((otherGroup) => {
            otherGroup.querySelector(".navigation-button").setAttribute("aria-expanded", "false");
            otherGroup.querySelector(".navigation-children").hidden = true;
        });
        button.setAttribute("aria-expanded", "true");
        children.hidden = false;
        children.replaceChildren();
        setActiveNavigation(button);

        try {
            const response = await fetch(new URL(`subclass/pcid/${encodeURIComponent(item.cid)}`, API_PATH));
            const result = await readJson(response);
            getItems(result).forEach((child) => children.append(createNavigationItem(child)));
        } catch (error) {
            children.textContent = "目前無法載入項目。";
            console.error("無法載入子項目", error);
        }
    });

    return group;
}

function createNavigationItem(item) {
    if (item.children) {
        const nested = document.createElement("details");
        nested.className = "nested-navigation";
        nested.open = true;
        const summary = document.createElement("summary");
        summary.textContent = item.label;
        nested.append(summary);
        item.children.forEach((child) => nested.append(createNavigationItem(child)));
        return nested;
    }

    const link = document.createElement("a");
    link.className = "navigation-link";
    link.href = item.route || "#";
    link.textContent = item.child_name || item.label;
    if (!item.route) {
        link.addEventListener("click", (event) => event.preventDefault());
    }
    link.addEventListener("click", closeSidebar);
    link.addEventListener("click", () => setActiveNavigation(link));
    return link;
}

function renderDashboard(cards) {
    dashboardCards.replaceChildren();
    cards.forEach((card) => dashboardCards.append(createDashboardCard(card)));
}

function setActiveNavigation(element) {
    document.querySelectorAll(".navigation-button, .navigation-link").forEach((item) => item.classList.remove("is-active"));
    element.classList.add("is-active");
}

function showDashboard() {
    document.querySelector(".breadcrumb").textContent = "主控台 / 個人總覽";
    document.querySelector(".page-intro").textContent = "這裡是您的教學與校務工作摘要。";
}

function createDashboardCard(card) {
    const article = document.createElement("article");
    article.className = `dashboard-card accent-${card.accent}`;
    article.innerHTML = `<div class="card-heading"><span>${card.label}</span><span class="card-icon" aria-hidden="true">${getCardIcon(card.id)}</span></div><div class="card-value">${card.value}</div><div class="card-unit">${card.unit}</div><p>${card.description}</p><a href="${card.link}">查看詳情 <span aria-hidden="true">→</span></a>`;
    return article;
}

function getIcon(icon) {
    const icons = { dashboard: "▦", presentation: "▤", handshake: "♢", school: "⌂", settings: "⚙" };
    return icons[icon] || "•";
}

function getCardIcon(id) {
    const icons = { tasks: "✓", courses: "▤", calendar: "▣", notifications: "!", announcement: "!", profile: "✓" };
    return icons[id] || "•";
}

function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarBackdrop.classList.add("is-visible");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "關閉側邊選單");
}

function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-visible");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "開啟側邊選單");
}

if (window.matchMedia("(min-width: 700px)").matches) {
    openSidebar();
} else {
    closeSidebar();
}

menuToggle.addEventListener("click", () => {
    if (sidebar.classList.contains("is-open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});
sidebarBackdrop.addEventListener("click", closeSidebar);

function renderNavigationError(error) {
    if (error.status === 401) {
        sideNavigation.textContent = "請先登入，再載入功能選單。";
        return;
    }

    sideNavigation.textContent = "目前無法載入功能選單。";
    console.error("無法載入教師功能選單", error);
}

function renderDashboardError(error) {
    dashboardCards.innerHTML = "<p class=\"load-error\">目前無法載入主控台資料，請稍後再試。</p>";
    console.error("無法載入主控台資料", error);
}
