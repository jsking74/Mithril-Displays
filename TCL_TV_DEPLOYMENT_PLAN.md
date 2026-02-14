# TCL TV App Deployment Plan for High-Performance In-Store Animations

## 1) Feasibility: Sideload vs Store Publishing

TCL ships multiple platform variants, so the deployment path depends on the exact model/OS:

- **Google TV / Android TV-based TCL models**
  - You can usually sideload a signed APK in developer mode (ADB/network install).
  - You can also publish through Google Play (internal/closed tracks first, then production).
- **Roku TV-based TCL models**
  - You can sideload a Roku channel package for testing (developer mode), but production requires Roku channel distribution workflows.
- **Other TCL OS variants (regional Linux forks / VIDAA-like platforms)**
  - Sideloading may be limited or undocumented; you may need OEM/operator distribution channels.

**Action:** Build a device inventory first (model number, OS, firmware, region). Without this, no single deployment strategy is reliable.

---

## 2) Recommended Architecture for Performance

For in-store animation quality with centralized control, use a **hybrid native shell + hosted web app** approach:

1. **Native TV shell app**
   - Boots on startup.
   - Loads a local “launcher” page instantly.
   - Hosts a hardened WebView/browser runtime.
   - Includes watchdog/restart logic and offline fallback assets.
2. **Hosted content app (in-store local server preferred)**
   - TV pulls content from local network server/CDN cache for low latency.
   - Content updates can be near real-time without APK/channel updates.
3. **Local cache + prefetch layer**
   - Pre-download animation bundles, videos, spritesheets, and fonts.
   - Use content versioning with atomic swap to avoid partial updates.

This gives store-ops agility while preserving native control over startup, reliability, and device health.

---

## 3) Sideload Path (Fastest Pilot)

## 3.1 For TCL Google TV / Android TV

1. Enable developer options and ADB (or provisioning profile via MDM if available).
2. Build a release-signed APK (do not rely on debug build for long-run stability).
3. Install with ADB over LAN/USB.
4. Configure app as launcher/autostart (where policy allows).
5. Validate reboot persistence, network recovery, and crash recovery.

### 3.2 For TCL Roku TV

1. Enable Roku developer mode per device.
2. Package and sideload channel for QA only.
3. Validate memory/performance on target model classes.
4. Plan migration to formal channel distribution for scale.

**Pilot criteria:** use sideload only for proof-of-performance and store trial; avoid long-term operational dependency on manual installs.

---

## 4) Formal Publish Path (Scalable Rollout)

## 4.1 Google TV / Android TV (Google Play)

1. Prepare production signing and secure key management.
2. Pass Android TV quality checks (D-pad nav, leanback behavior, stability).
3. Release in **internal testing** track for device matrix.
4. Expand to **closed testing** by region/store group.
5. Move to production with staged rollout.

## 4.2 Roku TV (Roku channel workflows)

1. Complete channel packaging and metadata requirements.
2. Execute certification/compliance checks.
3. Use beta/private distribution first.
4. Promote to full distribution after device and store soak tests.

## 4.3 If platform blocks public app listing

Use one of:
- Enterprise/OEM preload agreements.
- Managed device fleet tooling (if supported by platform).
- Partner-operated private channel/app distribution.

---

## 5) Performance Standards for Animation-Heavy In-Store Displays

Set hard SLOs and reject builds that miss them:

- **Frame pacing:** target 60fps for primary loops; tolerate 30fps only for heavy scenes.
- **Cold start to first frame:** < 3 seconds preferred.
- **Memory headroom:** sustain 24/7 playback without OOM or forced GC spikes.
- **Thermal stability:** no visible throttling over 8–12 hour test windows.
- **Network fault tolerance:** graceful degraded mode within 1 second of packet loss.

Implementation tactics:

- Prefer transform/opacity animations over layout-thrashing DOM updates.
- Use GPU-friendly CSS and precomposited layers carefully.
- Convert long loops to video where interactive logic is unnecessary.
- Use AV1/H.265/H.264 per model decode capabilities.
- Keep texture/video dimensions aligned to panel output profile.
- Preload fonts and critical assets; use service worker + cache version pinning.
- Avoid runtime JS allocation churn during animation loops.

---

## 6) In-Store Hosted Web App Design

- Host per-store edge node (small server/appliance) with:
  - Nginx/static file serving
  - Health endpoint
  - Local asset mirror
  - Optional websocket control channel
- TVs should default to local hostname/IP and fail over to central cloud.
- All content bundles immutable and hash-addressed.
- Remote control plane handles schedule, playlists, and emergency override.

---

## 7) Reliability & Fleet Operations

- Heartbeats from each TV every 30–60 seconds.
- Capture: fps estimate, dropped frames, memory, uptime, app version, content hash.
- Auto-remediation policy:
  - soft reload on renderer stall
  - app restart on repeated failures
  - device reboot window if app restart fails repeatedly
- Maintenance windows for OTA/platform updates.
- Canary stores before broad rollout.

---

## 8) Security & Compliance

- Signed app/channel artifacts only.
- HTTPS + certificate pinning where feasible.
- Locked-down admin surfaces.
- Prevent user escape from signage app (kiosk controls per platform policy).
- Audit logging for content publish events.

---

## 9) 30-60-90 Execution Plan

### First 30 days (validation)
- Build device matrix (exact TCL models/OS).
- Create minimal shell + hosted animation prototype.
- Benchmark 3 representative animation scenes.
- Decide primary platform path (Google TV first, Roku second, etc.).

### Days 31–60 (pilot hardening)
- Add offline cache, watchdog, telemetry.
- Run 24/7 soak tests in lab and 1–2 pilot stores.
- Complete internal/closed distribution setup.

### Days 61–90 (scale)
- Expand rollout in waves.
- Enforce performance SLO gate in CI/CD.
- Finalize runbooks for NOC/store ops.

---

## 10) Decision Framework

Choose path by scorecard:

- **Speed to pilot:** sideload wins.
- **Operational scalability:** formal publish/private enterprise distribution wins.
- **Performance:** both can perform equally if runtime and content are optimized.
- **Risk:** manual sideload has highest long-term risk.

**Practical recommendation:**
1. Start with sideload on a limited subset of TCL models to validate animation performance quickly.
2. In parallel, begin formal publication/distribution onboarding immediately.
3. Standardize a native shell + locally hosted web content architecture for best balance of performance and operational control.
