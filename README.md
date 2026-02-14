# Mithril Displays Receiver

TV signage receiver app for Mithril Matrix control-plane distribution.

This app is intended to run on each in-store display and pull unique payloads per display from the Mithril Matrix web app (controller).

## Receiver model

- Each screen has a unique `displayId`.
- Receiver registers itself with the controller (`registerPath`).
- Receiver polls for display-specific payloads (`pullPathTemplate`).
- Payload controls the scene rotation/content for that specific display.

## Files

- `index.html` - fullscreen receiver shell + status HUD
- `app.js` - animation runtime + receiver pull loop + display registration
- `display-config.json` - store/display/controller endpoints
- `content.json` - local fallback payload used when controller is unavailable
- `service-worker.js` - app shell caching

## Configure

Edit `display-config.json`:

- `storeId`: store identifier
- `displayId`: optional fixed id (empty = generated/persisted)
- `controlBaseUrl`: Mithril Matrix base URL (e.g. `http://10.0.0.20:3000`)
- `pullPathTemplate`: endpoint template with `{displayId}` token
- `pollIntervalMs`: controller pull interval

You can also override display id at runtime:

- `http://localhost:8080/?displayId=aisle-3-east`

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Controls

- `←` previous scene
- `→` next scene
- `Space` pause/resume
- `H` hide/show diagnostics HUD

## Example controller contract

A display payload endpoint should return JSON like:

```json
{
  "version": "store-001-2026-02-14T20:00:00Z",
  "rotationSeconds": 10,
  "scenes": [
    {
      "id": "aurora",
      "title": "Front Window",
      "subtitle": "Unique content for this display",
      "theme": ["#67a4ff", "#8fffd8", "#d8b5ff"]
    }
  ]
}
```
