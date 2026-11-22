# NEEV · Interactive prototype

A clickable prototype of the NEEV counter machine (Mic first, touchscreen with stylus), its weighing base, and the seller and customer phone apps.
It runs entirely in the browser. There is no build step and no backend.

## What you can do

- **3D machine.** Drag to rotate, scroll to zoom. Click the three hardware keys: **Confirm** (tick), **Scan** and **Mic**. There is no Back key: press Mic again to start a voice entry over. The screen on the machine is live, and the stylus is parked on a tether on the right side.
- **Mic first.** Press **Mic** (the key or the Mic tile). Say a stock entry ("I have 30 kg of tomatoes") or a sale ("2 kg potatoes sold"). The machine reads it back, aloud and on screen, and nothing changes until you press **Confirm**.
- **Weighing base.** The machine docks on the base to travel and charge. Press **Lift machine off base**, then **Place bowl**, press **Tare** on the base, then **Add tomatoes**. The base display and the machine's Weigh screen show the net weight. Add it to the bill.
- **Seller phone.** Register, choose a seller type, pair with the machine (code shown on the machine, `4821`), manage the catalogue, publish.
- **Customer phone.** Search nearby shops, request a pickup.
- **One shared ledger.** A sale on the machine changes stock everywhere. A pickup request on the customer phone shows up on the machine, and so on.

Suggested path: pair on the seller phone → Sell on the machine (tap products or the scan key) → press Mic and add stock by voice → lift the machine off the base and weigh tomatoes → request a pickup on the customer phone → accept it on the machine (Orders) → mark ready → enter the code from the customer phone.

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

- Voice recognition and barcode scanning are **simulated**. The demo understands two sample phrases, shown on the listening screen. Weights on the base are demo values (empty bowl 0.45 kg, bowl with tomatoes 1.65 kg). It is not a certified scale.
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
| `js/scene.js` | 3D machine, keys, stylus, weighing base, printer paper (three.js) |
| `js/main.js` | Wiring, base controls, sounds |
| `vendor/` | three.js (MIT licence, see `LICENSE-three.txt`) |
| `assets/` | Product photos |
