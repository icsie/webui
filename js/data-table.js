import { getRootDataColumns, sortAcademicHistory, compareDataValues, getRecordValue, hasCid, formatCellValue, formatStudentListTitle } from "./records.js";

export function renderRootData(rootDataResults, data, title, onDrillDown) {
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

    const columns = getRootDataColumns(records);
    let sortKey = columns.some((column) => column.key === "sem.academic_year")
        ? "sem.academic_year"
        : null;
    let sortedRecords = sortKey ? sortAcademicHistory(records) : records.slice();
    let sortDirection = sortKey ? -1 : 1;
    const table = document.createElement("table");
    table.className = "data-table";
    const caption = document.createElement("caption");
    caption.textContent = title;
    table.append(caption);

    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    columns.forEach((column) => {
        const heading = document.createElement("th");
        heading.scope = "col";
        if (column.key === sortKey) {
            heading.setAttribute("aria-sort", "descending");
        }
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
                const leftValues = column.getSortValues(left);
                const rightValues = column.getSortValues(right);
                for (let index = 0; index < Math.max(leftValues.length, rightValues.length); index += 1) {
                    const leftValue = leftValues[index];
                    const rightValue = rightValues[index];
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
            columns.forEach((column) => {
                const cell = document.createElement("td");
                const value = column.getValue(record);
                const isCountColumn = ["completed_count", "student_count"].includes(column.key);
                const targetCid = getRecordValue(record, "nextcid") ?? getRecordValue(record, "cid");
                if (isCountColumn && hasCid(targetCid)) {
                    const link = document.createElement("button");
                    link.className = "data-table-link";
                    link.type = "button";
                    link.textContent = formatCellValue(value);
                    link.setAttribute("aria-label", `查看${formatStudentListTitle(record)}`);
                    link.addEventListener("click", () => {
                        const title = formatStudentListTitle(record);
                        onDrillDown(
                            { ...record, name: title },
                            link,
                            `root/co/${encodeURIComponent(targetCid)}`,
                            title
                        );
                    });
                    cell.append(link);
                } else {
                    cell.textContent = formatCellValue(value);
                }
                row.append(cell);
            });
            tbody.append(row);
        });
    }
    renderRows();
    table.append(tbody);
    rootDataResults.append(table);
}
