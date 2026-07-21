"use client";

import { CalendarDays, Check, ChevronDown, Clock3, Gift, Heart, MapPin, PhoneCall, Send, Users, Volume2, VolumeX } from "lucide-react";
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
  const [coverState, setCoverState] = useState<"open" | "closing" | "closed">("open");
  const [musicEnabled, setMusicEnabled] = useState(false);

  useEffect(() => {
    setRemaining(getTimeRemaining());
    const timer = window.setInterval(() => setRemaining(getTimeRemaining()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.isVisible);
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.16 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
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

  function openInvitation() {
    setMusicEnabled(true);
    setCoverState("closing");
    window.setTimeout(() => setCoverState("closed"), 700);
  }

  const countdown = [
    [remaining.days, "Hari"],
    [remaining.hours, "Jam"],
    [remaining.minutes, "Minit"],
    [remaining.seconds, "Saat"],
  ];

  return (
    <main className={`${styles.invitation} rsvp-page`}>
      {coverState !== "closed" && (
        <section className={`${styles.openingCover} ${coverState === "closing" ? styles.closing : ""}`} aria-label="Buka jemputan">
          <div className={styles.coverInvitation}>
            <div className={styles.coverPattern} aria-hidden="true" />
            <FloralCluster className={styles.coverFlowersTopLeft} />
            <FloralCluster className={styles.coverFlowersTopRight} />
            <FloralCluster className={styles.coverFlowersBottomLeft} />
            <FloralCluster className={styles.coverFlowersBottomRight} />
            <div className={styles.coverPanel}>
              <button className={styles.openingSeal} type="button" onClick={openInvitation}>
                <span>Muhammad Habri<br />&amp; Nor Fatin</span>
                <small>Buka</small>
              </button>
            </div>
          </div>
        </section>
      )}
      {musicEnabled && <iframe className={styles.musicFrame} src="https://www.youtube.com/embed/JGz2aGs0MU4?autoplay=1&loop=1&playlist=JGz2aGs0MU4" title="Muzik latar majlis" allow="autoplay" />}
      <nav className={styles.navigation} aria-label="Navigation invitation">
        <button type="button" onClick={() => setMusicEnabled((enabled) => !enabled)} aria-label={musicEnabled ? "Matikan muzik" : "Mainkan muzik"}>
          {musicEnabled ? <Volume2 /> : <VolumeX />}<span>Muzik</span>
        </button>
        <a href="#kalendar"><CalendarDays /><span>Kalendar</span></a>
        <a href="#salam-kasih"><Gift /><span>Salam Kasih</span></a>
        <a href="#majlis"><MapPin /><span>Lokasi</span></a>
        <a href="#hubungi"><PhoneCall /><span>Hubungi</span></a>
        <a href="#rsvp"><Check /><span>RSVP</span></a>
      </nav>

      <section className={styles.hero} id="utama">
        <FloralCluster className={styles.topLeft} />
        <FloralCluster className={styles.topRight} />
        <p className={`${styles.eyebrow} ${styles.heroEyebrow}`}>Walimatul Urus</p>
        <div className={styles.monogram}><span>H</span><i /><span>F</span></div>
        <p className={styles.request}>Dengan penuh kesyukuran, kami menjemput</p>
        <h1><span>{wedding.groom}</span><em>&amp;</em><span>{wedding.bride}</span></h1>
        <div className={styles.dateRule}><span /> <p>05 . 09 . 2026</p> <span /></div>
        <a className={styles.scrollCue} href="#majlis"><ChevronDown size={18} /> Terokai undangan</a>
        <FloralCluster className={styles.bottomLeft} />
        <FloralCluster className={styles.bottomRight} />
      </section>

      <section className={`${styles.countdownSection} ${styles.reveal}`} data-reveal aria-label="Countdown to wedding">
        <p>Menanti hari bahagia</p>
        <div className={styles.countdown}>
          {countdown.map(([value, label]) => <div key={label as string}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <section className={`${styles.details} ${styles.reveal}`} data-reveal id="majlis">
        <p className={styles.eyebrow}>Save the date</p>
        <h2>Majlis Perkahwinan</h2>
        <p className={styles.detailsIntro}>Merafak sembah dan setinggi-tinggi penghargaan atas kesudian tuan/puan untuk bersama kami meraikan hari istimewa ini.</p>
        <div className={styles.detailGrid}>
          <article><CalendarDays /><p>Tarikh</p><strong>{wedding.date}</strong></article>
          <article><Clock3 /><p>Masa</p><strong>{wedding.time}</strong></article>
          <article><MapPin /><p>Lokasi</p><strong>{wedding.venue}</strong><a href={wedding.mapsUrl} target="_blank" rel="noreferrer">Buka Google Maps</a></article>
        </div>
      </section>

      <section className={`${styles.calendarSection} ${styles.reveal}`} data-reveal id="kalendar">
        <CalendarDays size={22} />
        <p className={styles.eyebrow}>Simpan tarikh</p>
        <h2>Tambah Ke Kalendar</h2>
        <p>Sabtu, 5 September 2026, 11:00 pagi hingga 4:00 petang</p>
        <div><a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Majlis+Perkahwinan+Muhammad+Habri+%26+Nor+Fatin+Nabila&dates=20260905T030000Z/20260905T080000Z&location=Kuasa+Kaseh+Event+Space" target="_blank" rel="noreferrer">Google Calendar</a><a href="https://maps.app.goo.gl/oG8vJLNdpdmtfhqT6?g_st=aw" target="_blank" rel="noreferrer">Lihat Lokasi</a></div>
      </section>

      <section className={`${styles.salamSection} ${styles.reveal}`} data-reveal id="salam-kasih">
        <FloralCluster className={styles.salamFlowersLeft} />
        <FloralCluster className={styles.salamFlowersRight} />
        <div className={styles.salamCard}>
          <Gift size={21} />
          <p className={styles.eyebrow}>Tanda kasih</p>
          <h2>Salam Kasih</h2>
          <p className={styles.salamCopy}>Kehadiran dan doa restu anda sudah cukup bermakna. Sekiranya anda ingin memberi tanda kasih, imbas kod QR di bawah.</p>
          <div className={styles.qrLayout}>
            <QrPlaceholder />
            <div className={styles.bankDetails}>
              <span>QR sementara</span>
              <strong>Maklumat bank akan dikemas kini</strong>
              <p>Sila gantikan dengan kod DuitNow atau QR bank pengantin sebelum jemputan dikongsi.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.contactSection} ${styles.reveal}`} data-reveal id="hubungi">
        <PhoneCall size={21} />
        <p className={styles.eyebrow}>Sebarang pertanyaan</p>
        <h2>Hubungi Kami</h2>
        <p>Sila hubungi pihak keluarga untuk pertanyaan berkaitan majlis.</p>
        <div className={styles.contactPlaceholder}>Nombor telefon akan dikemas kini</div>
      </section>

      <section className={`${styles.rsvpSection} ${styles.reveal}`} data-reveal id="rsvp">
        <div className={styles.rsvpPanel}>
          <p className={styles.eyebrow}>Pengesahan kehadiran</p>
          <h2>RSVP</h2>
          {submitted ? (
            <div className={styles.confirmation} role="status"><Check /><h3>Terima kasih</h3><p>Kehadiran anda telah direkodkan untuk sesi ini. Kami menantikan kehadiran anda.</p><button type="button" onClick={() => setSubmitted(false)}>Kemaskini respons</button></div>
          ) : (
            <form onSubmit={submitRsvp} noValidate>
              <label>Nama tetamu<input name="guestName" type="text" placeholder="Masukkan nama anda" /></label>
              <fieldset><legend>Adakah anda dapat hadir?</legend><div className={styles.attendanceOptions}>
                <button type="button" className={attendance === "hadir" ? styles.active : ""} onClick={() => setAttendance("hadir")}><Heart size={16} /> Hadir</button>
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

function FloralCluster({ className }: { className: string }) {
  return (
    <div className={`${styles.floralCluster} ${className}`} aria-hidden="true">
      <span className={styles.vine} />
      <i /><i /><i /><i /><i />
      <b /><b /><b />
    </div>
  );
}

function QrPlaceholder() {
  const cells = Array.from({ length: 169 }, (_, index) => index);
  const filled = new Set([0, 1, 2, 3, 12, 13, 14, 15, 24, 25, 26, 27, 36, 37, 38, 39, 48, 49, 50, 51, 60, 61, 62, 63, 72, 73, 74, 75, 84, 85, 86, 87, 96, 97, 98, 99, 108, 109, 110, 111, 120, 121, 122, 123, 132, 133, 134, 135, 144, 145, 146, 147, 156, 157, 158, 159]);
  return <div className={styles.qrPlaceholder} aria-label="Kod QR sementara">{cells.map((index) => <i className={filled.has(index) || (index * 7 + index % 5) % 4 === 0 ? styles.qrDark : ""} key={index} />)}</div>;
}
