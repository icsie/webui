// Entity indices: 2 = faculty, 4 = student, 8 = section.
const ENTITY_LABELS = [
    {}, // 0
    {}, // 1
    { // 2: faculty-section
        section_name: "課程名稱",
        course_code: "課號",
        faculties: "授課老師",
        offer_dept: "開課系所",
        student_count: "人數"
    },
    {}, // 3
    { // 4: student-section
        academic_year: "學年度",
        term: "學期",
        section_name: "課程名稱",
        course_code: "課號",
        credits: "學分",
        final_grade: "成績",
    },
    {}, // 5
    {}, // 6
    {}, // 7
    { // 8: section-students
        student_no: "學號",
        name: "姓名",
        departments: "系所",
        admission_year: "入學年度",
        completed_course_credits: "學分數",
        completed_count: "完成數",
        dropped_count: "停修數"        
    }
];

export function getRootDataColumns(records, eid) {
    const keys = new Set();
    records.forEach((record) => collectRecordColumnKeys(record, "", keys));
    const entityId = records[0]?.eid ?? records[0]?.item?.eid ?? eid;
    const labels = ENTITY_LABELS[entityId];
    const hasLabels = labels && Object.keys(labels).length > 0;
    // Configured entities use only their own fields, in the configured order.
    // Other entities retain the existing API-field table.
    const columnKeys = hasLabels ? Object.keys(labels) : Array.from(keys);
    const columns = columnKeys.map((key) => {
        const recordKey = keys.has(key) ? key : Array.from(keys).find((candidate) => (
            candidate.split(".").pop() === key
        )) || key;
        return {
            key,
            label: hasLabels ? labels[key] : key,
            getValue: (record) => getRecordValue(record, recordKey),
            getSortValues: (record) => [getRecordValue(record, recordKey)]
        };
    });
    console.log("getRootDataColumns", { eid: entityId, columns });
    return columns;
}

export function collectRecordColumnKeys(record, prefix, keys) {
    Object.entries(record).forEach(([key, value]) => {
        if (["oid", "fullname", "full_name"].includes(key.toLowerCase())) {
            return;
        }
        if (key === "entity_data") {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                collectRecordColumnKeys(value, prefix, keys);
            }
            return;
        }
        if (value && typeof value === "object" && !Array.isArray(value)) {
            collectRecordColumnKeys(value, prefix ? `${prefix}.${key}` : key, keys);
            return;
        }
        keys.add(prefix ? `${prefix}.${key}` : key);
    });
}

export function hasCid(cid) {
    return cid !== null
        && cid !== undefined
        && String(cid).length > 0;
}

export function getRecordValue(record, key) {
    if (key in record) {
        return record[key];
    }
    const nestedValue = key.split(".").reduce((value, part) => (
        value && typeof value === "object" ? value[part] : undefined
    ), record);
    if (nestedValue !== undefined) {
        return nestedValue;
    }
    if (record.entity_data && typeof record.entity_data === "object") {
        if (key in record.entity_data) {
            return record.entity_data[key];
        }
        return key.split(".").reduce((value, part) => (
            value && typeof value === "object" ? value[part] : undefined
        ), record.entity_data);
    }
    return undefined;
}

export function sortAcademicHistory(records) {
    return records.slice().sort((left, right) => {
        const yearComparison = compareAcademicTermValue(
            getRecordValue(left, "sem.academic_year"),
            getRecordValue(right, "sem.academic_year")
        );
        if (yearComparison !== 0) {
            return yearComparison;
        }
        return compareAcademicTermValue(
            getRecordValue(left, "sem.term"),
            getRecordValue(right, "sem.term")
        );
    });
}

export function compareAcademicTermValue(left, right) {
    const leftMissing = left === null || left === undefined;
    const rightMissing = right === null || right === undefined;
    if (leftMissing || rightMissing) {
        return leftMissing === rightMissing ? 0 : leftMissing ? 1 : -1;
    }
    return compareDataValues(right, left);
}

export function formatStudentListTitle(record) {
    if (getRecordValue(record, "completed_count") !== undefined) {
        const name = getRecordValue(record, "student_name") || "學生";
        const studentNo = getRecordValue(record, "student_no")
            ? `（${formatCellValue(getRecordValue(record, "student_no"))}）`
            : "";
        return `${formatCellValue(name)}${studentNo} 修課紀錄與成績`;
    }
    const sectionName = record.section_name || record.title || "課程";
    const sectionClass = record.class_name || record.section_class || record.class;
    const classLabel = sectionClass ? `－${formatCellValue(sectionClass)}` : "";
    return `${formatCellValue(sectionName)}${classLabel} ${formatCellValue(record.student_count)} 位修課學生`;
}

export function compareDataValues(left, right) {
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

export function formatAcademicTerm(academicYear, term) {
    if (academicYear === null || academicYear === undefined) {
        return formatCellValue(term);
    }
    if (term === null || term === undefined) {
        return `${formatCellValue(academicYear)}學年度`;
    }
    return `${formatCellValue(academicYear)}學年度第${formatCellValue(term)}學期`;
}

export function formatCellValue(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return typeof value === "object" ? JSON.stringify(value) : String(value);
}
