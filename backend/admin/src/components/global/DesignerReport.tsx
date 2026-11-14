"use client";

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AxiosInstance from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Report {
  staff: { name: string };
  taskEntries: number;
  uniqueTasks: number;
  generatedAt: string;
  days: { date: string; tasks: { id: string; name: string; category: string }[] }[];
}

function initialDates() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const monday = new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  return { from: monday.toISOString().slice(0, 10), to: today };
}

export default function DesignerReport({ token, users, ownUserId }: { token: string; users: any[]; ownUserId: string }) {
  const [dates, setDates] = useState(initialDates);
  const [userId, setUserId] = useState(ownUserId);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState<'preview' | 'pdf' | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const key = `${userId}|${dates.from}|${dates.to}`;
  const request = async (pdf: boolean) => {
    if (busy || !userId || !dates.from || !dates.to) return;
    const requestKey = key;
    setBusy(pdf ? 'pdf' : 'preview');
    try {
      const response = await AxiosInstance(token).get(`/api/admin/reports/designer${pdf ? '/pdf' : ''}`, {
        params: { userId, ...dates }, responseType: pdf ? 'blob' : 'json', timeout: 60000,
      });
      if (pdf) {
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `designer-report-${dates.from}-${dates.to}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        setReport(response.data.report);
        setLoadedKey(requestKey);
      }
    } catch (error: any) {
      let message = error.response?.data?.message;
      if (error.response?.data instanceof Blob) {
        try { message = JSON.parse(await error.response.data.text()).message; } catch { /* Use the request error below. */ }
      }
      toast.error(typeof message === 'string' ? message : 'Unable to create the designer report. Please try again.');
    } finally { setBusy(null); }
  };

  return <section className="space-y-5">
    <div>
      <h2 className="text-xl font-semibold">Report Harian Designer</h2>
      <p className="mt-1 text-sm text-gray-400">Tasks you uploaded files to, grouped by category. One A4 page per day, with SELESAI status.</p>
      <p className="mt-1 text-xs text-gray-400">Dates use Malaysia time. Each task counts once per day. SELESAI is the report label for recorded uploads.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">Staff
        <select className="h-10 rounded-md border border-gray-700 bg-gray-900 px-3" value={userId} onChange={event => setUserId(event.target.value)} disabled={!!busy}>
          <option value="">Select staff</option>
          {users.filter(user => typeof user._id === 'string' && typeof user.name === 'string' && user.role !== 'client').map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">From
        <Input type="date" value={dates.from} max={dates.to} onChange={event => setDates(current => ({ ...current, from: event.target.value }))} disabled={!!busy} />
      </label>
      <label className="grid gap-1 text-sm">To
        <Input type="date" value={dates.to} min={dates.from} onChange={event => setDates(current => ({ ...current, to: event.target.value }))} disabled={!!busy} />
      </label>
      <Button onClick={() => request(false)} disabled={!!busy || !userId}>{busy === 'preview' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}View report</Button>
      <Button onClick={() => request(true)} disabled={!!busy || !userId} variant="outline">{busy === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download A4 PDF</Button>
    </div>
    {report && loadedKey === key && <>
      <p className="text-sm"><strong>{report.staff.name}</strong> · {report.taskEntries} daily task entries · {report.uniqueTasks} unique tasks</p>
      <p className="text-xs text-gray-400">Generated {new Date(report.generatedAt).toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' })} Malaysia time</p>
      <div className="grid gap-4 md:grid-cols-2">
        {report.days.map(day => <article key={day.date} className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
          <h3 className="mb-3 font-semibold">{day.date} <span className="text-gray-400">· {day.tasks.length} tasks</span></h3>
          {day.tasks.length ? <ol className="list-inside list-decimal space-y-1 text-sm">{day.tasks.map(task => <li key={task.id}>{task.name} <span className="text-gray-400">({task.category})</span></li>)}</ol> : <p className="text-sm text-gray-400">No recorded uploads.</p>}
        </article>)}
      </div>
    </>}
  </section>;
}
