"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAnnotationStaff = void 0;
exports.validateImageAnnotations = validateImageAnnotations;
exports.canAccessFileAnnotations = canAccessFileAnnotations;
const coordinate = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
// Whitelist the stored shape and bound payload sizes. Coordinates are relative
// to the image, so notes and strokes stay aligned when the preview is resized.
function validateImageAnnotations(input) {
    if (!Array.isArray(input) || input.length > 200)
        throw new Error('Maximum 200 annotations per image');
    let totalPoints = 0;
    const ids = new Set();
    return input.map(item => {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || ids.has(item.id)) {
            throw new Error('Invalid or duplicate annotation ID');
        }
        ids.add(item.id);
        if (!['stroke', 'pin', 'note'].includes(item.kind) || typeof item.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(item.color) || !Number.isFinite(item.width) || item.width < 1 || item.width > 16) {
            throw new Error('Invalid annotation tool or colour');
        }
        const annotation = { id: item.id, kind: item.kind, color: item.color, width: item.width };
        if (item.kind === 'stroke') {
            if (!Array.isArray(item.points) || item.points.length < 1 || item.points.length > 3000)
                throw new Error('Invalid sketch points');
            totalPoints += item.points.length;
            if (totalPoints > 15000)
                throw new Error('Sketch is too large; remove some strokes');
            annotation.points = item.points.map((point) => {
                if (!point || !coordinate(point.x) || !coordinate(point.y))
                    throw new Error('Sketch coordinates must be inside the image');
                return { x: point.x, y: point.y };
            });
        }
        else {
            if (!coordinate(item.x) || !coordinate(item.y) || typeof item.text !== 'string' || item.text.length > 2000)
                throw new Error('Invalid pin or note');
            annotation.x = item.x;
            annotation.y = item.y;
            annotation.text = item.text;
        }
        return annotation;
    });
}
const staffRoles = new Set(['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel']);
const isAnnotationStaff = (role) => staffRoles.has(role);
exports.isAnnotationStaff = isAnnotationStaff;
function canAccessFileAnnotations(actor, file, orderOwnerId) {
    return (0, exports.isAnnotationStaff)(actor.role) || file.userId === actor.userId || orderOwnerId === actor.userId;
}
