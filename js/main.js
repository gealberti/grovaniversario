// ---------- Config ----------
const EVENT = {
  title: "Aniversário Geovanna",
  start: new Date("2026-11-20T20:00:00-03:00"),
  end: new Date("2026-11-21T00:00:00-03:00"),
  location: "41Brooklyn - R. Alferes Poli, 821, Curitiba - PR",
  details: "Especial Justin Bieber\nInstagram do local: https://www.instagram.com/41bklyn/",
};
const EVENT_DATE = EVENT.start;

// ---------- Contagem regressiva ----------
const pad = (n) => String(n).padStart(2, "0");
const $units = {
  dias: document.querySelector('[data-unit="dias"]'),
  horas: document.querySelector('[data-unit="horas"]'),
  minutos: document.querySelector('[data-unit="minutos"]'),
  segundos: document.querySelector('[data-unit="segundos"]'),
};
const $grid = document.getElementById("countdown");
const $done = document.getElementById("countdown-done");

function tick() {
  const diff = EVENT_DATE - Date.now();
  if (diff <= 0) {
    $grid.hidden = true;
    $done.hidden = false;
    return false;
  }
  const s = Math.floor(diff / 1000);
  $units.dias.textContent = pad(Math.floor(s / 86400));
  $units.horas.textContent = pad(Math.floor((s % 86400) / 3600));
  $units.minutos.textContent = pad(Math.floor((s % 3600) / 60));
  $units.segundos.textContent = pad(s % 60);
  return true;
}
if (tick()) {
  const timer = setInterval(() => { if (!tick()) clearInterval(timer); }, 1000);
}

// ---------- Adicionar ao calendário ----------
const toStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const $calToggle = document.getElementById("cal-toggle");
const $calMenu = document.getElementById("cal-menu");

const googleUrl = "https://calendar.google.com/calendar/render?" + new URLSearchParams({
  action: "TEMPLATE",
  text: EVENT.title,
  dates: `${toStamp(EVENT.start)}/${toStamp(EVENT.end)}`,
  location: EVENT.location,
  details: EVENT.details,
});
document.getElementById("cal-google").href = googleUrl;

const ics = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Grova Niversario//PT-BR",
  "CALSCALE:GREGORIAN",
  "BEGIN:VEVENT",
  `UID:grova-niversario-2026@aniversauro`,
  `DTSTAMP:${toStamp(new Date())}`,
  `DTSTART:${toStamp(EVENT.start)}`,
  `DTEND:${toStamp(EVENT.end)}`,
  `SUMMARY:${EVENT.title}`,
  `LOCATION:${EVENT.location.replace(/,/g, "\\,")}`,
  `DESCRIPTION:${EVENT.details.replace(/\n/g, "\\n")}`,
  "BEGIN:VALARM",
  "TRIGGER:-P1D",
  "ACTION:DISPLAY",
  "DESCRIPTION:Amanhã tem Aniversário Geovanna!",
  "END:VALARM",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
document.getElementById("cal-ics").href =
  "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

function setCal(open) {
  $calMenu.hidden = !open;
  $calToggle.setAttribute("aria-expanded", String(open));
}
$calToggle.addEventListener("click", () => setCal($calMenu.hidden));
document.addEventListener("click", (e) => {
  if (!e.target.closest(".cal")) setCal(false);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setCal(false); });

// ---------- Confirmar presença (Pageclip) ----------
const $form = document.getElementById("rsvp-form");
if ($form && window.Pageclip) {
  Pageclip.form($form, {
    successTemplate: "<span>Presença confirmada!</span>",
    onResponse: (error) => {
      if (!error) document.getElementById("rsvp-note").hidden = false;
    },
  });
}

// ---------- Música de fundo ----------
const $bgm = document.getElementById("bgm");
const $music = document.getElementById("music");
let userPaused = false;

function syncMusic() {
  const playing = !$bgm.paused;
  $music.classList.toggle("is-playing", playing);
  $music.setAttribute("aria-pressed", String(playing));
  $music.setAttribute("aria-label", playing ? "Pausar música" : "Tocar música");
}
$bgm.volume = 0.6;
// Só uma música por vez: ao tocar aqui, outras abas/janelas do site pausam.
const channel = "BroadcastChannel" in window ? new BroadcastChannel("grova-bgm") : null;
const tabId = Math.random().toString(36).slice(2);
if (channel) {
  channel.onmessage = (e) => {
    if (!e.data || e.data.from === tabId) return;
    if (e.data.stop) userPaused = true; // parar em qualquer aba para todas
    if (!$bgm.paused) $bgm.pause();
  };
}
$bgm.addEventListener("play", () => {
  if (channel) channel.postMessage({ from: tabId });
  syncMusic();
});
$bgm.addEventListener("pause", syncMusic);

$music.addEventListener("click", (e) => {
  e.stopPropagation();
  if ($bgm.paused) { userPaused = false; $bgm.play().catch(() => {}); }
  else {
    userPaused = true;
    $bgm.pause();
    if (channel) channel.postMessage({ from: tabId, stop: true });
  }
});

syncMusic();
