/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Mail, Phone, Building2, Pencil, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { mailStore } from "@/lib/mailStore";
import { GLASS, Avatar } from "./mail-utils";
import type { MailContact } from "@/lib/mail";

export function ContactsView() {
  const contacts = mailStore((s) => s.contacts);
  const email = mailStore((s) => s.email);
  const preview = mailStore((s) => s.preview);
  const addContact = mailStore((s) => s.addContact);
  const updateContact = mailStore((s) => s.updateContact);
  const deleteContact = mailStore((s) => s.deleteContact);
  const openCompose = mailStore((s) => s.openCompose);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MailContact | "new" | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return contacts.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Button
          className="gap-2 rounded-xl bg-primary text-primary-foreground dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
          onClick={() => setEditing("new")}
        >
          <Plus size={16} /> Add contact
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <User size={40} className="opacity-40" />
            <p>{contacts.length === 0 ? "No contacts yet — add your first one." : "No matches."}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className={`${GLASS} p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className="text-destructive"
                      onClick={() => deleteContact(c.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} /> {c.phone}
                    </div>
                  )}
                  {c.company && (
                    <div className="flex items-center gap-2">
                      <Building2 size={12} /> {c.company}
                    </div>
                  )}
                  {c.notes && <p className="line-clamp-2">{c.notes}</p>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() =>
                    openCompose("new", null, { draftTo: [c.email], draftSubject: "", draftBody: "", draftCc: [], draftBcc: [], draftFiles: [] })
                  }
                >
                  <Mail size={14} /> Email
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ContactDialog
          contact={editing === "new" ? null : editing}
          onSave={(c) => {
            if (editing === "new") addContact(c);
            else updateContact({ ...c, id: (editing as MailContact).id });
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ContactDialog({
  contact,
  onSave,
  onClose,
}: {
  contact: MailContact | null;
  onSave: (c: Omit<MailContact, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: contact?.name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    company: contact?.company || "",
    notes: contact?.notes || "",
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit contact" : "New contact"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+60…" />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.name.trim() || !form.email.trim()}
            onClick={() => onSave({ ...form, name: form.name.trim(), email: form.email.trim() })}
          >
            Save contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
