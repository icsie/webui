import { getJson } from "./api.js";
import { renderRootData } from "./data-table.js";

export function initDataView({ onDrillDown }) {
    const rootDataResults = document.querySelector("#rootDataResults");
    const dashboardCards = document.querySelector("#dashboardCards");
    const welcomeHeading = document.querySelector("#welcomeHeading");
    let rootDataRequestId = 0;

    async function loadRootData(item, endpoint, dataTitle) {
        const requestId = ++rootDataRequestId;
        const breadcrumb = document.querySelector(".breadcrumb");
        const pageIntro = document.querySelector(".page-intro");
        const requestPath = endpoint || `root/co/${encodeURIComponent(item.cid)}`;
        const title = dataTitle || `${item.name}資料`;
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
            const data = await getJson(requestPath);
            if (requestId !== rootDataRequestId) {
                return;
            }
            if (pageIntro) {
                pageIntro.textContent = "";
            }
            renderRootData(rootDataResults, data, title, onDrillDown, item.eid);
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

    function showDashboard() {
        document.querySelector(".breadcrumb").textContent = "主控台 / 個人總覽";
        document.querySelector(".page-intro").textContent = "這裡是您的教學與校務工作摘要。";
    }

    return { loadRootData };
}
