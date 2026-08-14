"use strict";
/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Shared helpers for the monthly orders database report.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthWindow = getMonthWindow;
exports.formatBytes = formatBytes;
exports.formatFileSizeCell = formatFileSizeCell;
exports.escapeCsvCell = escapeCsvCell;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const FALLBACK_TIMEZONE = 'Asia/Kuala_Lumpur';
function startOfNextMonthUtc(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex, 1));
}
/**
 * UTC offset (in milliseconds) of `timeZone` on a given UTC date.
 * Positive when the zone is ahead of UTC (e.g. +8h for Asia/Kuala_Lumpur).
 */
function tzOffsetMs(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);
    const read = (type) => { var _a, _b; return Number((_b = (_a = parts.find(p => p.type === type)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0); };
    const asUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour') === 24 ? 0 : read('hour'), read('minute'), read('second'));
    return asUtc - date.getTime();
}
/**
 * Parses a `YYYY-MM` string and converts it into an exclusive [start, end)
 * window for the given IANA timezone.
 *
 * Example: month=2026-07, timezone=Asia/Kuala_Lumpur (UTC+8) yields:
 *   start = 2026-06-30T16:00:00.000Z
 *   end   = 2026-07-31T16:00:00.000Z
 */
function getMonthWindow(month, timezone = FALLBACK_TIMEZONE) {
    if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
        throw new Error('Invalid month. Use YYYY-MM format.');
    }
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr);
    const midnightLocalStart = new Date(`${year}-${monthStr}-01T00:00:00.000Z`);
    const midnightLocalEnd = startOfNextMonthUtc(year, monthIndex);
    const start = new Date(midnightLocalStart.getTime() - tzOffsetMs(midnightLocalStart, timezone));
    const endExclusive = new Date(midnightLocalEnd.getTime() - tzOffsetMs(midnightLocalEnd, timezone));
    return { month, timezone, start, endExclusive };
}
function formatBytes(bytes) {
    const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
    const mb = safe / (1024 * 1024);
    const gb = safe / (1024 * 1024 * 1024);
    return {
        mb: `${mb.toFixed(2)} MB`,
        gb: `${gb.toFixed(2)} GB`,
    };
}
function formatFileSizeCell(bytes) {
    const { mb, gb } = formatBytes(bytes);
    return `${mb} (${gb})`;
}
function escapeCsvCell(value) {
    const raw = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(raw)) {
        return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
}
