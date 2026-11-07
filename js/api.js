const API_PATH = new URL("api/", document.baseURI);

export function apiUrl(path) {
    return new URL(path, API_PATH);
}

export function request(path, options = {}) {
    return fetch(apiUrl(path), { credentials: "same-origin", ...options });
}

export async function getJson(path) {
    return readJson(await request(path));
}

export function readJson(response) {
    if (!response.ok) {
        const error = new Error(`資料載入失敗：${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

export function getItems(data) {
    const items = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(items)) {
        throw new Error("API 回應缺少 items 陣列");
    }
    return items;
}
