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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Mail bridge — lets the webmail UI (email.kampungcetak.com) talk to the
 * self-hosted docker-mailserver via IMAP/SMTP. Browsers cannot use IMAP, so
 * the backend proxies it.
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const imapflow_1 = require("imapflow");
const nodemailer_1 = __importDefault(require("nodemailer"));
const mailparser_1 = require("mailparser");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
const MAIL_IMAP_HOST = process.env.MAIL_IMAP_HOST || '127.0.0.1';
const MAIL_IMAP_PORT = parseInt(process.env.MAIL_IMAP_PORT || '993', 10);
const MAIL_IMAP_SECURE = (process.env.MAIL_IMAP_SECURE || 'true') === 'true';
const MAIL_SMTP_HOST = process.env.MAIL_SMTP_HOST || '127.0.0.1';
const MAIL_SMTP_PORT = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
const MAIL_SMTP_SECURE = (process.env.MAIL_SMTP_SECURE || 'false') === 'true';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const INLINE_EMBED_LIMIT = 2 * 1024 * 1024;
const sessions = new Map();
const cleanSessions = () => {
    const now = Date.now();
    for (const [token, s] of sessions) {
        if (s.expiresAt <= now)
            sessions.delete(token);
    }
};
setInterval(cleanSessions, 30 * 60 * 1000).unref();
function getSession(req) {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : '';
    const session = token ? sessions.get(token) : undefined;
    if (session && session.expiresAt > Date.now()) {
        session.expiresAt = Date.now() + SESSION_TTL_MS;
        return session;
    }
    if (session)
        sessions.delete(token);
    return null;
}
const requireMailSession = (req, res, next) => {
    const session = getSession(req);
    if (!session) {
        res.status(401).json({ success: false, message: 'Mail session expired or invalid' });
        return;
    }
    req.mailSession = session;
    next();
};
function imapClient(session) {
    return new imapflow_1.ImapFlow({
        host: MAIL_IMAP_HOST,
        port: MAIL_IMAP_PORT,
        secure: MAIL_IMAP_SECURE,
        auth: { user: session.email, pass: session.password },
        logger: false,
        tls: { rejectUnauthorized: false },
    });
}
const flattenParts = (node, prefix) => {
    const out = [];
    if (!node)
        return out;
    const part = node.part || prefix;
    const isLeaf = !!node.type && !['multipart/mixed', 'multipart/alternative', 'multipart/related', 'multipart/signed', 'multipart/encrypted'].includes(node.type || '');
    if (isLeaf) {
        out.push(Object.assign(Object.assign({}, node), { part }));
    }
    (node.childNodes || []).forEach((child, i) => {
        out.push(...flattenParts(child, part ? `${part}.${i + 1}` : `${i + 1}`));
    });
    return out;
};
const addressList = (list) => (list || [])
    .filter((a) => a && a.address)
    .map((a) => ({ name: a.name || '', address: a.address }));
const flagList = (flags) => Array.from(flags instanceof Set ? flags : flags || []);
const hasFlag = (flags, name) => flagList(flags).includes(name);
router.post('/login', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body || {};
    if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
    }
    const client = imapClient({ email, password });
    try {
        yield client.connect();
    }
    catch (err) {
        res.status(401).json({ success: false, message: 'Login failed — check your email and password' });
        return;
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
    const token = (0, crypto_1.randomUUID)();
    sessions.set(token, { email, password, expiresAt: Date.now() + SESSION_TTL_MS });
    res.json({
        success: true,
        data: { token, email, displayName: email.split('@')[0] },
    });
})));
router.post('/logout', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : '';
    if (token)
        sessions.delete(token);
    res.json({ success: true });
})));
router.get('/me', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    res.json({ success: true, data: { email: session.email } });
})));
router.get('/folders', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    const client = imapClient(session);
    try {
        yield client.connect();
        const list = yield client.list();
        const folders = [];
        for (const folder of list) {
            let total = 0;
            try {
                yield client.mailboxOpen(folder.path);
                total = client.mailbox ? client.mailbox.exists : 0;
            }
            catch (_a) {
                total = 0;
            }
            folders.push({
                path: folder.path,
                name: folder.path.split('/').pop() || folder.path,
                flags: folder.flags || [],
                specialUse: folder.specialUse || null,
                total,
            });
        }
        res.json({ success: true, data: folders });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.get('/messages', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d, _e, _f, _g, _h, _j, _k, _l;
    const session = req.mailSession;
    const folder = String(req.query.folder || 'INBOX');
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '25'), 10) || 25));
    const q = String(req.query.q || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();
    const subject = String(req.query.subject || '').trim();
    const sinceRaw = req.query.since;
    const beforeRaw = req.query.before;
    const hasAttachment = req.query.hasAttachment === 'true';
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxOpen(folder);
        const total = client.mailbox ? client.mailbox.exists : 0;
        const searching = !!(q || from || to || subject || sinceRaw || beforeRaw);
        let searchUids = null;
        if (searching) {
            const criteria = {};
            if (q) {
                criteria.or = [{ from: q }, { to: q }, { subject: q }, { body: q }];
            }
            else {
                if (from)
                    criteria.from = from;
                if (to)
                    criteria.to = to;
                if (subject)
                    criteria.subject = subject;
            }
            if (sinceRaw)
                criteria.since = new Date(String(sinceRaw));
            if (beforeRaw)
                criteria.before = new Date(String(beforeRaw));
            const found = yield client.search(criteria, { uid: true });
            searchUids = (Array.isArray(found) ? found : []).reverse();
        }
        const items = [];
        const attachmentCountOf = (bodyStructure) => {
            const parts = flattenParts(bodyStructure, '');
            let n = 0;
            for (const part of parts) {
                const isAttachment = !part.id || (part.disposition && part.disposition.startsWith('attachment'));
                if (isAttachment)
                    n++;
            }
            return n;
        };
        if (searching && searchUids) {
            const slice = searchUids.slice((page - 1) * pageSize, page * pageSize);
            for (const uid of slice) {
                const m = yield client.fetchOne(uid, { envelope: true, flags: true, bodyStructure: true }, { uid: true });
                if (!m)
                    continue;
                const attachments = attachmentCountOf(m.bodyStructure);
                if (hasAttachment && attachments === 0)
                    continue;
                items.push({
                    uid: m.uid,
                    seq: m.seq,
                    flags: flagList(m.flags),
                    seen: !hasFlag(m.flags, '\\Seen'),
                    date: ((_d = m.envelope) === null || _d === void 0 ? void 0 : _d.date) ? new Date(m.envelope.date).toISOString() : null,
                    subject: ((_e = m.envelope) === null || _e === void 0 ? void 0 : _e.subject) || '(no subject)',
                    from: addressList((_f = m.envelope) === null || _f === void 0 ? void 0 : _f.from),
                    to: addressList((_g = m.envelope) === null || _g === void 0 ? void 0 : _g.to),
                    attachments,
                });
            }
        }
        else if (total > 0) {
            const start = Math.max(1, total - ((page - 1) * pageSize + pageSize) + 1);
            const end = start + pageSize - 1;
            if (start <= total) {
                try {
                    for (var _m = true, _o = __asyncValues(client.fetch(`${start}:${end}`, { envelope: true, flags: true, bodyStructure: true })), _p; _p = yield _o.next(), _a = _p.done, !_a; _m = true) {
                        _c = _p.value;
                        _m = false;
                        const m = _c;
                        const attachments = attachmentCountOf(m.bodyStructure);
                        if (hasAttachment && attachments === 0)
                            continue;
                        items.push({
                            uid: m.uid,
                            seq: m.seq,
                            flags: flagList(m.flags),
                            seen: !hasFlag(m.flags, '\\Seen'),
                            date: ((_h = m.envelope) === null || _h === void 0 ? void 0 : _h.date) ? new Date(m.envelope.date).toISOString() : null,
                            subject: ((_j = m.envelope) === null || _j === void 0 ? void 0 : _j.subject) || '(no subject)',
                            from: addressList((_k = m.envelope) === null || _k === void 0 ? void 0 : _k.from),
                            to: addressList((_l = m.envelope) === null || _l === void 0 ? void 0 : _l.to),
                            attachments,
                        });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_m && !_a && (_b = _o.return)) yield _b.call(_o);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                items.reverse();
            }
        }
        res.json({ success: true, data: { items, total: searching ? (searchUids ? searchUids.length : 0) : total, page, pageSize, folder } });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.post('/folders', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = req.mailSession;
    const name = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.name) || '').trim().replace(/[\\/]/g, '-');
    if (!name) {
        res.status(400).json({ success: false, message: 'Folder name is required' });
        return;
    }
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxCreate(name);
        res.json({ success: true, data: { path: name } });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.put('/folders', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const session = req.mailSession;
    const path = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.path) || '');
    const newName = String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.newName) || '').trim().replace(/[\\/]/g, '-');
    if (!path || !newName) {
        res.status(400).json({ success: false, message: 'Path and new name are required' });
        return;
    }
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxRename(path, newName);
        res.json({ success: true, data: { path: newName } });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.delete('/folders', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    const path = String(req.query.path || '');
    if (!path) {
        res.status(400).json({ success: false, message: 'Folder path is required' });
        return;
    }
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxDelete(path);
        res.json({ success: true });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.put('/drafts', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    const { uid, folder, to, cc, bcc, subject, text, html, attachments } = req.body || {};
    const client = imapClient(session);
    try {
        yield client.connect();
        if (uid && folder) {
            try {
                yield client.mailboxOpen(folder);
                yield client.messageDelete(uid, { uid: true });
            }
            catch (_a) {
                /* old draft gone */
            }
        }
        const builder = nodemailer_1.default.createTransport({ streamTransport: true, newline: 'unix' });
        const mail = {
            from: session.email,
            to: Array.isArray(to) ? to : [],
            cc: Array.isArray(cc) && cc.length ? cc : undefined,
            bcc: Array.isArray(bcc) && bcc.length ? bcc : undefined,
            subject: subject || '',
            text: text || '',
            html: html || undefined,
        };
        if (Array.isArray(attachments) && attachments.length) {
            mail.attachments = attachments
                .map((a) => ({
                filename: a.filename || 'attachment',
                content: Buffer.from(a.base64 || '', 'base64'),
                contentType: a.contentType,
            }))
                .filter((a) => a.content.length > 0);
        }
        const info = yield builder.sendMail(mail);
        let draftsPath = 'Drafts';
        try {
            yield client.mailboxOpen(draftsPath);
        }
        catch (_b) {
            yield client.mailboxCreate(draftsPath);
        }
        const result = yield client.append(draftsPath, info.message, ['\\Draft'], new Date());
        const draftUid = result && typeof result === 'object' && 'uid' in result ? result.uid : undefined;
        res.json({ success: true, data: { uid: draftUid, folder: draftsPath } });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.get('/messages/:uid', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_2, _b, _c;
    var _d, _e, _f, _g, _h;
    const session = req.mailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxOpen(folder);
        const message = yield client.fetchOne(uid, {
            source: true,
            envelope: true,
            flags: true,
            bodyStructure: true,
            internalDate: true,
        }, { uid: true });
        if (!message || !message.source) {
            res.status(404).json({ success: false, message: 'Message not found' });
            return;
        }
        const parsed = yield (0, mailparser_1.simpleParser)(message.source);
        const parts = flattenParts(message.bodyStructure, '');
        const attachments = [];
        for (const part of parts) {
            const contentType = part.type || 'application/octet-stream';
            const isAttachment = !part.id || (part.disposition && part.disposition.startsWith('attachment'));
            if (!isAttachment)
                continue;
            const entry = {
                part: part.part,
                filename: part.filename || `attachment-${part.part || '0'}`,
                contentType,
                size: part.size || 0,
                contentId: part.id || null,
            };
            if (part.id && part.size && part.size <= INLINE_EMBED_LIMIT) {
                try {
                    const dl = yield client.download(uid, part.part, { uid: true });
                    const chunks = [];
                    try {
                        for (var _j = true, _k = (e_2 = void 0, __asyncValues(dl.content)), _l; _l = yield _k.next(), _a = _l.done, !_a; _j = true) {
                            _c = _l.value;
                            _j = false;
                            const chunk = _c;
                            chunks.push(chunk);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (!_j && !_a && (_b = _k.return)) yield _b.call(_k);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    const buf = Buffer.concat(chunks);
                    entry.dataUri = `data:${contentType};base64,${buf.toString('base64')}`;
                }
                catch (_m) {
                    entry.dataUri = null;
                }
            }
            attachments.push(entry);
        }
        let html = parsed.html || '';
        for (const att of attachments) {
            if (att.contentId && att.dataUri) {
                html = html.split(`cid:${att.contentId}`).join(att.dataUri);
            }
        }
        res.json({
            success: true,
            data: {
                uid,
                folder,
                date: ((_d = message.envelope) === null || _d === void 0 ? void 0 : _d.date) ? new Date(message.envelope.date).toISOString() : new Date(message.internalDate || Date.now()).toISOString(),
                subject: ((_e = message.envelope) === null || _e === void 0 ? void 0 : _e.subject) || '(no subject)',
                from: addressList((_f = message.envelope) === null || _f === void 0 ? void 0 : _f.from),
                to: addressList((_g = message.envelope) === null || _g === void 0 ? void 0 : _g.to),
                cc: addressList((_h = message.envelope) === null || _h === void 0 ? void 0 : _h.cc),
                flags: flagList(message.flags),
                seen: !hasFlag(message.flags, '\\Seen'),
                text: parsed.text || '',
                html,
                attachments,
            },
        });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.patch('/messages/:uid', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);
    const { seen, flagged, moveTo } = req.body || {};
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxOpen(folder);
        if (typeof seen === 'boolean') {
            if (seen)
                yield client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
            else
                yield client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
        }
        if (typeof flagged === 'boolean') {
            if (flagged)
                yield client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
            else
                yield client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true });
        }
        if (typeof moveTo === 'string' && moveTo) {
            try {
                yield client.mailboxOpen(moveTo);
            }
            catch (_a) {
                yield client.mailboxCreate(moveTo);
            }
            yield client.messageMove(uid, moveTo, { uid: true });
        }
        res.json({ success: true });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.delete('/messages/:uid', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxOpen(folder);
        try {
            yield client.mailboxOpen('Trash');
        }
        catch (_a) {
            yield client.mailboxCreate('Trash');
        }
        yield client.messageMove(uid, 'Trash', { uid: true });
        res.json({ success: true });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.get('/attachments/:uid/:part', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);
    const part = req.params.part;
    const client = imapClient(session);
    try {
        yield client.connect();
        yield client.mailboxOpen(folder);
        const dl = yield client.download(uid, part, { uid: true });
        res.setHeader('Content-Disposition', `attachment; filename="${part}"`);
        dl.content.pipe(res);
    }
    catch (err) {
        res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    finally {
        yield client.logout().catch(() => undefined);
    }
})));
router.post('/send', requireMailSession, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = req.mailSession;
    const { to, cc, bcc, subject, text, html, attachments, draftUid, draftFolder } = req.body || {};
    if (!to || !to.length) {
        res.status(400).json({ success: false, message: 'Recipient is required' });
        return;
    }
    const transporter = nodemailer_1.default.createTransport({
        host: MAIL_SMTP_HOST,
        port: MAIL_SMTP_PORT,
        secure: MAIL_SMTP_SECURE,
        auth: { user: session.email, pass: session.password },
        tls: { rejectUnauthorized: false },
    });
    const mail = {
        from: session.email,
        to: Array.isArray(to) ? to : [to],
        subject: subject || '',
        text: text || '',
        html: html || undefined,
    };
    if (Array.isArray(cc) && cc.length)
        mail.cc = cc;
    if (Array.isArray(bcc) && bcc.length)
        mail.bcc = bcc;
    if (Array.isArray(attachments) && attachments.length) {
        mail.attachments = attachments.map((a) => ({
            filename: a.filename || 'attachment',
            content: Buffer.from(a.base64 || '', 'base64'),
            contentType: a.contentType,
        })).filter((a) => a.content.length > 0);
    }
    yield transporter.sendMail(mail);
    if (draftUid && draftFolder) {
        try {
            const client = imapClient(session);
            yield client.connect();
            try {
                yield client.mailboxOpen(draftFolder);
                yield client.messageDelete(draftUid, { uid: true });
            }
            catch (_a) {
                /* draft already gone */
            }
            yield client.logout().catch(() => undefined);
        }
        catch (_b) {
            /* cleanup best-effort */
        }
    }
    res.json({ success: true });
})));
exports.default = router;
