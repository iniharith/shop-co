/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Mail bridge — lets the webmail UI (email.kampungcetak.com) talk to the
 * self-hosted docker-mailserver via IMAP/SMTP. Browsers cannot use IMAP, so
 * the backend proxies it.
 */
import { Router, Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { randomUUID } from 'crypto';

const router = Router();

const MAIL_IMAP_HOST = process.env.MAIL_IMAP_HOST || '127.0.0.1';
const MAIL_IMAP_PORT = parseInt(process.env.MAIL_IMAP_PORT || '993', 10);
const MAIL_IMAP_SECURE = (process.env.MAIL_IMAP_SECURE || 'true') === 'true';
const MAIL_SMTP_HOST = process.env.MAIL_SMTP_HOST || '127.0.0.1';
const MAIL_SMTP_PORT = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
const MAIL_SMTP_SECURE = (process.env.MAIL_SMTP_SECURE || 'false') === 'true';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const INLINE_EMBED_LIMIT = 2 * 1024 * 1024;

interface MailSession {
    email: string;
    password: string;
    expiresAt: number;
}

const sessions = new Map<string, MailSession>();

const cleanSessions = () => {
    const now = Date.now();
    for (const [token, s] of sessions) {
        if (s.expiresAt <= now) sessions.delete(token);
    }
};
setInterval(cleanSessions, 30 * 60 * 1000).unref();

function getSession(req: Request): MailSession | null {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : '';
    const session = token ? sessions.get(token) : undefined;
    if (session && session.expiresAt > Date.now()) {
        session.expiresAt = Date.now() + SESSION_TTL_MS;
        return session;
    }
    if (session) sessions.delete(token);
    return null;
}

const requireMailSession = (req: Request, res: Response, next: NextFunction) => {
    const session = getSession(req);
    if (!session) {
        res.status(401).json({ success: false, message: 'Mail session expired or invalid' });
        return;
    }
    (req as any).mailSession = session;
    next();
};

function imapClient(session: MailSession) {
    return new ImapFlow({
        host: MAIL_IMAP_HOST,
        port: MAIL_IMAP_PORT,
        secure: MAIL_IMAP_SECURE,
        auth: { user: session.email, pass: session.password },
        logger: false,
        tls: { rejectUnauthorized: false },
    });
}

interface BodyNode {
    part?: string;
    type?: string;
    disposition?: string;
    filename?: string;
    size?: number;
    id?: string;
    childNodes?: BodyNode[];
}

const flattenParts = (node: BodyNode | undefined, prefix: string): BodyNode[] => {
    const out: BodyNode[] = [];
    if (!node) return out;
    const part = node.part || prefix;
    const isLeaf = !!node.type && !['multipart/mixed', 'multipart/alternative', 'multipart/related', 'multipart/signed', 'multipart/encrypted'].includes(node.type || '');
    if (isLeaf) {
        out.push({ ...node, part });
    }
    (node.childNodes || []).forEach((child, i) => {
        out.push(...flattenParts(child, part ? `${part}.${i + 1}` : `${i + 1}`));
    });
    return out;
};

const addressList = (list: any[] | null | undefined) =>
    (list || [])
        .filter((a) => a && a.address)
        .map((a) => ({ name: a.name || '', address: a.address }));

const flagList = (flags: any) =>
    Array.from(flags instanceof Set ? flags : flags || []) as string[];

const hasFlag = (flags: any, name: string) => flagList(flags).includes(name);

router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body || {};
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }
        const client = imapClient({ email, password } as MailSession);
        try {
            await client.connect();
        } catch (err) {
            res.status(401).json({ success: false, message: 'Login failed — check your email and password' });
            return;
        } finally {
            await client.logout().catch(() => undefined);
        }
        const token = randomUUID();
        sessions.set(token, { email, password, expiresAt: Date.now() + SESSION_TTL_MS });
        res.json({
            success: true,
            data: { token, email, displayName: email.split('@')[0] },
        });
    })
);

router.post('/logout', requireMailSession, asyncHandler(async (req, res) => {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : '';
    if (token) sessions.delete(token);
    res.json({ success: true });
}));

router.get('/me', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    res.json({ success: true, data: { email: session.email } });
}));

router.get('/folders', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    const client = imapClient(session);
    try {
        await client.connect();
        const list = await client.list();
        const folders = [];
        for (const folder of list) {
            let total = 0;
            try {
                await client.mailboxOpen(folder.path);
                total = client.mailbox ? client.mailbox.exists : 0;
            } catch {
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
    } finally {
        await client.logout().catch(() => undefined);
    }
}));

router.get('/messages', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    const folder = String(req.query.folder || 'INBOX');
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '25'), 10) || 25));

    const client = imapClient(session);
    try {
        await client.connect();
        await client.mailboxOpen(folder);
        const total = client.mailbox ? client.mailbox.exists : 0;
        const start = Math.max(1, total - ((page - 1) * pageSize + pageSize) + 1);
        const end = start + pageSize - 1;

        const items: any[] = [];
        if (start <= total && total > 0) {
            for await (const m of client.fetch(`${start}:${end}`, { envelope: true, flags: true })) {
                items.push({
                    uid: m.uid,
                    seq: m.seq,
                    flags: flagList(m.flags),
                    seen: !hasFlag(m.flags, '\\Seen'),
                    date: m.envelope?.date ? new Date(m.envelope.date).toISOString() : null,
                    subject: m.envelope?.subject || '(no subject)',
                    from: addressList(m.envelope?.from),
                    to: addressList(m.envelope?.to),
                });
            }
            items.reverse();
        }
        res.json({ success: true, data: { items, total, page, pageSize, folder } });
    } finally {
        await client.logout().catch(() => undefined);
    }
}));

router.get('/messages/:uid', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);

    const client = imapClient(session);
    try {
        await client.connect();
        await client.mailboxOpen(folder);
        const message = await client.fetchOne(uid, {
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
        const parsed = await simpleParser(message.source as any);
        const parts = flattenParts(message.bodyStructure, '');
        const attachments: any[] = [];

        for (const part of parts) {
            const contentType = part.type || 'application/octet-stream';
            const isAttachment = !part.id || (part.disposition && part.disposition.startsWith('attachment'));
            if (!isAttachment) continue;
            const entry: any = {
                part: part.part,
                filename: part.filename || `attachment-${part.part || '0'}`,
                contentType,
                size: part.size || 0,
                contentId: part.id || null,
            };
            if (part.id && part.size && part.size <= INLINE_EMBED_LIMIT) {
                try {
                    const dl = await client.download(uid, part.part as string, { uid: true });
                    const chunks: Buffer[] = [];
                    for await (const chunk of dl.content) chunks.push(chunk);
                    const buf = Buffer.concat(chunks);
                    entry.dataUri = `data:${contentType};base64,${buf.toString('base64')}`;
                } catch {
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
                date: message.envelope?.date ? new Date(message.envelope.date).toISOString() : new Date(message.internalDate || Date.now()).toISOString(),
                subject: message.envelope?.subject || '(no subject)',
                from: addressList(message.envelope?.from),
                to: addressList(message.envelope?.to),
                cc: addressList(message.envelope?.cc),
                flags: flagList(message.flags),
                seen: !hasFlag(message.flags, '\\Seen'),
                text: parsed.text || '',
                html,
                attachments,
            },
        });
    } finally {
        await client.logout().catch(() => undefined);
    }
}));

router.patch('/messages/:uid', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);
    const { seen, flagged, moveTo } = req.body || {};

    const client = imapClient(session);
    try {
        await client.connect();
        await client.mailboxOpen(folder);
        if (typeof seen === 'boolean') {
            if (seen) await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
            else await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
        }
        if (typeof flagged === 'boolean') {
            if (flagged) await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
            else await client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true });
        }
        if (typeof moveTo === 'string' && moveTo) {
            try {
                await client.mailboxOpen(moveTo);
            } catch {
                await client.mailboxCreate(moveTo);
            }
            await client.messageMove(uid, moveTo, { uid: true });
        }
        res.json({ success: true });
    } finally {
        await client.logout().catch(() => undefined);
    }
}));

router.delete('/messages/:uid', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);

    const client = imapClient(session);
    try {
        await client.connect();
        await client.mailboxOpen(folder);
        try {
            await client.mailboxOpen('Trash');
        } catch {
            await client.mailboxCreate('Trash');
        }
        await client.messageMove(uid, 'Trash', { uid: true });
        res.json({ success: true });
    } finally {
        await client.logout().catch(() => undefined);
    }
}));

router.get('/attachments/:uid/:part', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(req.params.uid, 10);
    const part = req.params.part;

    const client = imapClient(session);
    try {
        await client.connect();
        await client.mailboxOpen(folder);
        const dl = await client.download(uid, part, { uid: true });
        res.setHeader('Content-Disposition', `attachment; filename="${part}"`);
        dl.content.pipe(res);
    } catch (err) {
        res.status(404).json({ success: false, message: 'Attachment not found' });
    } finally {
        await client.logout().catch(() => undefined);
    }
}));

router.post('/send', requireMailSession, asyncHandler(async (req, res) => {
    const session = (req as any).mailSession as MailSession;
    const { to, cc, bcc, subject, text, html, attachments } = req.body || {};
    if (!to || !to.length) {
        res.status(400).json({ success: false, message: 'Recipient is required' });
        return;
    }

    const transporter = nodemailer.createTransport({
        host: MAIL_SMTP_HOST,
        port: MAIL_SMTP_PORT,
        secure: MAIL_SMTP_SECURE,
        auth: { user: session.email, pass: session.password },
        tls: { rejectUnauthorized: false },
    });

    const mail: any = {
        from: session.email,
        to: Array.isArray(to) ? to : [to],
        subject: subject || '',
        text: text || '',
        html: html || undefined,
    };
    if (Array.isArray(cc) && cc.length) mail.cc = cc;
    if (Array.isArray(bcc) && bcc.length) mail.bcc = bcc;
    if (Array.isArray(attachments) && attachments.length) {
        mail.attachments = attachments.map((a: any) => ({
            filename: a.filename || 'attachment',
            content: Buffer.from(a.base64 || '', 'base64'),
            contentType: a.contentType,
        })).filter((a: any) => a.content.length > 0);
    }

    await transporter.sendMail(mail);
    res.json({ success: true });
}));

export default router;
