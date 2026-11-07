import { getJson, getItems } from "./api.js";
import { initAccount } from "./account.js";
import { initSidebar } from "./sidebar.js";
import { initNavigation } from "./navigation.js";
import { initDashboard } from "./dashboard.js";
import { initDataView } from "./data-view.js";

const sidebar = initSidebar();
const account = initAccount();
const navigation = initNavigation({
    onSelect: selectData,
    onLeafSelect: sidebar.closeOnMobile
});
const dashboard = initDashboard({
    onSelect: (item) => selectData(item, navigation.findRootButton(item.cid))
});
const dataView = initDataView({ onDrillDown: selectData });

function selectData(item, button, endpoint, title) {
    if (button) {
        navigation.setActiveNavigation(button);
    }
    return dataView.loadRootData(item, endpoint, title);
}

// Both flows handle their own errors immediately and can complete independently.
loadPublicData();
loadTeacherData();

async function loadPublicData() {
    try {
        const items = getItems(await getJson("root"));
        navigation.renderRootNavigation(items);
        dashboard.renderDashboard(items);
    } catch (error) {
        navigation.renderRootError(error);
        dashboard.renderDashboardError(error);
    }
}

async function loadTeacherData() {
    try {
        let profile;
        try {
            profile = await account.loadAccountProfile();
        } catch (error) {
            console.error("無法載入登入資料", error);
            throw error;
        }
        if (!profile) {
            return;
        }
        navigation.showTeacherNavigation();
        if (!Number.isInteger(profile.id) || profile.id <= 0) {
            throw new Error("登入資料缺少有效會員識別碼");
        }
        const items = getItems(await getJson(
            `subclass/pcid/${encodeURIComponent(profile.id)}`
        ));
        navigation.renderTeacherNavigation(items);
    } catch (error) {
        navigation.renderTeacherError(error);
    }
}
