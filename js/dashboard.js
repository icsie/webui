import { formatCellValue } from "./records.js";

export function initDashboard({ onSelect }) {
    const ROOT_CARD_LABELS = {
        Department: "系所",
        Semester: "學期",
        Course: "課程",
        Member: "教職員生數",
        Section: "開課數"
    };
    const dashboardCards = document.querySelector("#dashboardCards");

    function renderDashboard(items) {
        dashboardCards.replaceChildren();
        items.forEach((item) => dashboardCards.append(createDashboardCard(item)));
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
            onSelect(item);
        });

        article.append(heading, value, detailsButton);
        return article;
    }

    function renderDashboardError(error) {
        dashboardCards.innerHTML = "<p class=\"load-error\">目前無法載入主控台資料，請稍後再試。</p>";
        console.error("無法載入主控台資料", error);
    }

    return { renderDashboard, renderDashboardError };
}
