import { getJson, getItems } from "./api.js";
import { formatCellValue } from "./records.js";

export function initNavigation({ onSelect, onLeafSelect }) {
    const NAVIGATION_ICONS = ["dashboard", "presentation", "handshake", "school", "settings"];
    const rootNavigation = document.querySelector("#rootNavigation");
    const teacherNavigationSection = document.querySelector("#teacherNavigationSection");
    const sideNavigation = document.querySelector("#sideNavigation");

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
            button.addEventListener("click", () => onSelect(item, button));
            rootNavigation.append(button);
        });
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
                const result = await getJson(`subclass/pcid/${encodeURIComponent(item.cid)}`);
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
            onSelect({ ...item, name }, button);
            onLeafSelect();
        });
        return button;
    }

    function setActiveNavigation(element) {
        document.querySelectorAll(".navigation-button, .navigation-link").forEach((item) => item.classList.remove("is-active"));
        element.classList.add("is-active");
    }

    function getIcon(icon) {
        const icons = { dashboard: "▦", presentation: "▤", handshake: "♢", school: "⌂", settings: "⚙" };
        return icons[icon] || "•";
    }

    function renderNavigationError(container, error, label) {
        container.textContent = "目前無法載入選單。";
        console.error(`無法載入${label}`, error);
    }

    function findRootButton(cid) {
        return Array.from(rootNavigation.querySelectorAll(".navigation-button"))
            .find((button) => button.dataset.cid === String(cid));
    }

    function showTeacherNavigation() {
        teacherNavigationSection.hidden = false;
    }

    function renderTeacherNavigation(items) {
        renderNavigation(sideNavigation, items);
    }

    function renderRootError(error) {
        renderNavigationError(rootNavigation, error, "導覽");
    }

    function renderTeacherError(error) {
        renderNavigationError(sideNavigation, error, "教師功能選單");
    }

    return { renderRootNavigation, renderTeacherNavigation, showTeacherNavigation, findRootButton, setActiveNavigation, renderRootError, renderTeacherError };
}
