"use client";

import { CalendarDays, Check, ChevronDown, Clock3, MapPin, PhoneCall, Send, Users, Volume2, VolumeX } from "lucide-react";
import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import styles from "./rsvp.module.css";

const wedding = {
  groom: "MUHAMMAD HABRI BIN MARZUKI",
  bride: "NOR FATIN NABILA BINTI NASIR",
  groomDisplay: "Habri",
  brideDisplay: "Fatin",
  day: "Sabtu",
  date: "5 September 2026",
  hijriDate: "23 Rabiulawal 1448 Hijriah",
  time: "11:00 AM - 4:00 PM",
  venue: "Kuasa Kaseh Event Space",
  mapsUrl: "https://maps.app.goo.gl/oG8vJLNdpdmtfhqT6?g_st=aw",
  locationQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fmaps.app.goo.gl%2FoG8vJLNdpdmtfhqT6%3Fg_st%3Daw",
  startsAt: new Date("2026-09-05T11:00:00+08:00").getTime(),
};

type Attendance = "hadir" | "tidak-hadir" | "";
type Sheet = "calendar" | "location" | "contact" | "music" | "rsvp" | null;
type Wish = { id: string; name: string; message: string };

const wishesStorageKey = "fatin-habri-wedding-wishes";

function getTimeRemaining() {
  const difference = Math.max(0, wedding.startsAt - Date.now());
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference % 86_400_000) / 3_600_000),
    minutes: Math.floor((difference % 3_600_000) / 60_000),
    seconds: Math.floor((difference % 60_000) / 1_000),
  };
}

export default function FatinHabriPage() {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [attendance, setAttendance] = useState<Attendance>("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [coverState, setCoverState] = useState<"open" | "closing" | "closed">("open");
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [activeWishIndex, setActiveWishIndex] = useState(0);
  const autoScrollFrame = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(getTimeRemaining());
    const timer = window.setInterval(() => setRemaining(getTimeRemaining()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setActiveWishIndex(0);
    if (wishes.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveWishIndex((index) => (index + 1) % wishes.length);
    }, 2_500);
    return () => window.clearInterval(timer);
  }, [wishes.length]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(wishesStorageKey);
      if (stored) setWishes((JSON.parse(stored) as Wish[]).slice(0, 12));
    } catch {
      setWishes([]);
    }
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
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

  useEffect(() => {
    document.body.style.overflow = coverState === "closed" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [coverState]);

  useEffect(() => {
    if (!autoScrolling || coverState !== "closed") return;

    const stopAutoScroll = () => setAutoScrolling(false);
    const start = window.scrollY;
    const destination = document.documentElement.scrollHeight - window.innerHeight;
    const distance = Math.max(0, destination - start);

    if (distance < 2) {
      stopAutoScroll();
      return;
    }

    // A fixed low speed keeps the invitation gliding consistently on every screen size.
    const duration = distance / 34 * 1_000;
    let startedAt = 0;
    const advance = (now: number) => {
      if (!startedAt) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      const easedProgress = .5 - Math.cos(progress * Math.PI) / 2;
      window.scrollTo(0, start + distance * easedProgress);

      if (progress < 1) {
        autoScrollFrame.current = window.requestAnimationFrame(advance);
      } else {
        stopAutoScroll();
      }
    };

    const startDelay = window.setTimeout(() => {
      autoScrollFrame.current = window.requestAnimationFrame(advance);
    }, 3_000);
    window.addEventListener("wheel", stopAutoScroll, { passive: true });
    window.addEventListener("touchstart", stopAutoScroll, { passive: true });
    window.addEventListener("pointerdown", stopAutoScroll, { passive: true });
    window.addEventListener("keydown", stopAutoScroll);

    return () => {
      window.clearTimeout(startDelay);
      if (autoScrollFrame.current) window.cancelAnimationFrame(autoScrollFrame.current);
      window.removeEventListener("wheel", stopAutoScroll);
      window.removeEventListener("touchstart", stopAutoScroll);
      window.removeEventListener("pointerdown", stopAutoScroll);
      window.removeEventListener("keydown", stopAutoScroll);
    };
  }, [autoScrolling, coverState]);

  function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const guestName = form.get("guestName")?.toString().trim() ?? "";
    const message = form.get("message")?.toString().trim() ?? "";

    if (!guestName || !attendance) {
      setError("Sila isi nama dan pilih status kehadiran anda.");
      return;
    }

    if (message) {
      setActiveWishIndex(0);
      setWishes((current) => {
        const next = [{ id: `${Date.now()}-${guestName}`, name: guestName, message }, ...current].slice(0, 12);
        try {
          window.localStorage.setItem(wishesStorageKey, JSON.stringify(next));
        } catch {
          // The wish still appears for this session when storage is unavailable.
        }
        return next;
      });
    }

    setError("");
    setSubmitted(true);
  }

  function openInvitation() {
    setMusicEnabled(true);
    setCoverState("closing");
    window.setTimeout(() => setAutoScrolling(true), 0);
    window.setTimeout(() => setCoverState("closed"), 1_000);
  }

  function scrollToSection(id: string) {
    setAutoScrolling(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleContentClick(event: ReactMouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) {
      setAutoScrolling(false);
      return;
    }

    if (event.detail === 2) {
      setAutoScrolling((enabled) => !enabled);
    } else if (event.detail >= 3) {
      setAutoScrolling(true);
    } else {
      setAutoScrolling(false);
    }
  }

  const countdown = [
    [remaining.days, "Hari"],
    [remaining.hours, "Jam"],
    [remaining.minutes, "Minit"],
    [remaining.seconds, "Saat"],
  ];
  const activeWish = wishes[activeWishIndex];

  return (
    <main className={`${styles.invitation} ${coverState !== "open" ? styles.opened : ""} rsvp-page`} onClick={handleContentClick}>
      {coverState !== "closed" && (
        <section className={`${styles.openingCover} ${coverState === "closing" ? styles.closing : ""}`} aria-label="Buka jemputan">
          <div className={styles.coverInvitation}>
            <div className={styles.coverPattern} aria-hidden="true" />
            <FloralCluster className={styles.coverFloralFrame} />
            <div className={styles.coverPanel} aria-hidden="true" />
            <button className={styles.openingSeal} type="button" onClick={openInvitation} aria-label="Fatin dan Habri - buka jemputan">
              <img className={styles.waxSealArtwork} src="/images/wedding-wax-seal-fh.png" alt="" aria-hidden="true" />
              <small>Buka</small>
            </button>
          </div>
        </section>
      )}
      {musicEnabled && <iframe className={styles.musicFrame} src="https://www.youtube.com/embed/JGz2aGs0MU4?autoplay=1&loop=1&playlist=JGz2aGs0MU4" title="Muzik latar majlis" allow="autoplay" />}
      <nav className={styles.navigation} aria-label="Navigation invitation">
        <button type="button" onClick={() => setActiveSheet("contact")}><PhoneCall /><span>Hubungi</span></button>
        <button type="button" onClick={() => setActiveSheet("music")} aria-label={musicEnabled ? "Kawalan muzik" : "Mainkan muzik"}>
          {musicEnabled ? <Volume2 /> : <VolumeX />}<span>Muzik</span>
        </button>
        <button type="button" onClick={() => setActiveSheet("location")}><MapPin /><span>Lokasi</span></button>
        <button type="button" onClick={() => setActiveSheet("rsvp")}><Check /><span>RSVP</span></button>
      </nav>

      {activeSheet && (
        <div className={styles.sheetLayer} role="presentation" onClick={() => setActiveSheet(null)}>
          <section className={styles.actionSheet} role="dialog" aria-modal="true" aria-label="Maklumat jemputan" onClick={(event) => event.stopPropagation()}>
            <button className={styles.sheetClose} type="button" onClick={() => setActiveSheet(null)} aria-label="Tutup">&times;</button>
            {activeSheet === "calendar" && <CalendarSheet />}
            {activeSheet === "location" && <LocationSheet />}
            {activeSheet === "contact" && <ContactSheet />}
            {activeSheet === "music" && <MusicSheet musicEnabled={musicEnabled} setMusicEnabled={setMusicEnabled} />}
            {activeSheet === "rsvp" && <QuickRsvp attendance={attendance} setAttendance={setAttendance} close={() => setActiveSheet(null)} />}
          </section>
        </div>
      )}

      <section className={styles.hero} id="utama">
        <FloralCluster className={styles.heroFloralFrame} />
        <WeddingMonogram className={styles.monogram} />
        <p className={`${styles.eyebrow} ${styles.heroEyebrow}`}>Walimatul Urus</p>
        <p className={styles.request}>Dengan penuh kesyukuran, kami menjemput</p>
        <h1><span>{wedding.brideDisplay}</span><em>&amp;</em><span>{wedding.groomDisplay}</span></h1>
        <div className={styles.dateRule}><span /> <p>{wedding.day}<br />{wedding.date}<br />{wedding.hijriDate}</p> <span /></div>
        <a className={styles.scrollCue} href="#majlis" onClick={(event) => { event.preventDefault(); scrollToSection("majlis"); }}><ChevronDown size={18} /> Terokai undangan</a>
      </section>

      <section className={`${styles.details} ${styles.reveal}`} data-reveal id="majlis">
        <p className={styles.eyebrow}>Save the date</p>
        <h2>Walimatul Urus</h2>
        <p className={styles.detailsIntro}><span>Assalamualaikum wbr &amp; Salam Sejahtera</span><span>dengan penuh kesyukuran dan keredhaan-Nya, Saya</span></p>
        <div className={styles.hostNames}><strong>NASIR BIN IBRAHIM</strong><span>&amp;</span><strong>FATAHIAH BINTI MAT DRIS</strong></div>
        <p className={styles.hostInvitation}><span>Dengan penuh kesyukuran, kami menjemput</span><span>Dato&apos;/Datin/Tuan/Puan/Encik/Cik</span><span>ke majlis perkahwinan puteri kami yang dikasihi</span></p>
        <div className={styles.coupleDetails}><strong>{wedding.bride}</strong><span>&amp;</span><strong>{wedding.groom}</strong></div>
        <div className={styles.detailGrid}>
          <article><CalendarDays /><p>Tarikh / Hari</p><strong>{wedding.day}<br />{wedding.date}<br />{wedding.hijriDate}</strong></article>
          <article><Clock3 /><p>Masa</p><strong>{wedding.time}</strong></article>
          <article><MapPin /><p>Lokasi</p><strong>{wedding.venue}</strong><a href={wedding.mapsUrl} target="_blank" rel="noreferrer">Buka Google Maps</a><a className={styles.locationQr} href={wedding.mapsUrl} target="_blank" rel="noreferrer"><img src={wedding.locationQrUrl} alt="Kod QR lokasi Kuasa Kaseh Event Space" /><span>Imbas QR untuk lokasi</span></a></article>
        </div>
      </section>

      <section className={`${styles.salamSection} ${styles.reveal}`} data-reveal id="salam-kasih">
        <FloralCluster className={styles.sectionFloralFrame} />
        <div className={styles.salamCard}>
          <p className={styles.eyebrow}>Atur cara majlis</p>
          <div className={styles.programmeList}>
            <p><strong>Jamuan</strong><span>11:00 pagi - 4:00 petang</span></p>
          </div>
          <span className={styles.hashtag}>#FatinHabri</span>
        </div>
      </section>

      <section className={`${styles.countdownSection} ${styles.reveal}`} data-reveal aria-label="Countdown to wedding">
        <FloralCluster className={styles.paperFloralFrame} />
        <p>Counting Days</p>
        <div className={styles.countdown}>
          {countdown.map(([value, label]) => <div key={label as string}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
        </div>
        <div className={styles.wishes}>
          <h2>Wishes</h2>
          <div className={styles.wishList} aria-live="polite">
            {activeWish ? <blockquote className={styles.animatedWish} key={activeWish.id}><p>&ldquo;{activeWish.message}&rdquo;</p><cite>{activeWish.name}</cite></blockquote> : <p className={styles.emptyWish}>Semoga majlis ini dipermudahkan dan diberkati.</p>}
          </div>
          <div className={styles.wishActions}><button type="button" onClick={() => setActiveSheet("rsvp")}>RSVP Now</button><button type="button" onClick={() => scrollToSection("rsvp")}>Write a Message</button></div>
        </div>
      </section>

      <section className={`${styles.rsvpSection} ${styles.reveal}`} data-reveal id="rsvp">
        <FloralCluster className={styles.paperFloralFrame} />
        <div className={styles.rsvpPanel}>
          <p className={styles.eyebrow}>Pengesahan kehadiran</p>
          <h2>RSVP</h2>
          {submitted ? (
            <div className={styles.confirmation} role="status"><Check /><h3>Terima kasih</h3><p>Kehadiran anda telah direkodkan untuk sesi ini. Kami menantikan kehadiran anda.</p><button type="button" onClick={() => setSubmitted(false)}>Kemaskini respons</button></div>
          ) : (
            <form onSubmit={submitRsvp} noValidate>
              <label>Nama tetamu<input name="guestName" type="text" maxLength={80} placeholder="Masukkan nama anda" /></label>
              <fieldset><legend>Adakah anda dapat hadir?</legend><div className={styles.attendanceOptions}>
                <button type="button" className={attendance === "hadir" ? styles.active : ""} onClick={() => setAttendance("hadir")}>Hadir</button>
                <button type="button" className={attendance === "tidak-hadir" ? styles.active : ""} onClick={() => setAttendance("tidak-hadir")}>Tidak dapat hadir</button>
              </div></fieldset>
              <label>Bilangan tetamu<input name="guests" type="number" min="1" max="99" inputMode="numeric" defaultValue="1" placeholder="Masukkan bilangan tetamu" /></label>
              <label>Ucapan untuk pengantin <textarea name="message" rows={3} maxLength={180} placeholder="Tulis ucapan anda di sini..." /></label>
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
  return <div className={`${styles.floralCluster} ${className}`} aria-hidden="true" />;
}

function WeddingMonogram({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.weddingMonogram} ${className}`} role="img" aria-label="Monogram Habri dan Fatin">
      <img className={styles.monogramArtwork} src="/images/wedding-logo.svg" alt="" aria-hidden="true" />
    </div>
  );
}

function SheetHeading({ children }: { children: React.ReactNode }) {
  return <><div className={styles.sheetOrnament}><b>F</b><span>&amp;</span><b>H</b></div><h2>{children}</h2></>;
}

function CalendarSheet() {
  return <div className={styles.sheetContent}><SheetHeading>Kalendar</SheetHeading><p>Simpan tarikh majlis perkahwinan kami.</p><strong>{wedding.day}<br />{wedding.date}<br />{wedding.hijriDate}</strong><p>11:00 pagi - 4:00 petang</p><a className={styles.sheetButton} href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Majlis+Perkahwinan+Muhammad+Habri+%26+Nor+Fatin+Nabila&dates=20260905T030000Z/20260905T080000Z&location=Kuasa+Kaseh+Event+Space" target="_blank" rel="noreferrer">Tambah ke Google Calendar</a></div>;
}

function LocationSheet() {
  return <div className={styles.sheetContent}><SheetHeading>Lokasi</SheetHeading><MapPin /><strong>Kuasa Kaseh Event Space</strong><a className={styles.sheetButton} href="https://maps.app.goo.gl/oG8vJLNdpdmtfhqT6?g_st=aw" target="_blank" rel="noreferrer">Google Maps</a><a className={styles.sheetButton} href="https://www.waze.com/live-map/directions?to=place.Kuasa%20Kaseh%20Event%20Space" target="_blank" rel="noreferrer">Buka Waze</a></div>;
}

function ContactSheet() {
  const contacts = [
    ["En Nasir", "0177494346"],
    ["En Asrul", "0177439869"],
    ["Pn Wahida", "0133111946"],
  ];

  return <div className={styles.sheetContent}><SheetHeading>Hubungi</SheetHeading><p>Tekan nombor untuk membuat panggilan.</p><div className={styles.contactList}>{contacts.map(([name, phone]) => <a key={phone} href={`tel:${phone}`}><span>{name}</span><strong>{phone}</strong><PhoneCall /></a>)}</div></div>;
}

function MusicSheet({ musicEnabled, setMusicEnabled }: { musicEnabled: boolean; setMusicEnabled: (enabled: boolean) => void }) {
  return <div className={styles.sheetContent}><SheetHeading>Muzik</SheetHeading><p>{musicEnabled ? "Muzik latar sedang dimainkan." : "Muzik latar dimatikan."}</p><div className={styles.musicOptions}><button type="button" className={musicEnabled ? styles.selected : ""} onClick={() => setMusicEnabled(true)}>Muzik On</button><button type="button" className={!musicEnabled ? styles.selected : ""} onClick={() => setMusicEnabled(false)}>Muzik Off</button></div></div>;
}

function QuickRsvp({ attendance, setAttendance, close }: { attendance: Attendance; setAttendance: (value: Attendance) => void; close: () => void }) {
  function choose(value: Attendance) {
    setAttendance(value);
    close();
    window.setTimeout(() => document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" }), 250);
  }

  return <div className={styles.sheetContent}><SheetHeading>RSVP &amp; Ucapan</SheetHeading><p>Sahkan kehadiran anda.</p><div className={styles.quickRsvp}><button className={attendance === "hadir" ? styles.selected : ""} type="button" onClick={() => choose("hadir")}><Check />Hadir</button><button className={attendance === "tidak-hadir" ? styles.selected : ""} type="button" onClick={() => choose("tidak-hadir")}><span>&times;</span>Tidak Hadir</button></div></div>;
}
