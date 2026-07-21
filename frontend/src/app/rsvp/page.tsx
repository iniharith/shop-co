"use client";

import { CalendarDays, Check, ChevronDown, Clock3, Heart, MapPin, Send, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import styles from "./rsvp.module.css";

const wedding = {
  groom: "Muhammad Habri Bin Marzuki",
  bride: "Nor Fatin Nabila Binti Nasir",
  date: "Saturday, 5 September 2026",
  time: "11:00 AM - 4:00 PM",
  venue: "Kuasa Kaseh Event Space",
  mapsUrl: "https://maps.app.goo.gl/oG8vJLNdpdmtfhqT6?g_st=aw",
  startsAt: new Date("2026-09-05T11:00:00+08:00").getTime(),
};

type Attendance = "hadir" | "tidak-hadir" | "";

function getTimeRemaining() {
  const difference = Math.max(0, wedding.startsAt - Date.now());
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference % 86_400_000) / 3_600_000),
    minutes: Math.floor((difference % 3_600_000) / 60_000),
    seconds: Math.floor((difference % 60_000) / 1_000),
  };
}

export default function RsvpPage() {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [attendance, setAttendance] = useState<Attendance>("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRemaining(getTimeRemaining());
    const timer = window.setInterval(() => setRemaining(getTimeRemaining()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (!form.get("guestName")?.toString().trim() || !attendance) {
      setError("Sila isi nama dan pilih status kehadiran anda.");
      return;
    }

    setError("");
    setSubmitted(true);
  }

  const countdown = [
    [remaining.days, "Hari"],
    [remaining.hours, "Jam"],
    [remaining.minutes, "Minit"],
    [remaining.seconds, "Saat"],
  ];

  return (
    <main className={`${styles.invitation} rsvp-page`}>
      <nav className={styles.navigation} aria-label="Navigation invitation">
        <a href="#utama">H & F</a>
        <div>
          <a href="#majlis">Majlis</a>
          <a href="#rsvp">RSVP</a>
        </div>
      </nav>

      <section className={styles.hero} id="utama">
        <div className={`${styles.floralCluster} ${styles.topLeft}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className={`${styles.floralCluster} ${styles.topRight}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <p className={styles.eyebrow}>Walimatulurus</p>
        <div className={styles.monogram}><span>H</span><i /><span>F</span></div>
        <p className={styles.request}>Dengan penuh kesyukuran, kami menjemput</p>
        <h1><span>{wedding.groom}</span><em>&amp;</em><span>{wedding.bride}</span></h1>
        <div className={styles.dateRule}><span /> <p>05 . 09 . 2026</p> <span /></div>
        <a className={styles.scrollCue} href="#majlis"><ChevronDown size={18} /> Terokai undangan</a>
        <div className={`${styles.floralCluster} ${styles.bottomLeft}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className={`${styles.floralCluster} ${styles.bottomRight}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </section>

      <section className={styles.countdownSection} aria-label="Countdown to wedding">
        <p>Menanti hari bahagia</p>
        <div className={styles.countdown}>
          {countdown.map(([value, label]) => <div key={label as string}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <section className={styles.details} id="majlis">
        <p className={styles.eyebrow}>Save the date</p>
        <h2>Majlis Perkahwinan</h2>
        <p className={styles.detailsIntro}>Merafak sembah dan setinggi-tinggi penghargaan atas kesudian tuan/puan untuk bersama kami meraikan hari istimewa ini.</p>
        <div className={styles.detailGrid}>
          <article><CalendarDays /><p>Tarikh</p><strong>{wedding.date}</strong></article>
          <article><Clock3 /><p>Masa</p><strong>{wedding.time}</strong></article>
          <article><MapPin /><p>Lokasi</p><strong>{wedding.venue}</strong><a href={wedding.mapsUrl} target="_blank" rel="noreferrer">Buka Google Maps</a></article>
        </div>
      </section>

      <section className={styles.rsvpSection} id="rsvp">
        <div className={styles.rsvpPanel}>
          <p className={styles.eyebrow}>Pengesahan kehadiran</p>
          <h2>RSVP</h2>
          {submitted ? (
            <div className={styles.confirmation} role="status"><Check /><h3>Terima kasih</h3><p>Kehadiran anda telah direkodkan untuk sesi ini. Kami menantikan kehadiran anda.</p><button type="button" onClick={() => setSubmitted(false)}>Kemaskini respons</button></div>
          ) : (
            <form onSubmit={submitRsvp} noValidate>
              <label>Nama tetamu<input name="guestName" type="text" placeholder="Masukkan nama anda" /></label>
              <fieldset><legend>Adakah anda dapat hadir?</legend><div className={styles.attendanceOptions}>
                <button type="button" className={attendance === "hadir" ? styles.active : ""} onClick={() => setAttendance("hadir")}><Heart size={16} /> Insya-Allah hadir</button>
                <button type="button" className={attendance === "tidak-hadir" ? styles.active : ""} onClick={() => setAttendance("tidak-hadir")}>Tidak dapat hadir</button>
              </div></fieldset>
              <label>Bilangan tetamu<select name="guests" defaultValue="1"><option value="1">1 orang</option><option value="2">2 orang</option><option value="3">3 orang</option><option value="4">4 orang</option></select></label>
              <label>Ucapan untuk pengantin <textarea name="message" rows={3} placeholder="Tulis ucapan anda di sini..." /></label>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button className={styles.submit} type="submit">Hantar RSVP <Send size={16} /></button>
            </form>
          )}
        </div>
      </section>

      <footer className={styles.invitationFooter}><Users size={17} /><p>Dengan penuh kesyukuran, kami menantikan kehadiran anda.</p></footer>
    </main>
  );
}
