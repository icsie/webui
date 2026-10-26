const API_PATH = new URL("api/", document.baseURI);
const NAVIGATION_ICONS = ["dashboard", "presentation", "handshake", "school", "settings"];
const ROOT_CARD_LABELS = {
    Department: "系所",
    Semester: "學期",
    Course: "課程",
    Member: "教職員生數",
    Section: "開課數"
};
const ROOT_DATA_COLUMNS = [
    {
        key: "academic_year",
        label: "學(年)期",
        keys: ["academic_year", "term"],
        getValue: (record) => formatAcademicTerm(record.academic_year, record.term)
    },
    { key: "section_name", label: "課程名稱", keys: ["section_name"], getValue: (record) => record.section_name },
    { key: "course_code", label: "課號", keys: ["course_code"], getValue: (record) => record.course_code },
    { key: "student_count", label: "人數", keys: ["student_count"], getValue: (record) => record.student_count }
];
const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector("#menuToggle");
const sidebarBackdrop = document.querySelector("#sidebarBackdrop");
const rootNavigation = document.querySelector("#rootNavigation");
const teacherNavigationSection = document.querySelector("#teacherNavigationSection");
const sideNavigation = document.querySelector("#sideNavigation");
const rootDataResults = document.querySelector("#rootDataResults");
const dashboardCards = document.querySelector("#dashboardCards");
const loginButton = document.querySelector("#loginButton");
const accountMenuToggle = document.querySelector("#accountMenuToggle");
const accountMenu = document.querySelector("#accountMenu");
const logoutButton = document.querySelector("#logoutButton");
const accountProfile = document.querySelector("#accountProfile");
const accountAvatar = document.querySelector("#accountAvatar");
const accountName = document.querySelector("#accountName");
const welcomeHeading = document.querySelector("#welcomeHeading");
let rootDataRequestId = 0;

loginButton.href = new URL("auth/google/login", API_PATH).href;

const accountProfileRequest = loadAccountProfile().catch((error) => {
    console.error("無法載入登入資料", error);
    throw error;
});
loadPageData(accountProfileRequest);

async function loadAccountProfile() {
    const response = await fetch(new URL("auth/me", API_PATH), { credentials: "same-origin" });
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

async function loadPageData(profileRequest) {
    const rootNavigationRequest = fetch(new URL("root", API_PATH), { credentials: "same-origin" })
        .then(readJson)
        .then((navigation) => getItems(navigation));
    const navigationRequest = profileRequest.then((profile) => {
        if (!profile) {
            return;
        }
        teacherNavigationSection.hidden = false;
        if (!Number.isInteger(profile.id) || profile.id <= 0) {
            throw new Error("登入資料缺少有效會員識別碼");
        }
        return fetch(
            new URL(`subclass/pcid/${encodeURIComponent(profile.id)}`, API_PATH),
            { credentials: "same-origin" }
        ).then(readJson).then((navigation) => renderNavigation(sideNavigation, getItems(navigation)));
    });
    try {
        const items = await rootNavigationRequest;
        renderRootNavigation(items);
        renderDashboard(items);
    } catch (error) {
        renderNavigationError(rootNavigation, error, "導覽");
        renderDashboardError(error);
    }

    try {
        await navigationRequest;
    } catch (error) {
        renderNavigationError(sideNavigation, error, "教師功能選單");
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

function renderNavigation(container, items) {
    container.replaceChildren();
    items.forEach((item, index) => {
        container.append(createNavigationGroup(item, index, container));
    });
}

function renderRootNavigation(items) {
    rootNavigation.replaceChildren();
    items.forEach((item, index) => {
        const button = document.createElement("button");
        button.className = "navigation-button";
        button.type = "button";
        button.dataset.cid = String(item.cid);

        const icon = document.createElement("span");
        icon.className = "navigation-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = getIcon(item.icon || item.id || NAVIGATION_ICONS[index]);

        const label = document.createElement("span");
        label.textContent = item.name;
        button.append(icon, label);
        button.addEventListener("click", () => loadRootData(item, button));
        rootNavigation.append(button);
    });
}

async function loadRootData(item, button) {
    const requestId = ++rootDataRequestId;
    const breadcrumb = document.querySelector(".breadcrumb");
    const pageIntro = document.querySelector(".page-intro");
    if (button) {
        setActiveNavigation(button);
    }
    if (breadcrumb) {
        breadcrumb.textContent = `導覽 / ${item.name}`;
    }
    if (welcomeHeading) {
        welcomeHeading.textContent = item.name;
    }
    if (pageIntro) {
        pageIntro.textContent = "資料載入中…";
    }
    dashboardCards.hidden = true;
    rootDataResults.hidden = false;
    rootDataResults.className = "";
    rootDataResults.replaceChildren();

    try {
        const response = await fetch(
            new URL(`root/co/${encodeURIComponent(item.cid)}`, API_PATH),
            { credentials: "same-origin" }
        );
        const data = await readJson(response);
        if (requestId !== rootDataRequestId) {
            return;
        }
        if (pageIntro) {
            pageIntro.textContent = "";
        }
        renderRootData(data, item.name);
    } catch (error) {
        if (requestId !== rootDataRequestId) {
            return;
        }
        rootDataResults.textContent = "目前無法載入資料，請稍後再試。";
        rootDataResults.className = "load-error";
        if (pageIntro) {
            pageIntro.textContent = "";
        }
        console.error(`無法載入${item.name}資料`, error);
    }
}

function renderRootData(data, title) {
    const records = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(records)) {
        throw new Error("API 回應缺少資料陣列");
    }
    if (!records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
        throw new Error("API 回應包含非物件資料");
    }

    rootDataResults.className = "data-table-wrapper";
    rootDataResults.replaceChildren();
    if (records.length === 0) {
        rootDataResults.textContent = "目前沒有資料。";
        return;
    }

    let sortedRecords = records.slice();
    let sortKey = null;
    let sortDirection = 1;
    const table = document.createElement("table");
    table.className = "data-table";
    const caption = document.createElement("caption");
    caption.textContent = `${title}資料`;
    table.append(caption);

    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    ROOT_DATA_COLUMNS.forEach((column) => {
        const heading = document.createElement("th");
        heading.scope = "col";
        const sortButton = document.createElement("button");
        sortButton.className = "data-table-sort";
        sortButton.type = "button";
        sortButton.textContent = column.label;
        sortButton.addEventListener("click", () => {
            if (sortKey === column.key) {
                sortDirection *= -1;
            } else {
                sortKey = column.key;
                sortDirection = 1;
            }
            sortedRecords = records.slice().sort((left, right) => {
                for (const key of column.keys) {
                    const leftValue = left[key];
                    const rightValue = right[key];
                    const leftMissing = leftValue === null || leftValue === undefined;
                    const rightMissing = rightValue === null || rightValue === undefined;
                    if (leftMissing || rightMissing) {
                        if (leftMissing !== rightMissing) {
                            return leftMissing ? 1 : -1;
                        }
                        continue;
                    }
                    const comparison = compareDataValues(leftValue, rightValue);
                    if (comparison !== 0) {
                        return comparison * sortDirection;
                    }
                }
                return 0;
            });
            thead.querySelectorAll("th").forEach((cell) => cell.removeAttribute("aria-sort"));
            heading.setAttribute("aria-sort", sortDirection === 1 ? "ascending" : "descending");
            renderRows();
        });
        heading.append(sortButton);
        headingRow.append(heading);
    });
    thead.append(headingRow);
    table.append(thead);

    const tbody = document.createElement("tbody");
    function renderRows() {
        tbody.replaceChildren();
        sortedRecords.forEach((record) => {
            const row = document.createElement("tr");
            ROOT_DATA_COLUMNS.forEach((column) => {
                const cell = document.createElement("td");
                cell.textContent = formatCellValue(column.getValue(record));
                row.append(cell);
            });
            tbody.append(row);
        });
    }
    renderRows();
    table.append(tbody);
    rootDataResults.append(table);
}

function compareDataValues(left, right) {
    if (left === null || left === undefined) {
        return right === null || right === undefined ? 0 : 1;
    }
    if (right === null || right === undefined) {
        return -1;
    }
    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }
    return String(left).localeCompare(String(right), undefined, {
        numeric: true,
        sensitivity: "base"
    });
}

function formatAcademicTerm(academicYear, term) {
    if (academicYear === null || academicYear === undefined) {
        return formatCellValue(term);
    }
    if (term === null || term === undefined) {
        return `${formatCellValue(academicYear)}學年度`;
    }
    return `${formatCellValue(academicYear)}學年度第${formatCellValue(term)}學期`;
}

function formatCellValue(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function createNavigationGroup(item, index, navigation) {
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
    label.textContent = item.name;
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

        navigation.querySelectorAll(".navigation-group").forEach((otherGroup) => {
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
        summary.textContent = item.name || item.label;
        nested.append(summary);
        item.children.forEach((child) => nested.append(createNavigationItem(child)));
        return nested;
    }

    const name = item.name || item.label;
    const count = Number(item.n);
    const countLabel = Number.isFinite(count) && count > 0
        ? ` (${formatCellValue(item.n)})`
        : "";
    const button = document.createElement("button");
    button.className = "navigation-link navigation-data-button";
    button.type = "button";
    button.textContent = `${name}${countLabel}`;
    button.addEventListener("click", () => {
        loadRootData({ ...item, name }, button);
        if (window.matchMedia("(max-width: 699px)").matches) {
            closeSidebar();
        }
    });
    return button;
}

function renderDashboard(items) {
    dashboardCards.replaceChildren();
    items.forEach((item) => dashboardCards.append(createDashboardCard(item)));
}

function setActiveNavigation(element) {
    document.querySelectorAll(".navigation-button, .navigation-link").forEach((item) => item.classList.remove("is-active"));
    element.classList.add("is-active");
}

function showDashboard() {
    document.querySelector(".breadcrumb").textContent = "主控台 / 個人總覽";
    document.querySelector(".page-intro").textContent = "這裡是您的教學與校務工作摘要。";
}

function createDashboardCard(item) {
    const article = document.createElement("article");
    article.className = "dashboard-card";

    const heading = document.createElement("div");
    heading.className = "card-heading";
    heading.textContent = ROOT_CARD_LABELS[item.name] || item.name;

    const value = document.createElement("div");
    value.className = "card-value";
    value.textContent = formatCellValue(item.n);

    const detailsButton = document.createElement("button");
    detailsButton.className = "dashboard-card-link";
    detailsButton.type = "button";
    detailsButton.textContent = "查看詳情 →";
    detailsButton.addEventListener("click", () => {
        const navigationButton = Array.from(rootNavigation.querySelectorAll(".navigation-button"))
            .find((button) => button.dataset.cid === String(item.cid));
        loadRootData(item, navigationButton);
    });

    article.append(heading, value, detailsButton);
    return article;
}

function getIcon(icon) {
    const icons = { dashboard: "▦", presentation: "▤", handshake: "♢", school: "⌂", settings: "⚙" };
    return icons[icon] || "•";
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

function renderNavigationError(container, error, label) {
    container.textContent = "目前無法載入選單。";
    console.error(`無法載入${label}`, error);
}

function renderDashboardError(error) {
    dashboardCards.innerHTML = "<p class=\"load-error\">目前無法載入主控台資料，請稍後再試。</p>";
    console.error("無法載入主控台資料", error);
}
