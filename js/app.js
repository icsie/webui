const DATA_PATH = new URL("json/", document.baseURI);
const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector("#menuToggle");
const sidebarClose = document.querySelector("#sidebarClose");
const sidebarBackdrop = document.querySelector("#sidebarBackdrop");
const sideNavigation = document.querySelector("#sideNavigation");
const dashboardCards = document.querySelector("#dashboardCards");
const accountButton = document.querySelector("#accountButton");

loadPageData();

async function loadPageData() {
    const navigationRequest = fetch(new URL("teacher_ops.json", DATA_PATH)).then(readJson);
    const dashboardRequest = fetch(new URL("dashboard_cards.json", DATA_PATH)).then(readJson);

    try {
        const navigation = await navigationRequest;
        renderNavigation(navigation.items);
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
        throw new Error(`資料載入失敗：${response.status}`);
    }
    return response.json();
}

function renderNavigation(items) {
    sideNavigation.replaceChildren();
    items.forEach((item, index) => {
        sideNavigation.append(createNavigationGroup(item, item.id === "dashboard" || index === 0));
    });
}

function createNavigationGroup(item, isActive) {
    const group = document.createElement("div");
    group.className = "navigation-group";

    const button = document.createElement("button");
    button.className = "navigation-button";
    button.type = "button";
    button.setAttribute("aria-expanded", String(isActive));
    if (isActive) {
        button.classList.add("is-active");
    }
    button.innerHTML = `<span class="navigation-icon" aria-hidden="true">${getIcon(item.icon)}</span><span>${item.label}</span><span class="navigation-arrow" aria-hidden="true">⌄</span>`;
    group.append(button);

    const children = document.createElement("div");
    children.className = "navigation-children";
    children.hidden = !isActive;
    (item.children || []).forEach((child) => children.append(createNavigationItem(child)));
    group.append(children);

    button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        children.hidden = expanded;
        if (item.id === "dashboard" && !expanded) {
            setActiveNavigation(button);
            showDashboard();
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
    link.textContent = item.label;
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
}

function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-visible");
    menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
sidebarBackdrop.addEventListener("click", closeSidebar);

accountButton.addEventListener("click", () => {
    const expanded = accountButton.getAttribute("aria-expanded") === "true";
    accountButton.setAttribute("aria-expanded", String(!expanded));
});

function renderNavigationError(error) {
    sideNavigation.textContent = "目前無法載入功能選單。";
    console.error("無法載入教師功能選單", error);
}

function renderDashboardError(error) {
    dashboardCards.innerHTML = "<p class=\"load-error\">目前無法載入主控台資料，請稍後再試。</p>";
    console.error("無法載入主控台資料", error);
}
