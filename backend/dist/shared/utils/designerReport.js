"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignerReportError = void 0;
exports.designerReportWindow = designerReportWindow;
exports.designerTaskName = designerTaskName;
exports.designerGroups = designerGroups;
exports.createDesignerReportPdf = createDesignerReportPdf;
const pdf_lib_1 = require("pdf-lib");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const DAY_MS = 86400000;
const MALAYSIA_OFFSET = 8 * 3600000;
class DesignerReportError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}
exports.DesignerReportError = DesignerReportError;
function designerReportWindow(from, to) {
    const parse = (value) => {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new DesignerReportError('Use dates in YYYY-MM-DD format.');
        }
        const date = new Date(`${value}T00:00:00Z`);
        if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) {
            throw new DesignerReportError('Choose a valid calendar date.');
        }
        return value;
    };
    const first = parse(from);
    const last = parse(to);
    const start = new Date(`${first}T00:00:00+08:00`);
    const endExclusive = new Date(+new Date(`${last}T00:00:00+08:00`) + DAY_MS);
    const count = (+endExclusive - +start) / DAY_MS;
    if (count < 1 || count > 31)
        throw new DesignerReportError('Choose an inclusive date range of 1–31 days.');
    const dates = Array.from({ length: count }, (_, i) => new Date(+start + i * DAY_MS + MALAYSIA_OFFSET).toISOString().slice(0, 10));
    return { from: first, to: last, timezone: 'Asia/Kuala_Lumpur', start, endExclusive, dates };
}
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function designerTaskName(title, draftName, customerUsername) {
    var _a, _b;
    const fullTitle = text(title);
    let name = text(draftName).replace(/\.[^.]+$/, '').replace(/^DRAFT\s*/i, '');
    if (!name) {
        name = text(customerUsername);
        if (!name || /^\d+$/.test(name)) {
            const handle = (_a = fullTitle.match(/\b(?:KC|AZ)\s+([^|]+)/gi)) === null || _a === void 0 ? void 0 : _a.pop();
            name = handle ? handle.replace(/^(?:KC|AZ)\s+/i, '') : fullTitle;
        }
        name = name.replace(/\b\d{1,2}\s*\|?\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4}\b/gi, '')
            .replace(/\b\d{16,20}\b/g, '').replace(/Artwork Upload\s*:?\s*#?/gi, '')
            .replace(/^(?:(?:AKC|F|AZ)\s*\|\s*)+/i, '').replace(/^[\s|:#-]+|[\s|:#-]+$/g, '');
    }
    const batch = (_b = fullTitle.match(/BATCH\s*\d+(?:\s+graduasi)?/i)) === null || _b === void 0 ? void 0 : _b[0];
    if (batch && !/BATCH/i.test(name))
        name += ` - ${batch}`;
    return name.replace(/\s+/g, ' ').trim() || 'Tanpa nama';
}
function designerGroups(tasks) {
    const labels = { FRAME: 'Photocanvas / Frame', ACRYLIC: 'Acrylic', PHOTOBOOK: 'Photobook', 'BUNTING & BANNER': 'Bunting / Banner' };
    const groups = new Map();
    for (const task of tasks) {
        const label = labels[task.category] || task.category || 'Lain-lain';
        if (!groups.has(label))
            groups.set(label, []);
        groups.get(label).push(task.name);
    }
    return [...groups].map(([label, names]) => {
        const totals = new Map();
        const seen = new Map();
        for (const name of names)
            totals.set(name, (totals.get(name) || 0) + 1);
        return { label, names: names.map(name => {
                const index = (seen.get(name) || 0) + 1;
                seen.set(name, index);
                return totals.get(name) > 1 ? `${name} (${index})` : name;
            }) };
    });
}
// Standard PDF fonts support WinAnsi. Normalize unsupported characters without
// losing the rest of a customer name or failing the entire week's export.
function printable(value, font) {
    return Array.from(value.replace(/[\r\n\t]/g, ' ').normalize('NFC')).map(char => {
        try {
            font.encodeText(char);
            return char;
        }
        catch (_a) {
            return '?';
        }
    }).join('');
}
function wrap(value, width, size, font) {
    const lines = [];
    let current = '';
    // Break even an unspaced handle to keep every name inside the column.
    for (const char of printable(value, font)) {
        if (current && font.widthOfTextAtSize(current + char, size) > width) {
            const space = current.lastIndexOf(' ');
            if (space > current.length / 2) {
                lines.push(current.slice(0, space));
                current = current.slice(space + 1) + char;
            }
            else {
                lines.push(current);
                current = char;
            }
        }
        else
            current += char;
    }
    if (current)
        lines.push(current);
    return lines;
}
function createDesignerReportPdf(report) {
    return __awaiter(this, void 0, void 0, function* () {
        const template = yield pdf_lib_1.PDFDocument.load(yield (0, promises_1.readFile)(path_1.default.resolve(__dirname, '../../../assets/report-harian-designer.pdf')));
        const pdf = yield pdf_lib_1.PDFDocument.create();
        const regular = yield pdf.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const bold = yield pdf.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        const weekdays = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
        for (const day of report.days) {
            const groups = designerGroups(day.tasks);
            const candidates = [1, 2].flatMap(columns => Array.from({ length: columns === 1 ? 14 : 24 }, (_, i) => ({ columns, size: (93 - i) / 10 })));
            let layout;
            for (const candidate of candidates) {
                const width = candidate.columns === 1 ? 274 : 130;
                const sections = groups.map(group => {
                    const lines = group.names.map((name, i) => wrap(`${i + 1}. ${name}`, width, candidate.size, regular));
                    const split = Math.ceil(lines.length / candidate.columns);
                    const columns = candidate.columns === 1 ? [lines] : [lines.slice(0, split), lines.slice(split)];
                    const height = Math.max(...columns.map(column => column.reduce((sum, entry) => sum + entry.length * (candidate.size + 2) + 1, 0)));
                    return { columns, height: Math.max(wrap(group.label, 104, 9.2, regular).length * 12 + 10, height + 24) };
                });
                if (sections.reduce((sum, section) => sum + section.height, 0) <= 476) {
                    layout = Object.assign(Object.assign({}, candidate), { groups: sections });
                    break;
                }
            }
            if (!layout)
                throw new DesignerReportError(`Too many task names to fit legibly on one A4 for ${day.date}. No tasks were omitted.`, 422);
            const [page] = yield pdf.copyPages(template, [0]);
            pdf.addPage(page);
            const draw = (value, x, top, fontSize = 10, font = regular) => {
                page.drawText(printable(value, font), { x, y: page.getHeight() - top, size: fontSize, font, color: (0, pdf_lib_1.rgb)(0, 0, 0) });
            };
            draw(day.date.split('-').reverse().join('/'), 140, 128, 11);
            draw(weekdays[new Date(`${day.date}T00:00:00Z`).getUTCDay()], 140, 150, 11);
            draw(`${day.tasks.length} tugasan`, 446, 150, 9);
            // Keep the supplied form's title and signatures, giving its customer list
            // enough room for two columns on days with about 80 tasks.
            page.drawRectangle({ x: 83.8, y: page.getHeight() - 680, width: 477, height: 521, color: (0, pdf_lib_1.rgb)(1, 1, 1) });
            for (const top of [160.14, 189.44, 679.54])
                page.drawLine({ start: { x: 84.6, y: page.getHeight() - top }, end: { x: 559.8, y: page.getHeight() - top }, thickness: 0.5 });
            for (const x of [84.6, 196, 274, 559.8])
                page.drawLine({ start: { x, y: page.getHeight() - 160.14 }, end: { x, y: page.getHeight() - 679.54 }, thickness: 0.5 });
            for (const [label, left, right] of [['TUGASAN', 84.6, 196], ['STATUS', 196, 274], ['CATATAN', 274, 559.8]]) {
                draw(label, (left + right - bold.widthOfTextAtSize(label, 12)) / 2, 179, 12, bold);
            }
            let y = 197;
            for (const [index, group] of groups.entries()) {
                wrap(`${index + 1}. ${group.label}`, 100, 9.2, regular).forEach((line, i) => draw(line, 90, y + 11 + i * 12, 9.2));
                draw('SELESAI', 207, y + 11, 9.2);
                draw(group.label, 280, y + 10, 9.2, bold);
                for (const [columnIndex, entries] of layout.groups[index].columns.entries()) {
                    let cursor = y + 25;
                    for (const lines of entries) {
                        for (const line of lines) {
                            draw(line, 280 + columnIndex * 142, cursor, layout.size);
                            cursor += layout.size + 2;
                        }
                        cursor += 1;
                    }
                }
                y += layout.groups[index].height;
            }
            if (!groups.length)
                draw('Tiada tugasan.', 280, 208, 9);
            wrap(report.staff.name, 125, 10, regular).slice(0, 2).forEach((line, i) => draw(line, 108, 753 + i * 11));
        }
        pdf.setTitle(`Report Harian Designer - ${report.staff.name} - ${report.from} to ${report.to}`);
        return Buffer.from(yield pdf.save());
    });
}
