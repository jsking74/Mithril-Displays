const canvas = document.getElementById("scene-canvas");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

const el = {
  title: document.getElementById("scene-title"),
  subtitle: document.getElementById("scene-subtitle"),
  hud: document.getElementById("hud"),
  hudDisplayId: document.getElementById("hud-display-id"),
  hudConnection: document.getElementById("hud-connection"),
  hudScene: document.getElementById("hud-scene"),
  hudElapsed: document.getElementById("hud-elapsed"),
  hudFps: document.getElementById("hud-fps"),
  hudFrameBudget: document.getElementById("hud-frame-budget"),
  hudVersion: document.getElementById("hud-version"),
  hudHost: document.getElementById("hud-host")
};

const fallbackContent = {
  version: "local-fallback",
  rotationSeconds: 12,
  scenes: [
    { id: "aurora", title: "Receiver Fallback", subtitle: "Waiting for pushed content", theme: ["#67a4ff", "#8fffd8", "#d8b5ff"] }
  ]
};

const state = {
  config: null,
  content: fallbackContent,
  currentIndex: 0,
  sceneStartedAt: performance.now(),
  paused: false,
  pauseStartedAt: 0,
  totalPauseDuration: 0,
  rafId: 0,
  lastFrameTime: performance.now(),
  frameCounter: 0,
  fps: 0,
  fpsMark: performance.now(),
  particles: [],
  displayId: "",
  connectionState: "offline"
};

function setConnectionState(value) {
  state.connectionState = value;
  el.hudConnection.textContent = value;
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(window.innerWidth * ratio));
  const height = Math.max(1, Math.floor(window.innerHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function getSceneElapsed(now) {
  return Math.max(0, now - state.sceneStartedAt - state.totalPauseDuration);
}

function switchScene(index) {
  const scenes = state.content.scenes;
  state.currentIndex = (index + scenes.length) % scenes.length;
  state.sceneStartedAt = performance.now();
  state.totalPauseDuration = 0;

  const scene = scenes[state.currentIndex];
  el.title.textContent = scene.title;
  el.subtitle.textContent = scene.subtitle;
  el.hudScene.textContent = scene.id;
}

function maybeRotate(now) {
  if (state.paused) return;
  const rotationMs = (state.content.rotationSeconds || 12) * 1000;
  if (getSceneElapsed(now) >= rotationMs) switchScene(state.currentIndex + 1);
}

function colorAt(colors, t) {
  return colors[Math.floor(t % colors.length)] || "#7ca8ff";
}

function drawAurora(scene, elapsed, w, h) {
  const seconds = elapsed / 1000;
  ctx.fillStyle = "#060915";
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, scene.theme[0]);
  grad.addColorStop(0.5, scene.theme[1]);
  grad.addColorStop(1, scene.theme[2]);
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i += 1) {
    const radius = w * (0.18 + i * 0.08 + 0.02 * Math.sin(seconds + i));
    const x = w * (0.2 + 0.2 * i) + Math.sin(seconds * (0.25 + i * 0.1)) * w * 0.06;
    const y = h * (0.55 + Math.cos(seconds * (0.2 + i * 0.07)) * 0.2);
    const g = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    g.addColorStop(0, `${scene.theme[i % scene.theme.length]}CC`);
    g.addColorStop(1, "#00000000");
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.globalAlpha = 1;
}

function drawRibbons(scene, elapsed, w, h) {
  const seconds = elapsed / 1000;
  ctx.fillStyle = "#050914";
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = Math.max(2, w * 0.0035);

  for (let i = 0; i < 18; i += 1) {
    const baseY = (h / 18) * i;
    const amp = h * (0.04 + (i % 3) * 0.015);
    const speed = 0.8 + i * 0.05;
    ctx.strokeStyle = colorAt(scene.theme, i + seconds * 0.2);
    ctx.beginPath();
    for (let x = 0; x <= w; x += w / 48) {
      const y = baseY + Math.sin((x / w) * 8 + seconds * speed) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function seedParticles(w, h, theme) {
  state.particles = Array.from({ length: 120 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 20,
    vy: (Math.random() - 0.5) * 20,
    size: 1 + Math.random() * 2.8,
    color: theme[i % theme.length]
  }));
}

function drawParticles(scene, elapsed, w, h, dtMs) {
  if (!state.particles.length) seedParticles(w, h, scene.theme);

  ctx.fillStyle = "#020712";
  ctx.fillRect(0, 0, w, h);

  const dt = Math.min(dtMs, 34) / 1000;
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.strokeStyle = `${scene.theme[1]}55`;
  for (let i = 0; i < state.particles.length; i += 8) {
    const a = state.particles[i];
    const b = state.particles[(i + 19) % state.particles.length];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  const pulse = 0.5 + 0.5 * Math.sin(elapsed / 700);
  ctx.fillStyle = `${scene.theme[2]}22`;
  ctx.fillRect(0, h * (0.9 - pulse * 0.04), w, h * 0.12);
}

function applyPayload(payload) {
  if (!payload || !Array.isArray(payload.scenes) || payload.scenes.length === 0) return;

  const nextVersion = payload.version || "unknown";
  const currentVersion = state.content?.version;
  state.content = payload;
  el.hudVersion.textContent = nextVersion;

  if (currentVersion !== nextVersion) {
    state.particles = [];
    switchScene(0);
  }
}

function renderFrame(now) {
  if (state.paused) {
    state.rafId = requestAnimationFrame(renderFrame);
    return;
  }

  resizeCanvas();
  maybeRotate(now);

  const scene = state.content.scenes[state.currentIndex];
  const elapsed = getSceneElapsed(now);
  const dt = now - state.lastFrameTime;
  const w = canvas.width;
  const h = canvas.height;

  if (scene.id === "aurora") drawAurora(scene, elapsed, w, h);
  else if (scene.id === "ribbons") drawRibbons(scene, elapsed, w, h);
  else drawParticles(scene, elapsed, w, h, dt);

  state.lastFrameTime = now;
  state.frameCounter += 1;

  const span = now - state.fpsMark;
  if (span >= 500) {
    state.fps = Math.round((state.frameCounter * 1000) / span);
    state.frameCounter = 0;
    state.fpsMark = now;
  }

  el.hudElapsed.textContent = `${(elapsed / 1000).toFixed(1)}s`;
  el.hudFps.textContent = String(state.fps);
  el.hudFrameBudget.textContent = `${dt.toFixed(2)}ms`;

  state.rafId = requestAnimationFrame(renderFrame);
}

function togglePause() {
  if (state.paused) {
    state.totalPauseDuration += performance.now() - state.pauseStartedAt;
    state.paused = false;
  } else {
    state.paused = true;
    state.pauseStartedAt = performance.now();
  }
}

function ensureDisplayId(config) {
  const fromQuery = new URLSearchParams(window.location.search).get("displayId");
  const fromStorage = localStorage.getItem("mithril-display-id");
  const generated = `display-${Math.random().toString(36).slice(2, 8)}`;
  const chosen = fromQuery || config.displayId || fromStorage || generated;
  localStorage.setItem("mithril-display-id", chosen);
  return chosen;
}

async function loadConfig() {
  const response = await fetch("./display-config.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Config load failed: ${response.status}`);
  return response.json();
}

async function registerDisplay(config, displayId) {
  if (!config.controlBaseUrl || !config.registerPath) return;
  try {
    await fetch(`${config.controlBaseUrl}${config.registerPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayId, storeId: config.storeId, userAgent: navigator.userAgent })
    });
  } catch (error) {
    console.warn("Display registration failed", error);
  }
}

function buildPayloadUrl(config, displayId) {
  if (!config.controlBaseUrl) return "./content.json";
  const path = (config.pullPathTemplate || "/api/displays/{displayId}/payload").replace("{displayId}", encodeURIComponent(displayId));
  return `${config.controlBaseUrl}${path}`;
}

async function pullPayload() {
  const url = buildPayloadUrl(state.config, state.displayId);
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

    const payload = await response.json();
    applyPayload(payload);
    setConnectionState("online");
  } catch (error) {
    console.warn("Payload pull failed", error);
    setConnectionState("degraded");
  }
}

function startPayloadPolling() {
  const interval = Math.max(1000, Number(state.config.pollIntervalMs) || 5000);
  pullPayload();
  setInterval(pullPayload, interval);
}

function installShortcuts() {
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") switchScene(state.currentIndex + 1);
    else if (event.key === "ArrowLeft") switchScene(state.currentIndex - 1);
    else if (event.key === " ") {
      event.preventDefault();
      togglePause();
    } else if (event.key.toLowerCase() === "h") {
      el.hud.classList.toggle("hidden");
    }
  });

  window.addEventListener("resize", resizeCanvas, { passive: true });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}

async function boot() {
  resizeCanvas();
  installShortcuts();

  try {
    state.config = await loadConfig();
    state.displayId = ensureDisplayId(state.config);
    el.hudDisplayId.textContent = state.displayId;
    el.hudHost.textContent = state.config.controlBaseUrl || "local-content";

    await registerDisplay(state.config, state.displayId);

    const localContentResponse = await fetch("./content.json", { cache: "no-store" });
    if (localContentResponse.ok) applyPayload(await localContentResponse.json());

    switchScene(0);
    await registerServiceWorker();
    startPayloadPolling();
    setConnectionState("connecting");

    cancelAnimationFrame(state.rafId);
    state.lastFrameTime = performance.now();
    state.rafId = requestAnimationFrame(renderFrame);
  } catch (error) {
    el.title.textContent = "Receiver failed to start";
    el.subtitle.textContent = error instanceof Error ? error.message : "Unknown error";
    console.error(error);
  }
}

boot();
