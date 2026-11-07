export function initSidebar() {
    const sidebar = document.querySelector("#sidebar");
    const menuToggle = document.querySelector("#menuToggle");
    const sidebarBackdrop = document.querySelector("#sidebarBackdrop");

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

    function closeOnMobile() {
        if (window.matchMedia("(max-width: 699px)").matches) {
            closeSidebar();
        }
    }

    return { closeOnMobile };
}
