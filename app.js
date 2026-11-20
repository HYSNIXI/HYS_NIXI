(() => {
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     Config
     ══════════════════════════════════════════════════════════════ */

  const CF_DOWN = (bytes) =>
    `https://speed.cloudflare.com/__down?bytes=${bytes}&r=${Math.random().toString(36).slice(2, 10)}`;
  const CF_UP = "https://speed.cloudflare.com/__up";
  const IP_API = "https://ipwho.is/?fields=success,ip,city,country,connection";
  const GEO_API = "https://get.geojs.io/v1/ip/geo.json";
  const TRACE_API = "https://www.cloudflare.com/cdn-cgi/trace";

  const CPU_CORES = navigator.hardwareConcurrency || 4;

  // Each phase runs until the line settles (plateau detection) inside a
  // [min, max] window. A byte cap keeps a gigabit line from downloading long
  // after the number has converged.
  const CONFIG = {
    latencySamples: 12,
    latencyTimeoutMs: 3000,
    latencyGapMs: 40,

    downloadMinMs: 6000,
    downloadMaxMs: 14000,
    downloadWarmupMs: 900,
    downloadStreams: CPU_CORES >= 8 ? 5 : 4,
    downloadChunkBytes: 16_000_000,
    downloadCapBytes: 160_000_000,

    uploadMinMs: 5000,
    uploadMaxMs: 12000,
    uploadWarmupMs: 800,
    uploadStreams: 3,
    uploadChunkBytes: 1_000_000,
    uploadMaxChunkBytes: 8_000_000,
    uploadCapBytes: 48_000_000,
    uploadTargetMs: 1400,

    sampleMs: 120,
    plateauWindowMs: 500,
    plateauSamples: 9,
    plateauTolerance: 0.05,
    speedWindowMs: 2000,
    capGraceMs: 2500,
  };

  const COLORS = {
    idle: "#7e8fa1",
    latency: "#57d2ff",
    download: "#5cf2b0",
    upload: "#ffc061",
    done: "#5cf2b0",
    error: "#ff6b6b",
    accent: "#5cf2b0",
  };

  const THEMES = ["mint", "violet", "rose", "ice", "lime"];
  const THEME_SWATCH = {
    mint: "#5cf2b0",
    violet: "#b18cff",
    rose: "#ff8fc7",
    ice: "#7cc4ff",
    lime: "#c8f45a",
  };
  const GAUGES = ["instrument", "rainbow", "halo"];
  // The Vibration API only takes durations, so intensity is expressed as the
  // length of the tap pulse.
  const HAPTICS = ["off", "soft", "medium", "strong"];
  const HAPTIC_MS = { off: 0, soft: 10, medium: 18, strong: 30 };
  const BAND_COLORS = [
    "#ef4136",
    "#f26b2c",
    "#f59d24",
    "#f7c93d",
    "#f3e14b",
    "#cfe456",
    "#79dc5f",
    "#42d67f",
    "#3acfc4",
    "#3a9fd6",
  ];

  /* ══════════════════════════════════════════════════════════════
     Copy (fa / en)
     ══════════════════════════════════════════════════════════════ */

  const I18N = {
    fa: {
      pageTitle: "Internet Speed",
      brandTag: "ابزار سنجش سرعت",
      eyebrow: "ابزار اندازه‌گیری شبکه",
      h1: "سرعت واقعی خطت را اندازه بگیر",
      recordLabel: "رکورد",
      recordHint: "اولین تست را بزنید",
      today: "امروز",
      yesterday: "دیروز",
      ping: "پینگ",
      jitter: "جیتر",
      loss: "پکت‌لاس",
      start: "شروع تست",
      restart: "تست دوباره",
      stop: "توقف",
      share: "کارت نتیجه",
      ip: "آدرس IP",
      isp: "اپراتور",
      location: "موقعیت",
      edge: "لبه شبکه",
      phase_idle: "آماده",
      phase_latency: "سنجش پینگ",
      phase_download: "تست دانلود",
      phase_upload: "تست آپلود",
      phase_done: "پایان تست",
      phase_error: "اتصال برقرار نشد",
      cardTitle: "کارت نتیجه",
      close: "بستن",
      saveImage: "دانلود تصویر",
      shareImage: "اشتراک‌گذاری",
      doneToast: "تست کامل شد؛ کارت نتیجه آماده است.",
      stoppedToast: "تست متوقف شد.",
      errNetwork:
        "اتصال برقرار نشد یا Cloudflare پاسخ نداد. شبکه یا کانفینگ را بررسی و دوباره تلاش کنید.",
      errOffline: "اینترنت در دسترس نیست. اتصال را بررسی کنید.",
      cardHeading: "نتیجه‌ی سنجش سرعت",
      dlLabel: "دانلود",
      ulLabel: "آپلود",
      settings: "تنظیمات",
      languageLabel: "زبان",
      themeLabel: "تم رنگ",
      theme_mint: "نعنایی",
      theme_violet: "بنفش",
      theme_rose: "صورتی",
      theme_ice: "یخی",
      theme_lime: "لیمویی",
      gaugeLabel: "استایل عقربه",
      gauge_instrument: "ابزاری",
      gauge_rainbow: "رنگین‌کمان",
      gauge_halo: "هاله",
      gaugeSlow: "کند",
      gaugeFast: "سریع",
      hapticLabel: "لرزش",
      haptic_off: "خاموش",
      haptic_soft: "ملایم",
      haptic_medium: "متوسط",
      haptic_strong: "قوی",
      switchToLight: "روشن کردن تم",
      switchToDark: "تاریک کردن تم",
      credit: "ساخته شده توسط ԹʍɿՐ ʍԾɧԹʍԹԺ ;⁠)",
    },
    en: {
      pageTitle: "Internet Speed",
      brandTag: "NETWORK INSTRUMENT",
      eyebrow: "Network measurement instrument",
      h1: "Measure what your line actually delivers",
      recordLabel: "Record",
      recordHint: "Run a test to set it",
      today: "Today",
      yesterday: "Yesterday",
      ping: "Ping",
      jitter: "Jitter",
      loss: "Packet loss",
      start: "Start test",
      restart: "Test again",
      stop: "Stop",
      share: "Result card",
      ip: "IP address",
      isp: "ISP",
      location: "Location",
      edge: "Edge",
      phase_idle: "Ready",
      phase_latency: "Measuring latency",
      phase_download: "Download test",
      phase_upload: "Upload test",
      phase_done: "Test complete",
      phase_error: "Connection failed",
      cardTitle: "Result card",
      close: "Close",
      saveImage: "Download image",
      shareImage: "Share",
      doneToast: "Test complete. Your result card is ready.",
      stoppedToast: "Test stopped.",
      errNetwork:
        "Could not reach Cloudflare. Check your network or VPN and try again.",
      errOffline: "You appear to be offline. Check your connection.",
      cardHeading: "Speed test result",
      dlLabel: "Download",
      ulLabel: "Upload",
      settings: "Settings",
      languageLabel: "Language",
      themeLabel: "Color theme",
      theme_mint: "Mint",
      theme_violet: "Violet",
      theme_rose: "Rose",
      theme_ice: "Ice",
      theme_lime: "Lime",
      gaugeLabel: "Needle style",
      gauge_instrument: "Instrument",
      gauge_rainbow: "Rainbow",
      gauge_halo: "Halo",
      gaugeSlow: "SLOW",
      gaugeFast: "FAST",
      hapticLabel: "Vibration",
      haptic_off: "Off",
      haptic_soft: "Soft",
      haptic_medium: "Medium",
      haptic_strong: "Strong",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
      credit: "Built by ԹʍɿՐ ʍԾɧԹʍԹԺ ;⁠)",
    },
  };

  /* ══════════════════════════════════════════════════════════════
     DOM / state
     ══════════════════════════════════════════════════════════════ */

  const $ = (id) => document.getElementById(id);

  const els = {
    html: document.documentElement,
    console: $("console"),
    phaseLabel: $("phaseLabel"),
    recordChip: $("recordChip"),
    recordVals: $("recordVals"),
    recordDate: $("recordDate"),
    gaugeTicks: $("gaugeTicks"),
    gaugeLabels: $("gaugeLabels"),
    gaugeBands: $("gaugeBands"),
    gaugeSlow: $("gaugeSlow"),
    gaugeFast: $("gaugeFast"),
    arcLive: $("arcLive"),
    needle: $("needleGroup"),
    speedValue: $("speedValue"),
    scaleLabel: $("scaleLabel"),
    sparkline: $("sparkline"),
    statDownload: $("statDownload"),
    statUpload: $("statUpload"),
    statPing: $("statPing"),
    statJitter: $("statJitter"),
    statLoss: $("statLoss"),
    startBtn: $("startBtn"),
    startLabel: $("startBtn").querySelector("span"),
    stopBtn: $("stopBtn"),
    shareBtn: $("shareBtn"),
    controls: document.querySelector(".controls"),
    themeSwitch: $("themeSwitch"),
    settingsBtn: $("settingsBtn"),
    settingsPop: $("settingsPop"),
    themeSwatches: $("themeSwatches"),
    gaugeStyleBox: $("gaugeStyles"),
    hapticSeg: $("hapticSeg"),
    themeColor: $("themeColor"),
    connChip: $("connChip"),
    connChipText: $("connChipText"),
    metaIp: $("metaIp"),
    metaIsp: $("metaIsp"),
    metaLocation: $("metaLocation"),
    metaEdge: $("metaEdge"),
    toast: $("toast"),
    dialog: $("shareDialog"),
    shareCanvas: $("shareCanvas"),
    shareCloseBtn: $("shareCloseBtn"),
    shareDownloadBtn: $("shareDownloadBtn"),
    shareNativeBtn: $("shareNativeBtn"),
  };

  const state = {
    lang: readStoredLang(),
    mode: readStoredMode(),
    theme: readStoredTheme(),
    gauge: readStoredGauge(),
    haptic: readStoredHaptic(),
    phase: "idle",
    running: false,
    hasResult: false,
    results: null,
    info: {
      ip: "",
      isp: "",
      city: "",
      country: "",
      countryName: "",
      colo: "",
      asn: "",
    },
  };

  let abortController = null;
  let toastTimer = null;

  /* ══════════════════════════════════════════════════════════════
     Helpers
     ══════════════════════════════════════════════════════════════ */

  function t(key) {
    const dict = I18N[state.lang];
    return dict[key] != null ? dict[key] : key;
  }

  function readStoredLang() {
    try {
      return localStorage.getItem("netgauge-lang") === "fa" ? "fa" : "en";
    } catch {
      return "en";
    }
  }

  function readStoredMode() {
    try {
      const stored = localStorage.getItem("netgauge-mode");
      if (stored === "light" || stored === "dark") return stored;
    } catch {
      /* ignore */
    }
    return "dark";
  }

  function readStoredTheme() {
    try {
      const stored = localStorage.getItem("netgauge-theme");
      if (THEMES.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    return "mint";
  }

  function readStoredGauge() {
    try {
      const stored = localStorage.getItem("netgauge-gauge");
      if (GAUGES.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    return "instrument";
  }

  function readStoredHaptic() {
    try {
      const stored = localStorage.getItem("netgauge-haptic");
      if (HAPTICS.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    return "medium";
  }

  function hapticPulse(level) {
    if (level === "off") return;
    if (typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(HAPTIC_MS[level] || 0);
    } catch {
      /* vibration is best-effort */
    }
  }

  function cssColor(name, fallback) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  }

  // Every canvas drawing (sparkline, share card) reads this so the result
  // follows the live theme instead of the hard-coded mint palette.
  function palette() {
    return {
      accent: cssColor("--accent", COLORS.accent),
      accentText: cssColor("--accent-text", COLORS.accent),
      accentRgb: cssColor("--accent-rgb", "92, 242, 176"),
      upload: cssColor("--upload", COLORS.upload),
      latency: cssColor("--latency", COLORS.latency),
      danger: cssColor("--danger", COLORS.error),
      text: cssColor("--text", "#e8eff6"),
      textSoft: cssColor("--text-soft", "#c3cfdb"),
      muted: cssColor("--muted", "#7e8fa1"),
      muted2: cssColor("--muted-2", "#5a6877"),
      bg: cssColor("--bg", "#080a0d"),
      panel: cssColor("--panel", "#10161d"),
      panel2: cssColor("--panel-2", "#0b1015"),
      line: cssColor("--line", "#1d2731"),
      lineStrong: cssColor("--line-strong", "#2a3743"),
      tickStrong: cssColor("--tick-strong", "#46586a"),
      gridLine: cssColor("--grid-line", "rgba(255,255,255,0.028)"),
      chartGrid: cssColor("--chart-grid", "rgba(255,255,255,0.055)"),
    };
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function abortableSleep(ms, signal) {
    return new Promise((resolve) => {
      if (signal.aborted) return resolve();
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      signal.addEventListener("abort", done, { once: true });
    });
  }

  function mean(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function trimmedMean(values, trim = 0.1) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const cut = Math.floor(sorted.length * trim);
    const kept = sorted.slice(cut, sorted.length - cut);
    return mean(kept.length ? kept : sorted);
  }

  function abortError() {
    const error = new Error("Aborted");
    error.name = "AbortError";
    return error;
  }

  function isAbortError(error) {
    return Boolean(error) && error.name === "AbortError";
  }

  function formatSpeed(value) {
    if (!Number.isFinite(value) || value <= 0) return "0.00";
    if (value < 10) return value.toFixed(2);
    if (value < 100) return value.toFixed(1);
    return value.toFixed(0);
  }

  function formatTick(value) {
    if (value >= 1000) {
      const k = value / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return String(Math.round(value));
  }

  function formatDate(date, lang) {
    try {
      return new Intl.DateTimeFormat(
        lang === "fa" ? "fa-IR-u-nu-latn" : "en-GB",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      ).format(date);
    } catch {
      return date.toISOString();
    }
  }

  /* ── Personal record (best download run, kept per device) ────── */

  const RECORD_KEY = "netgauge-record";

  function readRecord() {
    try {
      const raw = JSON.parse(localStorage.getItem(RECORD_KEY) || "null");
      if (
        raw &&
        Number.isFinite(raw.dl) &&
        Number.isFinite(raw.ul) &&
        Number.isFinite(raw.ts)
      ) {
        return raw;
      }
    } catch {
      /* a corrupt entry simply counts as no record */
    }
    return null;
  }

  function updateRecord(result) {
    const prev = readRecord();
    if (prev && result.download <= prev.dl + 0.05) return;
    try {
      localStorage.setItem(
        RECORD_KEY,
        JSON.stringify({ dl: result.download, ul: result.upload, ts: Date.now() }),
      );
    } catch {
      /* storage may be unavailable; rendering still shows this session */
      return;
    }
    renderRecord();
  }

  // Calendar-aware day key so "today/yesterday" also works across Jalali
  // month boundaries and DST shifts.
  function dayKey(date, calendar) {
    const locale =
      calendar === "persian"
        ? "fa-IR-u-ca-persian-nu-latn"
        : "en-US-u-ca-gregory";
    const parts = {};
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(date)
      .forEach((part) => {
        if (part.type !== "literal") parts[part.type] = part.value;
      });
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function recordDateText(ts) {
    const date = new Date(ts);
    const isFa = state.lang === "fa";
    const calendar = isFa ? "persian" : "gregory";
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const clock = new Intl.DateTimeFormat(
      isFa ? "fa-IR-u-nu-latn" : "en-US",
      { hour: isFa ? "2-digit" : "numeric", minute: "2-digit", hour12: !isFa },
    ).format(date);

    let prefix = "";
    if (dayKey(date, calendar) === dayKey(now, calendar)) {
      prefix = t("today");
    } else if (dayKey(date, calendar) === dayKey(yesterday, calendar)) {
      prefix = t("yesterday");
    }

    const day = isFa
      ? new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date)
      : new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(date);

    const stamp = `${day} · ${clock}`;
    return prefix ? `${prefix} · ${stamp}` : stamp;
  }

  function renderRecord() {
    const record = readRecord();
    els.recordChip.dataset.empty = String(!record);
    if (!record) {
      els.recordVals.textContent = "—";
      els.recordDate.textContent = t("recordHint");
      return;
    }
    els.recordVals.textContent = `↓ ${formatSpeed(record.dl)} · ↑ ${formatSpeed(record.ul)}`;
    els.recordDate.textContent = recordDateText(record.ts);
  }

  function decodeSafe(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function randomBuffer(bytes) {
    const buffer = new Uint8Array(bytes);
    const chunk = 65536;
    for (let offset = 0; offset < bytes; offset += chunk) {
      crypto.getRandomValues(
        buffer.subarray(offset, Math.min(offset + chunk, bytes)),
      );
    }
    return buffer;
  }

  function withAlpha(color, alpha) {
    const value = String(color).trim();
    if (value.startsWith("#")) {
      const hex = value.slice(1);
      const full =
        hex.length === 3
          ? hex
              .split("")
              .map((c) => c + c)
              .join("")
          : hex;
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      if ([r, g, b].every(Number.isFinite))
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const parts = match[1]
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number);
      if (parts.length >= 3)
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
    return value;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3600);
  }

  /* ══════════════════════════════════════════════════════════════
     Sparkline chart
     ══════════════════════════════════════════════════════════════ */

  const chart = (() => {
    const canvas = els.sparkline;
    const ctx = canvas.getContext("2d");
    const MAX_SAMPLES = 140;
    let samples = [];
    let tone = "download";
    let max = 100;

    function toneColor(p) {
      if (tone === "latency") return p.latency;
      if (tone === "upload") return p.upload;
      return p.accent;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    // Two passes of a [1,2,3,2,1] kernel: raw 120 ms samples are noisy and a
    // single pass still leaves visible corners between points.
    function smoothSeries(values) {
      if (values.length < 3) return values.slice();
      let out = values.slice();
      for (let pass = 0; pass < 2; pass += 1) {
        const src = out.slice();
        for (let i = 0; i < src.length; i += 1) {
          let sum = 0;
          let weight = 0;
          for (let k = -2; k <= 2; k += 1) {
            const j = i + k;
            if (j < 0 || j >= src.length) continue;
            const w = 3 - Math.abs(k);
            sum += src[j] * w;
            weight += w;
          }
          out[i] = sum / weight;
        }
      }
      return out;
    }

    function trace(points) {
      ctx.lineTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length - 1; i += 1) {
        const xc = (points[i][0] + points[i + 1][0]) / 2;
        const yc = (points[i][1] + points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last[0], last[1]);
    }

    function draw() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const p = palette();
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = p.chartGrid;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i += 1) {
        const y = Math.round((height * i) / 3) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (samples.length < 2) return;

      const color = toneColor(p);
      const step = width / (MAX_SAMPLES - 1);
      const top = 5;
      const floor = height - 3;
      const yFor = (value) =>
        floor - Math.min(Math.max(value, 0) / max, 1) * (floor - top);

      const smoothed = smoothSeries(samples);
      const points = smoothed.map((value, index) => [
        index * step,
        yFor(value),
      ]);

      const gradient = ctx.createLinearGradient(0, top, 0, height);
      gradient.addColorStop(0, withAlpha(color, 0.26));
      gradient.addColorStop(1, withAlpha(color, 0));

      ctx.beginPath();
      ctx.moveTo(points[0][0], floor);
      trace(points);
      ctx.lineTo(points[points.length - 1][0], floor);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      trace(points);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = withAlpha(color, 0.45);
      ctx.shadowBlur = 7;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const [lx, ly] = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(lx, ly, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function push(value) {
      samples.push(Math.max(0, value));
      if (samples.length > MAX_SAMPLES) samples.shift();
      draw();
    }

    function reset() {
      samples = [];
      draw();
    }

    function setMax(value) {
      if (value > 0) max = value;
    }

    function setTone(value) {
      tone = value;
      draw();
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(canvas);
    }
    window.addEventListener("resize", resize);
    resize();

    return { push, reset, setMax, setTone, refresh: draw };
  })();

  /* ══════════════════════════════════════════════════════════════
     Gauge
     ══════════════════════════════════════════════════════════════ */

  const gauge = (() => {
    const NS = "http://www.w3.org/2000/svg";
    const CENTER = { x: 220, y: 215 };
    const RADIUS = 158;
    const START = 150;
    const SWEEP = 240;
    const TIERS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

    let max = 10;
    let display = 0;
    let target = 0;
    let progress = 0; // eased needle position, 0–1 of the current scale
    let raf = 0;
    let lastFrame = 0;
    let overCount = 0;
    let fadeTimer = 0;

    const polar = (deg, radius) => {
      const rad = (deg * Math.PI) / 180;
      return [
        CENTER.x + radius * Math.cos(rad),
        CENTER.y + radius * Math.sin(rad),
      ];
    };

    function updateScaleLabel() {
      els.scaleLabel.textContent = `SCALE · 0–${formatTick(max)}`;
    }

    function buildTicks(fade) {
      const render = () => {
        els.gaugeTicks.textContent = "";
        els.gaugeLabels.textContent = "";
        const divisions = max % 10 === 0 ? 10 : 5;
        const minorsPerDivision = 5;
        const total = divisions * minorsPerDivision;

        for (let i = 0; i <= total; i += 1) {
          const major = i % minorsPerDivision === 0;
          const angle = START + (SWEEP * i) / total;
          const [x1, y1] = polar(angle, RADIUS - 1);
          const [x2, y2] = polar(angle, RADIUS - (major ? 17 : 9));
          const line = document.createElementNS(NS, "line");
          line.setAttribute("x1", x1.toFixed(2));
          line.setAttribute("y1", y1.toFixed(2));
          line.setAttribute("x2", x2.toFixed(2));
          line.setAttribute("y2", y2.toFixed(2));
          line.setAttribute("class", major ? "gauge-tick major" : "gauge-tick");
          els.gaugeTicks.appendChild(line);
        }

        for (let d = 0; d <= divisions; d += 1) {
          const value = (max * d) / divisions;
          const angle = START + (SWEEP * d) / divisions;
          const [x, y] = polar(angle, RADIUS - 36);
          const text = document.createElementNS(NS, "text");
          text.setAttribute("x", x.toFixed(2));
          text.setAttribute("y", (y + 4).toFixed(2));
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("class", "gauge-label");
          text.textContent = formatTick(value);
          els.gaugeLabels.appendChild(text);
        }

        updateScaleLabel();
      };

      clearTimeout(fadeTimer);
      // The new scale is cross-faded instead of popping: numbers changing
      // mid-test must read as a re-range, not as a glitch.
      if (!fade) {
        els.gaugeTicks.style.opacity = "1";
        els.gaugeLabels.style.opacity = "1";
        render();
        return;
      }
      els.gaugeTicks.style.opacity = "0";
      els.gaugeLabels.style.opacity = "0";
      fadeTimer = setTimeout(() => {
        render();
        els.gaugeTicks.style.opacity = "1";
        els.gaugeLabels.style.opacity = "1";
      }, 150);
    }

    function fitTier(value) {
      return (
        TIERS.find((tier) => tier >= value * 1.12) || TIERS[TIERS.length - 1]
      );
    }

    // The coloured speed bands never re-range with the scale: they are a fixed
    // backdrop and the needle is the only moving part on this face.
    function buildBands() {
      if (!els.gaugeBands) return;
      els.gaugeBands.textContent = "";
      const count = BAND_COLORS.length;
      const gap = 2.6;
      for (let i = 0; i < count; i += 1) {
        const from = START + (SWEEP * i) / count + gap / 2;
        const to = START + (SWEEP * (i + 1)) / count - gap / 2;
        const [x1, y1] = polar(from, RADIUS);
        const [x2, y2] = polar(to, RADIUS);
        const path = document.createElementNS(NS, "path");
        path.setAttribute(
          "d",
          `M${x1.toFixed(2)} ${y1.toFixed(2)} A${RADIUS} ${RADIUS} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        );
        path.setAttribute("class", "gauge-band");
        path.style.stroke = BAND_COLORS[i];
        els.gaugeBands.appendChild(path);
      }
    }

    function setMax(value) {
      const next = fitTier(value);
      if (next !== max) {
        max = next;
        buildTicks(true);
      }
    }

    function setTarget(value) {
      target = Number.isFinite(value) && value > 0 ? value : 0;
      // One stray spike shouldn't re-range the whole dial: wait a full second
      // above the scale before re-ranging once.
      if (target > max * 0.95) {
        overCount += 1;
        if (overCount >= 8) {
          overCount = 0;
          setMax(target);
        }
      } else {
        overCount = 0;
      }
      kick();
    }

    function goalProgress() {
      return max > 0 ? Math.max(0, Math.min(display / max, 1)) : 0;
    }

    function draw() {
      const angle = START + 90 + SWEEP * progress;
      els.needle.setAttribute(
        "transform",
        `rotate(${angle.toFixed(2)} ${CENTER.x} ${CENTER.y})`,
      );
      els.arcLive.style.strokeDashoffset = String(100 - progress * 100);
      // Round linecaps paint a dot even at zero length; hide the arc when idle.
      els.arcLive.style.opacity = progress > 0.001 ? "1" : "0";
      els.speedValue.textContent = formatSpeed(display);
    }

    function tick(now) {
      raf = 0;
      // Time-based easing keeps the motion identical at 60/120/144 Hz.
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 1 / 60;
      lastFrame = now;
      const valueStep = 1 - Math.exp(-dt / 0.2);
      display += (target - display) * valueStep;
      // The needle tracks the readout's own fraction of the scale. Easing the
      // position itself (instead of a second copy of the scale) means a
      // re-range glides to the new fraction and can never overshoot to the
      // end of the dial and swing back.
      const goal = goalProgress();
      progress += (goal - progress) * valueStep;

      if (
        Math.abs(target - display) < 0.01 &&
        Math.abs(goal - progress) < 0.001
      ) {
        display = target;
        progress = goal;
        lastFrame = 0;
        draw();
        return;
      }

      draw();
      raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function reset(nextMax = 10) {
      if (nextMax !== max) {
        max = nextMax;
        buildTicks(false);
      }
      display = 0;
      target = 0;
      progress = 0;
      overCount = 0;
      lastFrame = 0;
      draw();
    }

    function showValue(value) {
      const safeValue = Number.isFinite(value) ? value : 0;
      let fitted = max;
      // Only re-range at the finish line when the result clearly belongs to a
      // different class than the live scale — never for a borderline sample.
      if (safeValue > max) fitted = fitTier(safeValue);
      else if (safeValue > 0 && safeValue < max / 3) fitted = fitTier(safeValue);
      if (fitted !== max) {
        max = fitted;
        buildTicks(true);
      }
      target = safeValue;
      lastFrame = 0;
      kick();
    }

    buildBands();
    buildTicks(false);
    draw();

    return {
      setTarget,
      reset,
      showValue,
      updateScaleLabel,
      get max() {
        return max;
      },
    };
  })();

  /* ══════════════════════════════════════════════════════════════
     Connection info
     ══════════════════════════════════════════════════════════════ */

  function captureConnection(response) {
    try {
      const headers = response.headers;
      const ip = headers.get("cf-meta-ip");
      const colo = headers.get("cf-meta-colo");
      const city = headers.get("cf-meta-city");
      const country = headers.get("cf-meta-country");
      const asn = headers.get("cf-meta-asn");
      const ray = headers.get("cf-ray");
      if (ip) state.info.ip = ip;
      if (city) state.info.city = decodeSafe(city);
      if (country) state.info.country = decodeSafe(country);
      if (asn) state.info.asn = asn;
      if (colo) {
        state.info.colo = colo;
      } else if (ray) {
        const code = ray.split("-").pop();
        if (/^[A-Z]{3}$/.test(code)) state.info.colo = code;
      }
      renderMeta();
    } catch {
      /* headers are optional */
    }
  }

  function renderMeta() {
    const info = state.info;
    els.metaIp.textContent = info.ip || "—";
    els.metaIsp.textContent = info.isp || "—";
    els.metaIsp.title = info.isp || "";
    const place = [info.city, info.countryName || info.country]
      .filter(Boolean)
      .join(", ");
    els.metaLocation.textContent = place || "—";
    els.metaEdge.textContent = info.colo
      ? `Cloudflare · ${info.colo}`
      : "Cloudflare";
  }

  function updateConnChip() {
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (!conn) return;
    const parts = [];
    if (conn.effectiveType)
      parts.push(String(conn.effectiveType).toUpperCase());
    if (conn.type && conn.type !== "unknown")
      parts.push(String(conn.type).toUpperCase());
    if (!parts.length) return;
    els.connChipText.textContent = parts.join(" · ");
    els.connChip.hidden = false;
  }

  async function loadConnectionInfo() {
    updateConnChip();

    const headerProbe = (async () => {
      const request = new AbortController();
      const timer = setTimeout(() => request.abort(), 6000);
      try {
        const response = await fetch(CF_DOWN(0), {
          cache: "no-store",
          signal: request.signal,
        });
        if (response.ok) {
          captureConnection(response);
          response.body?.cancel().catch(() => {});
        }
      } catch {
        /* best effort */
      } finally {
        clearTimeout(timer);
      }
    })();

    // Stagger the probes: some VPNs and ad-blockers drop a burst of parallel
    // third-party calls, but one of the four sources is usually enough.
    await sleep(140);

    const ipwhoProbe = (async () => {
      const request = new AbortController();
      const timer = setTimeout(() => request.abort(), 5000);
      try {
        const response = await fetch(IP_API, {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!data || data.success === false) return;
        if (data.connection) {
          const isp = data.connection.isp || data.connection.org;
          if (isp) state.info.isp = isp;
          if (data.connection.asn && !state.info.asn)
            state.info.asn = String(data.connection.asn);
        }
        if (!state.info.ip && data.ip) state.info.ip = data.ip;
        if (!state.info.city && data.city) state.info.city = data.city;
        if (!state.info.countryName && data.country)
          state.info.countryName = data.country;
      } catch {
        /* best effort */
      } finally {
        clearTimeout(timer);
      }
    })();

    await sleep(140);

    const geoProbe = (async () => {
      const request = new AbortController();
      const timer = setTimeout(() => request.abort(), 5000);
      try {
        const response = await fetch(GEO_API, {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!state.info.ip && data.ip) state.info.ip = data.ip;
        if (!state.info.isp) {
          const isp = data.organization_name || data.organization;
          if (isp) state.info.isp = isp;
        }
        if (!state.info.city && data.city) state.info.city = data.city;
        if (!state.info.countryName && data.country)
          state.info.countryName = data.country;
      } catch {
        /* best effort */
      } finally {
        clearTimeout(timer);
      }
    })();

    await sleep(140);

    const traceProbe = (async () => {
      const request = new AbortController();
      const timer = setTimeout(() => request.abort(), 5000);
      try {
        const response = await fetch(TRACE_API, {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) return;
        const text = await response.text();
        const fields = {};
        text.split("\n").forEach((line) => {
          const split = line.indexOf("=");
          if (split > 0)
            fields[line.slice(0, split)] = line.slice(split + 1).trim();
        });
        if (fields.colo && /^[A-Z]{3}$/.test(fields.colo))
          state.info.colo = fields.colo;
        if (fields.ip && !state.info.ip) state.info.ip = fields.ip;
        if (fields.loc && !state.info.country) state.info.country = fields.loc;
      } catch {
        /* best effort */
      } finally {
        clearTimeout(timer);
      }
    })();

    await Promise.allSettled([headerProbe, ipwhoProbe, geoProbe, traceProbe]);
    renderMeta();
  }

  /* ══════════════════════════════════════════════════════════════
     Measurement engine
     ══════════════════════════════════════════════════════════════ */

  async function measureLatency(signal, onSample) {
    const samples = [];
    let failed = 0;
    const total = CONFIG.latencySamples;

    for (let i = 0; i < total; i += 1) {
      if (signal.aborted) break;

      const request = new AbortController();
      const timeout = setTimeout(
        () => request.abort(),
        CONFIG.latencyTimeoutMs,
      );
      const relay = () => request.abort();
      signal.addEventListener("abort", relay, { once: true });

      // Time to first byte, not whole-body time: a body that is delayed after
      // the headers would otherwise be counted as latency.
      const started = performance.now();
      try {
        const response = await fetch(CF_DOWN(0), {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const rtt = performance.now() - started;
        captureConnection(response);
        response.body?.cancel().catch(() => {});
        samples.push(rtt);
        onSample?.(i + 1, total, rtt);
      } catch {
        if (signal.aborted) break;
        failed += 1;
        onSample?.(i + 1, total, null);
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener("abort", relay);
      }

      await abortableSleep(CONFIG.latencyGapMs, signal);
    }

    if (!samples.length) return null;

    let diffSum = 0;
    for (let i = 1; i < samples.length; i += 1) {
      diffSum += Math.abs(samples[i] - samples[i - 1]);
    }

    return {
      avg: mean(samples),
      min: Math.min(...samples),
      jitter: samples.length > 1 ? diffSum / (samples.length - 1) : 0,
      loss: (failed / total) * 100,
      count: samples.length,
    };
  }

  async function downloadWorker(agg, signal) {
    let consecutiveErrors = 0;

    while (!signal.aborted) {
      try {
        const response = await fetch(CF_DOWN(CONFIG.downloadChunkBytes), {
          cache: "no-store",
          signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        if (!response.body) {
          const buffer = await response.arrayBuffer();
          agg.bytes += buffer.byteLength;
        } else {
          const reader = response.body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            agg.bytes += value.byteLength;
            if (signal.aborted) {
              try {
                await reader.cancel();
              } catch {
                /* ignore */
              }
              break;
            }
          }
        }
        consecutiveErrors = 0;
      } catch {
        if (signal.aborted) return;
        agg.errors += 1;
        consecutiveErrors += 1;
        if (consecutiveErrors >= 3) return;
        await sleep(150);
      }
    }
  }

  // Feeds bytes into 500 ms rate windows and stops when the windows agree:
  // the line has reached its sustained speed instead of a single lucky sample.
  async function measureRate(signal, agg, options) {
    const { warmupMs, minMs, maxMs, capBytes, onSpeed, bail } = options;

    await abortableSleep(warmupMs, signal);
    if (signal.aborted) return null;

    const startedAt = performance.now();
    const startBytes = agg.bytes;
    const points = [{ t: startedAt, bytes: startBytes }];
    const windows = [];
    let windowAnchor = { t: startedAt, bytes: startBytes };
    let settled = false;

    while (!signal.aborted) {
      await abortableSleep(CONFIG.sampleMs, signal);
      if (signal.aborted) break;

      const now = performance.now();
      const totalBytes = agg.bytes;
      const elapsed = now - startedAt;

      points.push({ t: now, bytes: totalBytes });
      while (points.length > 2 && now - points[0].t > CONFIG.speedWindowMs) {
        points.shift();
      }

      if (now - windowAnchor.t >= CONFIG.plateauWindowMs) {
        const rate =
          ((totalBytes - windowAnchor.bytes) * 8) /
          ((now - windowAnchor.t) * 1000);
        windowAnchor = { t: now, bytes: totalBytes };
        windows.push(rate);
        if (windows.length > 40) windows.shift();

        if (elapsed >= minMs && windows.length >= CONFIG.plateauSamples) {
          const recent = windows.slice(-CONFIG.plateauSamples);
          const avg = mean(recent);
          if (avg > 0.05) {
            const variance = mean(recent.map((value) => (value - avg) ** 2));
            if (Math.sqrt(variance) / avg <= CONFIG.plateauTolerance) {
              settled = true;
            }
          }
        }
      }

      const oldest = points[0];
      const span = now - oldest.t;
      if (span >= 300) {
        onSpeed?.(((totalBytes - oldest.bytes) * 8) / (span * 1000));
      }

      if (settled) break;
      if (elapsed >= maxMs) break;
      if (bail?.({ elapsed, bytes: totalBytes - startBytes })) break;
      if (
        elapsed >= CONFIG.capGraceMs &&
        totalBytes - startBytes >= capBytes
      ) {
        break;
      }
    }

    const elapsed = performance.now() - startedAt;
    const totalBytes = agg.bytes - startBytes;
    let speed = 0;

    if (windows.length) {
      const tail = windows.slice(
        -Math.min(windows.length, CONFIG.plateauSamples + 1),
      );
      speed = trimmedMean(tail, 0.1);
    }
    if (!(speed > 0) && elapsed > 0) {
      speed = (totalBytes * 8) / (elapsed * 1000);
    }

    return {
      speed,
      bytes: totalBytes,
      elapsedMs: elapsed,
      settled,
      windowCount: windows.length,
    };
  }

  async function measureDownload(signal, onSpeed) {
    const agg = { bytes: 0, errors: 0 };
    const inner = new AbortController();
    const relay = () => inner.abort();
    signal.addEventListener("abort", relay, { once: true });

    const workers = Array.from({ length: CONFIG.downloadStreams }, () =>
      downloadWorker(agg, inner.signal),
    );

    let result = null;
    try {
      result = await measureRate(signal, agg, {
        warmupMs: CONFIG.downloadWarmupMs,
        minMs: CONFIG.downloadMinMs,
        maxMs: CONFIG.downloadMaxMs,
        capBytes: CONFIG.downloadCapBytes,
        onSpeed,
        // Every stream already gave up: fail now instead of leaving the dial
        // spinning for the full window.
        bail: ({ elapsed, bytes }) =>
          bytes === 0 &&
          elapsed >= 2500 &&
          agg.errors >= CONFIG.downloadStreams * 2,
      });
    } finally {
      inner.abort();
      await Promise.allSettled(workers);
      signal.removeEventListener("abort", relay);
    }

    if (signal.aborted) return null;
    if (!result || !(result.bytes > 0) || !(result.speed > 0)) {
      throw new Error("DOWNLOAD_FAILED");
    }
    return result;
  }

  const uploadBodies = new Map();

  function uploadBody(bytes) {
    let body = uploadBodies.get(bytes);
    if (!body) {
      body = randomBuffer(bytes);
      uploadBodies.set(bytes, body);
      if (uploadBodies.size > 6) {
        const oldest = uploadBodies.keys().next().value;
        if (oldest !== bytes) uploadBodies.delete(oldest);
      }
    }
    return body;
  }

  function uploadWorker(agg, signal) {
    return new Promise((resolve) => {
      let chunkBytes = CONFIG.uploadChunkBytes;
      let errors = 0;
      let settled = false;
      let xhr = null;

      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      const onAbort = () => {
        try {
          xhr?.abort();
        } catch {
          /* ignore */
        }
        finish();
      };
      signal.addEventListener("abort", onAbort, { once: true });

      const send = () => {
        if (settled || signal.aborted) return finish();

        xhr = new XMLHttpRequest();
        const sentAt = performance.now();
        let lastLoaded = 0;

        xhr.open("POST", CF_UP, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.timeout = 25000;

        xhr.upload.onprogress = (event) => {
          const delta = event.loaded - lastLoaded;
          lastLoaded = event.loaded;
          if (delta > 0) agg.bytes += delta;
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 400) {
            // Size the next body for ~1.4 s at the rate just observed: tiny
            // requests waste round trips, huge ones stall slow uplinks.
            const seconds = Math.max((performance.now() - sentAt) / 1000, 0.05);
            const mbps = (chunkBytes * 8) / (seconds * 1000);
            agg.rateEma =
              agg.rateEma == null ? mbps : agg.rateEma + (mbps - agg.rateEma) * 0.4;
            const target = (agg.rateEma * CONFIG.uploadTargetMs) / 8000;
            chunkBytes = Math.round(
              Math.min(
                CONFIG.uploadMaxChunkBytes,
                Math.max(CONFIG.uploadChunkBytes, target),
              ),
            );
            errors = 0;
            send();
          } else {
            errors += 1;
            agg.errors += 1;
            if (errors <= 4 && !signal.aborted) send();
            else finish();
          }
        };

        xhr.onerror = xhr.ontimeout = () => {
          errors += 1;
          agg.errors += 1;
          if (errors <= 4 && !signal.aborted) send();
          else finish();
        };

        try {
          xhr.send(uploadBody(chunkBytes));
        } catch {
          errors += 1;
          agg.errors += 1;
          if (errors <= 4 && !signal.aborted) send();
          else finish();
        }
      };

      send();
    });
  }

  async function measureUpload(signal, onSpeed) {
    const agg = { bytes: 0, errors: 0, rateEma: null };
    const inner = new AbortController();
    const relay = () => inner.abort();
    signal.addEventListener("abort", relay, { once: true });

    const workers = Array.from({ length: CONFIG.uploadStreams }, () =>
      uploadWorker(agg, inner.signal),
    );

    let result = null;
    try {
      result = await measureRate(signal, agg, {
        warmupMs: CONFIG.uploadWarmupMs,
        minMs: CONFIG.uploadMinMs,
        maxMs: CONFIG.uploadMaxMs,
        capBytes: CONFIG.uploadCapBytes,
        // Progress is reported per request; a gap means "waiting", not a
        // real zero, so the dial holds instead of dipping.
        onSpeed: (value) => {
          if (value > 0) onSpeed?.(value);
        },
        bail: ({ elapsed, bytes }) =>
          bytes === 0 &&
          elapsed >= 2000 &&
          agg.errors >= CONFIG.uploadStreams * 2,
      });
    } finally {
      inner.abort();
      await Promise.allSettled(workers);
      signal.removeEventListener("abort", relay);
    }

    if (signal.aborted) return null;
    return result || { speed: 0, bytes: 0 };
  }

  /* ══════════════════════════════════════════════════════════════
     UI state
     ══════════════════════════════════════════════════════════════ */

  function setPhase(phase) {
    state.phase = phase;
    els.console.dataset.phase = phase;
    els.phaseLabel.textContent = t(`phase_${phase}`);
  }

  function setStatDownload(value) {
    els.statDownload.textContent = value;
  }

  function setStatUpload(value) {
    els.statUpload.textContent = value;
  }

  function setStatPing(value) {
    els.statPing.textContent = value;
  }

  function setStatJitter(value) {
    els.statJitter.textContent = value;
  }

  function setStatLoss(value) {
    els.statLoss.textContent = value;
  }

  function resetStats() {
    setStatDownload("—");
    setStatUpload("—");
    setStatPing("—");
    setStatJitter("—");
    setStatLoss("—");
    els.statPing.removeAttribute("title");
  }

  function applyLang() {
    const dict = I18N[state.lang];
    els.html.lang = state.lang;
    els.html.dir = state.lang === "fa" ? "rtl" : "ltr";
    els.html.dataset.lang = state.lang;
    document.title = dict.pageTitle;

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (dict[key] != null) node.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      const key = node.getAttribute("data-i18n-aria");
      if (dict[key]) node.setAttribute("aria-label", dict[key]);
    });

    document.querySelectorAll("[data-lang-choice]").forEach((btn) => {
      const active = btn.dataset.langChoice === state.lang;
      btn.setAttribute("aria-pressed", String(active));
    });

    els.settingsBtn.setAttribute("aria-label", dict.settings);
    els.settingsPop.setAttribute("aria-label", dict.settings);
    syncModeUi();
    renderSwatches();
    syncGaugeState();
    syncHapticState();
    els.gaugeSlow.textContent = dict.gaugeSlow;
    els.gaugeFast.textContent = dict.gaugeFast;
    els.phaseLabel.textContent = dict[`phase_${state.phase}`] || "";
    els.startLabel.textContent = state.hasResult ? dict.restart : dict.start;
    gauge.updateScaleLabel();
    renderRecord();

    if (els.dialog.open && state.results) renderShareCard();
  }

  /* ── Theme + settings ────────────────────────────────────────── */

  function syncModeUi() {
    const isLight = state.mode === "light";
    els.themeSwitch.setAttribute("aria-checked", String(isLight));
    els.themeSwitch.setAttribute(
      "aria-label",
      t(isLight ? "switchToDark" : "switchToLight"),
    );
  }

  // Custom-property transitions mean palette() would read in-flight colors if
  // we repainted right away, freezing the chart on the previous theme.
  let canvasTimer = 0;
  function repaintCanvases() {
    clearTimeout(canvasTimer);
    canvasTimer = setTimeout(() => {
      chart.refresh();
      if (els.dialog.open && state.results) renderShareCard();
    }, 340);
  }

  function setMode(mode) {
    state.mode = mode === "light" ? "light" : "dark";
    els.html.dataset.mode = state.mode;
    try {
      localStorage.setItem("netgauge-mode", state.mode);
    } catch {
      /* ignore */
    }
    els.themeColor?.setAttribute(
      "content",
      state.mode === "light" ? "#EDF1F6" : "#080A0D",
    );
    syncModeUi();
    repaintCanvases();
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    state.theme = theme;
    els.html.dataset.theme = theme;
    try {
      localStorage.setItem("netgauge-theme", theme);
    } catch {
      /* ignore */
    }
    syncSwatchState();
    repaintCanvases();
  }

  function setGauge(gauge) {
    if (!GAUGES.includes(gauge)) return;
    state.gauge = gauge;
    els.html.dataset.gauge = gauge;
    try {
      localStorage.setItem("netgauge-gauge", gauge);
    } catch {
      /* ignore */
    }
    syncGaugeState();
  }

  function syncGaugeState() {
    const dict = I18N[state.lang];
    els.gaugeStyleBox
      .querySelectorAll("[data-gauge-choice]")
      .forEach((btn) => {
        const choice = btn.dataset.gaugeChoice;
        btn.setAttribute("aria-checked", String(choice === state.gauge));
        btn.setAttribute(
          "aria-label",
          dict[`gauge_${choice}`] != null ? dict[`gauge_${choice}`] : choice,
        );
      });
  }

  function syncSwatchState() {
    els.themeSwatches
      .querySelectorAll("[data-theme-choice]")
      .forEach((btn) => {
        btn.setAttribute(
          "aria-checked",
          String(btn.dataset.themeChoice === state.theme),
        );
      });
  }

  function setHaptic(level) {
    if (!HAPTICS.includes(level)) return;
    state.haptic = level;
    try {
      localStorage.setItem("netgauge-haptic", level);
    } catch {
      /* ignore */
    }
    syncHapticState();
    // Preview the chosen strength immediately so the picker explains itself.
    hapticPulse(level);
  }

  function syncHapticState() {
    if (!els.hapticSeg) return;
    els.hapticSeg.querySelectorAll("[data-haptic-choice]").forEach((btn) => {
      btn.setAttribute(
        "aria-checked",
        String(btn.dataset.hapticChoice === state.haptic),
      );
    });
  }

  function setLang(lang) {
    state.lang = lang === "en" ? "en" : "fa";
    try {
      localStorage.setItem("netgauge-lang", state.lang);
    } catch {
      /* ignore */
    }
    applyLang();
  }

  function renderSwatches() {
    const box = els.themeSwatches;
    if (!box) return;
    box.textContent = "";
    THEMES.forEach((name) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch";
      btn.dataset.themeChoice = name;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(name === state.theme));
      btn.setAttribute("aria-label", t(`theme_${name}`));
      const dot = document.createElement("span");
      dot.className = "swatch-dot";
      dot.style.setProperty("--sw", THEME_SWATCH[name]);
      const label = document.createElement("span");
      label.textContent = t(`theme_${name}`);
      btn.append(dot, label);
      box.appendChild(btn);
    });
  }

  function setSettingsOpen(open) {
    els.settingsPop.dataset.open = open ? "true" : "false";
    els.settingsBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      const active = els.settingsPop.querySelector(
        '.seg-btn[aria-pressed="true"]',
      );
      active?.focus({ preventScroll: true });
    }
  }

  function settingsIsOpen() {
    return els.settingsPop.dataset.open === "true";
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function fadeIn(el) {
    if (reduceMotion.matches) return;
    el.animate(
      [
        { opacity: 0, transform: "translateY(5px) scale(0.98)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }

  // Buttons appear/disappear in steps, never in continuous sizes, so the row
  // height is animated separately to absorb the jump of the layout below it.
  function animateControlsHeight(mutate) {
    const box = els.controls;
    // Read the on-screen height first: canceling a running animation would
    // snap the box to its natural size and the restart would visibly jump.
    const from = box.getBoundingClientRect().height;
    box.getAnimations().forEach((anim) => anim.cancel());
    box.style.overflow = "";
    mutate();
    const to = box.offsetHeight;
    if (reduceMotion.matches || Math.abs(to - from) < 1) return;
    box.style.overflow = "hidden";
    const anim = box.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: 240,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
    anim.onfinish = () => {
      box.style.overflow = "";
    };
  }

  // Keep a sliver of width: a negative outer width lets the flex item hop up
  // beside the full-width start button, which makes the row collapse for one
  // painted frame before the swap.
  const SHARE_COLLAPSED = {
    maxWidth: "4px",
    paddingInline: "0px",
    borderWidth: "0px",
    marginInlineStart: "0px",
    opacity: 0,
    transform: "translateY(5px) scale(0.96)",
  };

  function shareSettled() {
    const btn = els.shareBtn;
    const style = getComputedStyle(btn);
    return {
      maxWidth: `${btn.offsetWidth}px`,
      paddingInline: style.paddingInlineStart,
      borderWidth: style.borderTopWidth,
      marginInlineStart: "0px",
      opacity: 1,
      transform: "none",
    };
  }

  // display:none can't transition, so the button's own box collapses first and
  // only then leaves the layout.
  function collapseShare(done) {
    const btn = els.shareBtn;
    btn.getAnimations().forEach((anim) => anim.cancel());
    btn.style.overflow = "hidden";
    const anim = btn.animate([shareSettled(), SHARE_COLLAPSED], {
      duration: 180,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards",
    });
    anim.onfinish = () => {
      anim.cancel();
      btn.style.overflow = "";
      done();
    };
  }

  function expandShare(width) {
    const btn = els.shareBtn;
    btn.getAnimations().forEach((anim) => anim.cancel());
    btn.style.overflow = "hidden";
    const anim = btn.animate(
      [SHARE_COLLAPSED, { ...shareSettled(), maxWidth: `${width}px` }],
      { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    anim.onfinish = () => {
      btn.style.overflow = "";
    };
  }

  // Each transition mutates all three buttons in one go, so the row height is
  // animated exactly once and nothing snaps when the layout re-wraps.
  function transitionControls(running) {
    const start = els.startBtn;
    const stop = els.stopBtn;
    const share = els.shareBtn;

    if (running) {
      const swap = () => {
        animateControlsHeight(() => {
          share.classList.add("hidden");
          start.classList.add("hidden");
          stop.classList.remove("hidden");
        });
        fadeIn(stop);
      };
      // Let the result button leave at its own size; swapping the main control
      // mid-collapse would reflow it and pop its width in half.
      if (!share.classList.contains("hidden") && !reduceMotion.matches) {
        collapseShare(swap);
      } else {
        swap();
      }
      return;
    }

    let shareWidth = 0;
    animateControlsHeight(() => {
      start.classList.remove("hidden");
      stop.classList.add("hidden");
      share.classList.toggle("hidden", !state.hasResult);
      if (state.hasResult) shareWidth = share.offsetWidth;
    });
    fadeIn(start);
    if (state.hasResult && shareWidth) expandShare(shareWidth);
  }

  function refreshResultUi() {
    els.startLabel.textContent = state.hasResult ? t("restart") : t("start");
  }

  /* ══════════════════════════════════════════════════════════════
     Test orchestration
     ══════════════════════════════════════════════════════════════ */

  function createSpeedFeed(onValue) {
    const buffer = [];
    let smoothed = null;
    return (value) => {
      buffer.push(value);
      if (buffer.length > 8) buffer.shift();
      let robust;
      if (buffer.length < 5) {
        // Too few samples for a trim to bite: the median shrugs off a single
        // burst window that would otherwise peg the needle on the first tick.
        const sorted = [...buffer].sort((a, b) => a - b);
        robust = sorted[Math.floor(sorted.length / 2)];
      } else {
        robust = trimmedMean(buffer, 0.15);
      }
      // A single oversized window (connection buffering, warm-up burst) must
      // not drag the needle to the end of the dial: cap each step relative to
      // the value already on screen.
      const ceiling = smoothed == null ? Infinity : smoothed * 3 + 5;
      const bounded = Math.min(robust, ceiling);
      smoothed =
        smoothed == null ? bounded : smoothed + (bounded - smoothed) * 0.3;
      chart.push(value);
      onValue?.(smoothed);
      // The first windows of a run are the least trustworthy; hold the dial
      // until three have landed.
      if (buffer.length < 3) return;
      gauge.setTarget(smoothed);
      chart.setMax(gauge.max);
    };
  }

  async function runTest() {
    if (state.running) return;

    if (navigator.onLine === false) {
      toast(t("errOffline"));
      return;
    }

    state.running = true;
    state.hasResult = false;
    state.results = null;

    const controller = new AbortController();
    abortController = controller;
    const signal = controller.signal;
    const startedAt = new Date();

    els.startBtn.disabled = true;
    els.startBtn.setAttribute("aria-busy", "true");

    transitionControls(true);
    resetStats();
    chart.reset();
    chart.setMax(10);
    setPhase("latency");
    chart.setTone("latency");
    // Keep the scale from the previous run: re-ranging from a fresh 0–10 at
    // every start is what made the ring numbers hop around.
    gauge.reset(gauge.max);

    try {
      const latency = await measureLatency(signal, (index, total, rtt) => {
        if (rtt != null) setStatPing(rtt.toFixed(0));
      });

      if (signal.aborted) throw abortError();

      if (latency) {
        setStatPing(latency.avg.toFixed(0));
        els.statPing.title = `min ${latency.min.toFixed(1)} ms · n=${latency.count}`;
        setStatJitter(latency.jitter.toFixed(1));
        setStatLoss(latency.loss.toFixed(1));
      }

      setPhase("download");
      chart.reset();
      chart.setMax(10);
      chart.setTone("download");
      gauge.reset(gauge.max);

      const download = await measureDownload(
        signal,
        createSpeedFeed((value) => setStatDownload(formatSpeed(value))),
      );

      if (signal.aborted) throw abortError();
      if (!download || download.speed < 0.01) throw new Error("DOWNLOAD_EMPTY");

      // Lock in the converged result; the live feed's last sample can be an
      // outlier and would otherwise sit in the stat for the whole upload phase.
      setStatDownload(formatSpeed(download.speed));

      setPhase("upload");
      chart.reset();
      chart.setMax(10);
      chart.setTone("upload");
      // Keep the dial where download ended; the needle glides into upload speed
      // instead of snapping to zero and leaving an empty arc.

      const upload = await measureUpload(
        signal,
        createSpeedFeed((value) => setStatUpload(formatSpeed(value))),
      );

      if (signal.aborted) throw abortError();

      setStatDownload(formatSpeed(download ? download.speed : 0));
      setStatUpload(formatSpeed(upload ? upload.speed : 0));
      gauge.showValue(download ? download.speed : 0);

      state.results = {
        download: download ? download.speed : 0,
        upload: upload ? upload.speed : 0,
        ping: latency ? latency.avg : 0,
        pingMin: latency ? latency.min : 0,
        jitter: latency ? latency.jitter : 0,
        loss: latency ? latency.loss : 0,
        scale: gauge.max,
        info: { ...state.info },
        date: startedAt,
      };
      state.hasResult = true;
      updateRecord(state.results);

      setPhase("done");
      toast(t("doneToast"));
    } catch (error) {
      if (isAbortError(error)) {
        setPhase("idle");
        gauge.setTarget(0);
        toast(t("stoppedToast"));
      } else {
        console.error(error);
        setPhase("error");
        gauge.setTarget(0);
        toast(t("errNetwork"));
      }
    } finally {
      state.running = false;
      abortController = null;
      els.startBtn.disabled = false;
      els.startBtn.removeAttribute("aria-busy");
      refreshResultUi();
      transitionControls(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Share card
     ══════════════════════════════════════════════════════════════ */

  function renderShareCard() {
    const result = state.results;
    if (!result) return;

    const canvas = els.shareCanvas;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const lang = state.lang;
    const dict = I18N[lang];
    const isFa = lang === "fa";
    const download = result.download;
    const p = palette();
    const accent = p.accent;

    els.shareCanvas.setAttribute(
      "aria-label",
      `${dict.dlLabel} ${formatSpeed(download)} Mbps · ${dict.ulLabel} ${formatSpeed(result.upload)} Mbps · ` +
        `${dict.ping} ${result.ping ? result.ping.toFixed(0) : "—"} ms · ` +
        `${dict.jitter} ${result.jitter ? result.jitter.toFixed(1) : "—"} ms · ` +
        `${dict.loss} ${(result.loss || 0).toFixed(1)}%`,
    );

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    let glow = ctx.createRadialGradient(W / 2, 120, 0, W / 2, 120, 700);
    glow.addColorStop(0, withAlpha(accent, 0.1));
    glow.addColorStop(1, withAlpha(accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    glow = ctx.createRadialGradient(900, 1200, 0, 900, 1200, 520);
    glow.addColorStop(0, withAlpha(p.latency, 0.06));
    glow.addColorStop(1, withAlpha(p.latency, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = p.gridLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = p.lineStrong;
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    const corner = (x, y, dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * 34, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * 34);
      ctx.stroke();
    };
    corner(60, 60, 1, 1);
    corner(W - 60, 60, -1, 1);
    corner(60, H - 60, 1, -1);
    corner(W - 60, H - 60, -1, -1);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.direction = "ltr";
    ctx.fillStyle = accent;
    ctx.font = '700 36px "Chakra Petch", sans-serif';
    ctx.fillText("INTERNET SPEED", 96, 150);
    ctx.fillStyle = p.muted;
    ctx.font = isFa
      ? '500 20px "Vazirmatn", sans-serif'
      : '500 20px "IBM Plex Mono", monospace';
    ctx.fillText(isFa ? dict.brandTag : "SPEED TEST INSTRUMENT", 96, 186);

    ctx.strokeStyle = p.line;
    ctx.beginPath();
    ctx.moveTo(96, 214);
    ctx.lineTo(W - 96, 214);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.direction = isFa ? "rtl" : "ltr";
    ctx.fillStyle = p.text;
    ctx.font = isFa
      ? '700 44px "Vazirmatn", sans-serif'
      : '700 46px "Chakra Petch", sans-serif';
    ctx.fillText(dict.cardHeading, W / 2, 292);

    const cx = W / 2;
    const cy = 560;
    const radius = 250;
    const start = 150;
    const sweep = 240;
    const scaleMax = Math.max(result.scale || 100, download * 1.05);
    const progress = Math.max(0, Math.min(download / scaleMax, 1));
    const polar = (deg, rad) => [
      cx + rad * Math.cos((deg * Math.PI) / 180),
      cy + rad * Math.sin((deg * Math.PI) / 180),
    ];

    ctx.lineCap = "round";
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      radius,
      (start * Math.PI) / 180,
      ((start + sweep) * Math.PI) / 180,
    );
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.shadowColor = withAlpha(accent, 0.45);
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      radius,
      (start * Math.PI) / 180,
      ((start + sweep * progress) * Math.PI) / 180,
    );
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i <= 40; i += 1) {
      const major = i % 5 === 0;
      const angle = start + (sweep * i) / 40;
      const outer = radius - 34;
      const inner = outer - (major ? 26 : 12);
      const [x1, y1] = polar(angle, outer);
      const [x2, y2] = polar(angle, inner);
      ctx.strokeStyle = major ? p.tickStrong : p.lineStrong;
      ctx.lineWidth = major ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.fillStyle = p.muted;
    ctx.font = '500 22px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    const [x0, y0] = polar(start, radius - 96);
    ctx.fillText("0", x0, y0 + 6);
    const [xMax, yMax] = polar(start + sweep, radius - 96);
    ctx.fillText(String(Math.round(scaleMax)), xMax, yMax + 6);

    const angle = start + sweep * progress;
    const [tipX, tipY] = polar(angle, radius - 46);
    const [tailX, tailY] = polar(angle + 180, 26);
    ctx.strokeStyle = p.text;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.panel2;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.direction = "ltr";
    ctx.fillStyle = p.text;
    ctx.font = '600 132px "IBM Plex Mono", monospace';
    ctx.fillText(formatSpeed(download), W / 2, 880);
    ctx.fillStyle = p.muted;
    ctx.font = '500 26px "IBM Plex Mono", monospace';
    ctx.fillText("Mbps", W / 2, 926);
    ctx.fillStyle = p.accentText;
    ctx.font = isFa
      ? '600 26px "Vazirmatn", sans-serif'
      : '600 24px "IBM Plex Mono", monospace';
    ctx.direction = isFa ? "rtl" : "ltr";
    ctx.fillText(dict.dlLabel, W / 2, 976);

    ctx.strokeStyle = p.line;
    ctx.direction = "ltr";
    ctx.beginPath();
    ctx.moveTo(96, 1018);
    ctx.lineTo(W - 96, 1018);
    ctx.stroke();

    const columns = [
      {
        label: dict.ulLabel,
        value: formatSpeed(result.upload),
        unit: "Mbps",
        color: p.upload,
      },
      {
        label: dict.ping,
        value: result.ping ? result.ping.toFixed(0) : "—",
        unit: "ms",
        color: p.latency,
      },
      {
        label: dict.jitter,
        value: result.jitter ? result.jitter.toFixed(1) : "—",
        unit: "ms",
        color: p.text,
      },
      {
        label: dict.loss,
        value: result.loss ? result.loss.toFixed(1) : "0.0",
        unit: "%",
        color: p.danger,
      },
    ];
    const colWidth = (W - 192) / columns.length;

    columns.forEach((column, index) => {
      const x = 96 + colWidth * index + colWidth / 2;
      ctx.textAlign = "center";
      ctx.direction = isFa ? "rtl" : "ltr";
      ctx.fillStyle = p.muted;
      ctx.font = isFa
        ? '500 22px "Vazirmatn", sans-serif'
        : '500 20px "IBM Plex Mono", monospace';
      ctx.fillText(column.label, x, 1070);
      ctx.direction = "ltr";
      ctx.fillStyle = column.color;
      ctx.font = '600 42px "IBM Plex Mono", monospace';
      ctx.fillText(column.value, x, 1122);
      ctx.fillStyle = p.muted2;
      ctx.font = '500 18px "IBM Plex Mono", monospace';
      ctx.fillText(column.unit, x, 1150);
    });

    ctx.strokeStyle = p.line;
    ctx.beginPath();
    ctx.moveTo(96, 1186);
    ctx.lineTo(W - 96, 1186);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.direction = isFa ? "rtl" : "ltr";
    ctx.fillStyle = p.textSoft;
    ctx.font = isFa
      ? '500 26px "Vazirmatn", sans-serif'
      : '500 24px "IBM Plex Mono", monospace';
    const isp = result.info.isp || "—";
    ctx.fillText(isp.length > 52 ? `${isp.slice(0, 50)}…` : isp, W / 2, 1234);

    ctx.fillStyle = p.muted;
    ctx.font = isFa
      ? '400 21px "Vazirmatn", sans-serif'
      : '400 19px "IBM Plex Mono", monospace';
    const place =
      [result.info.city, result.info.countryName || result.info.country]
        .filter(Boolean)
        .join(", ") || "—";
    const edge = result.info.colo
      ? `Cloudflare · ${result.info.colo}`
      : "Cloudflare";
    ctx.fillText(`${place}  ·  ${edge}`, W / 2, 1270);

    ctx.fillStyle = p.muted2;
    ctx.font = '400 18px "IBM Plex Mono", monospace';
    ctx.direction = "ltr";
    ctx.fillText(formatDate(result.date, lang), W / 2, 1312);
  }

  function supportsFileShare() {
    if (!navigator.share || !navigator.canShare) return false;
    try {
      const probe = new File([new Blob()], "probe.png", { type: "image/png" });
      return navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  }

  async function openShare() {
    if (!state.results) return;
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
    renderShareCard();
    if (typeof els.dialog.showModal === "function") els.dialog.showModal();
    else els.dialog.setAttribute("open", "");
  }

  function downloadCard() {
    if (!state.results) return;
    els.shareCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `internet-speed-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");
  }

  async function shareCard() {
    if (!state.results) return;
    try {
      const blob = await new Promise((resolve) =>
        els.shareCanvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const file = new File([blob], "internet-speed.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("cardTitle"),
          text: `${formatSpeed(state.results.download)} Mbps ↓ · ${formatSpeed(
            state.results.upload,
          )} Mbps ↑ · ${state.results.ping.toFixed(0)} ms`,
        });
      } else {
        downloadCard();
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error(error);
      downloadCard();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Wiring
     ══════════════════════════════════════════════════════════════ */

  function init() {
    els.startBtn.addEventListener("click", runTest);
    els.stopBtn.addEventListener("click", () => {
      if (abortController) abortController.abort();
    });
    els.shareBtn.addEventListener("click", openShare);
    els.shareCloseBtn.addEventListener("click", () => els.dialog.close());
    els.shareDownloadBtn.addEventListener("click", downloadCard);
    els.shareNativeBtn.addEventListener("click", shareCard);

    els.themeSwitch.addEventListener("click", () => {
      setMode(state.mode === "light" ? "dark" : "light");
    });

    els.settingsBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      setSettingsOpen(!settingsIsOpen());
    });

    els.settingsPop.addEventListener("click", (event) => {
      const langBtn = event.target.closest("[data-lang-choice]");
      if (langBtn) {
        setLang(langBtn.dataset.langChoice);
        return;
      }
      const swatch = event.target.closest("[data-theme-choice]");
      if (swatch) {
        setTheme(swatch.dataset.themeChoice);
        return;
      }
      const gaugeChoice = event.target.closest("[data-gauge-choice]");
      if (gaugeChoice) {
        setGauge(gaugeChoice.dataset.gaugeChoice);
        return;
      }
      const hapticChoice = event.target.closest("[data-haptic-choice]");
      if (hapticChoice) setHaptic(hapticChoice.dataset.hapticChoice);
    });

    // Every button answers with the same pulse. pointerdown lands with the tap
    // itself (not after the click round-trip); detail === 0 marks keyboard
    // activation, which has no pointer event of its own.
    // Capture phase so buttons that stop propagation (the settings toggle)
    // still answer.
    document.addEventListener(
      "pointerdown",
      (event) => {
        const btn = event.target.closest("button");
        if (btn && !btn.disabled) hapticPulse(state.haptic);
      },
      { passive: true, capture: true },
    );
    document.addEventListener(
      "click",
      (event) => {
        if (event.detail !== 0) return;
        const btn = event.target.closest("button");
        if (btn && !btn.disabled) hapticPulse(state.haptic);
      },
      true,
    );

    document.addEventListener("click", (event) => {
      if (!settingsIsOpen()) return;
      // Re-rendered swatches detach the clicked node; its click still belongs
      // to the popover.
      if (!event.target.isConnected) return;
      if (
        els.settingsPop.contains(event.target) ||
        els.settingsBtn.contains(event.target)
      ) {
        return;
      }
      setSettingsOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && settingsIsOpen()) {
        setSettingsOpen(false);
        els.settingsBtn.focus();
      }
    });

    els.dialog.addEventListener("click", (event) => {
      if (event.target === els.dialog) els.dialog.close();
    });

    if (!supportsFileShare()) {
      els.shareNativeBtn.classList.add("hidden");
    }

    els.html.dataset.mode = state.mode;
    els.html.dataset.theme = state.theme;
    els.html.dataset.gauge = state.gauge;
    applyLang();
    refreshResultUi();
    loadConnectionInfo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
