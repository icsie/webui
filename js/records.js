const ENTITY_DATA_COLUMN_LABELS = {
    dept_code: "系所代碼",
    dept_name: "系所名稱"
};
const STUDENT_DATA_COLUMN_LABELS = {
    student_id: "學號",
    student_no: "學號",
    student_number: "學號",
    student_name: "姓名",
    name: "姓名",
    academic_year: "學年度",
    term: "學期",
    section_name: "課程名稱",
    course_code: "課號",
    student_count: "人數",
    completed_count: "完成數",
    admission_year: "入學年度",
    student_status: "學籍狀態",
    section_oid: "開課識別碼",
    credits: "學分",
    final_grade: "成績",
    gender: "性別",
    sex: "性別",
    dept_code: "系所代碼",
    dept_name: "系所名稱",
    department: "系所",
    grade: "年級",
    class_name: "班級",
    email: "電子郵件",
    phone: "電話"
};

export function getRootDataColumns(records) {
    const keys = new Set();
    records.forEach((record) => collectRecordColumnKeys(record, "", keys));
    return Array.from(keys, (key) => ({
        key,
        label: ENTITY_DATA_COLUMN_LABELS[key] || STUDENT_DATA_COLUMN_LABELS[key.toLowerCase()]
            || STUDENT_DATA_COLUMN_LABELS[key.split(".").pop().toLowerCase()]
            || key,
        getValue: (record) => getRecordValue(record, key),
        getSortValues: (record) => [getRecordValue(record, key)]
    }));
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
