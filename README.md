# NEEV · Interactive prototype

A clickable prototype of the NEEV counter machine, its writing slate, and the seller and customer phone apps.
It runs entirely in the browser. There is no build step and no backend.

## What you can do

- **3D machine.** Drag to rotate, scroll to zoom. Click the three hardware keys (back, ✓, scan). The screen on the machine is live.
- **Slate.** Press **Undock slate**. The slate slides out and you can write on it with the mouse or a stylus.
- **Seller phone.** Register, choose a seller type, pair with the machine (code shown on the machine, `4821`), manage the catalogue, publish.
- **Customer phone.** Search nearby shops, request a pickup.
- **One shared ledger.** A sale on the machine changes stock everywhere. A pickup request on the customer phone shows up on the machine, and so on.

Suggested path: pair on the seller phone → Sell on the machine (tap products or the scan key) → Add stock with the slate → request a pickup on the customer phone → accept it on the machine (Orders) → mark ready → enter the code from the customer phone.

## Run it locally

ES modules need a web server (opening `index.html` as a file will not work):

```bash
node serve.mjs
# open http://localhost:8080
```

## Publish on GitHub Pages

1. Put the contents of this `prototype` folder at the root of a repository (or in `/docs`).
2. Repository **Settings → Pages → Deploy from a branch** → pick the branch and folder.
3. Your prototype is live at `https://<user>.github.io/<repo>/`. Link that from the documentation.

## Honest limits (it is a prototype)

- Handwriting recognition, voice input and barcode scanning are **simulated**. Any writing returns the sample entry (Tomatoes, 30 kg, ₹40/kg).
- Payments, OTP, maps and sensor readings are demo data. UPI confirmation is a button.
- State lives in the page. Reloading resets it (or press **Reset demo**).
- The 3D machine is a stylised model, not an engineering model.

## Files

| Path | What it is |
|---|---|
| `index.html`, `css/styles.css` | Page and styles |
| `js/store.js` | Shared state and rules (stock, reservations, pickup) |
| `js/machine-ui.js` | Screens shown on the machine |
| `js/phone-ui.js` | Seller and customer phone apps |
| `js/scene.js` | 3D machine, keys, printer paper and slate (three.js) |
| `js/main.js` | Wiring, slate drawing, sounds |
| `vendor/` | three.js (MIT licence, see `LICENSE-three.txt`) |
| `assets/` | Product photos |
