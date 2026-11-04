# KC Production Station

Windows software for the Shop-Co production line. The default scan action downloads TO PRINT and submits the available AWB to the configured printer. Settings can also enable DRAFT downloading and automatic four-draft portrait A4 layout.

## First setup

1. Install `release/KC-Production-Station-Setup-1.0.0.exe` on a Windows 10/11 x64 production PC.
2. Sign in using an existing Shop-Co staff account.
3. Open **Settings**. Choose the download folder, the draft printer, the AWB printer and the AWB paper size. Save settings before scanning production jobs.
4. Open **Pair Phone** and use one of the connection methods below.
5. Run a test scan and print a test A4 sheet and an AWB. Check margins, QR readability, label orientation and the actual printer output before normal use.

**Settings → When a QR is scanned** saves four independent workstation actions: Download TO PRINT (default on), Download DRAFT (default off), Print available AWB automatically (default on), and Automatically arrange downloaded drafts (default off). Draft arrangement requires Download DRAFT. With the default setup, scans do not download or arrange drafts; the manual A4 editor and local draft import remain available.

The default download folder is `Documents/KC Production Jobs`. Each job has separate `TO PRINT`, `DRAFT` and `AWB` folders. Downloads keep the source files unchanged. The generated A4 PDF is a separate file.

## Wi-Fi / internet pairing (Android or iPhone)

The backend changes in this repository must be deployed first. The app uses `https://shop-co-production.up.railway.app/api/production`.

1. Open **Pair Phone → Wi-Fi / internet → Generate pairing QR** on the PC.
2. Scan that QR with the phone's camera. Name the phone and connect.
3. Click **Approve Phone** on the PC. Pairing links expire after five minutes and can be used once.
4. Tap **Test scan** on the phone. The PC displays the receipt.
5. Start the phone camera and scan task QRs. Scans go to the paired PC; the phone shows download and AWB submission results.

Both devices need internet. They do not need the same Wi-Fi network. If the PC is offline, scans wait in the server queue for up to seven days. Keep the phone scanner in the foreground for camera scanning. Camera access requires HTTPS and the phone's camera permission; **Scan a photo** and manual task-link entry are alternatives. Lost scan responses can be retried using the same request ID.

**Unpair** on the PC immediately revokes the phone's scan credential. The credential only allows sending scans and reading its scan receipts; it cannot download task artwork or access admin data.

## Bluetooth pairing (Android 9+)

Install `android/dist/KC-Phone-Scanner-1.0.0.apk` on the phone. This APK is signed with a local development key. It is a separate app and does not replace Shop-Co mobile or other apps.

1. Open the companion and allow Camera and Nearby devices permissions.
2. On the PC, open **Pair Phone → Bluetooth → Open Windows Bluetooth settings**.
3. On the phone, tap **Pair Bluetooth**. Select a paired PC, or choose **Pair a new PC** and pair through Windows Bluetooth settings.
4. Keep the phone app in the foreground. Select the PC in the companion again if necessary.
5. Click **Test Bluetooth input** in the Windows app and tap **Test Bluetooth scan** on the phone.
6. Keep KC Production Station focused, with its scan input selected. Scanning a task sends its token and Enter over Bluetooth HID keyboard mode.

Bluetooth HID support varies by phone. Bluetooth keyboard input goes to the focused Windows application. This mode reports the job result on the PC; keyboard mode cannot send download status back to the phone. iPhone uses Wi-Fi pairing. The PC still needs internet to retrieve Shop-Co files.

The Android camera scanner can also read the PC's Wi-Fi pairing QR and open the secure browser scanner.

## Four portrait drafts on A4

- **Settings → Automatically arrange drafts after a QR scan** is saved for this workstation. Enable it to fill available template slots as scanned drafts arrive; disable it to keep drafts in the library for manual placement. **Auto-fill new drafts** in the layout editor controls the same saved setting.
- **Auto arrange 4** selects the first four waiting drafts. Multi-page PDFs contribute one draft per page.
- Click a library draft to fill a free slot, drag it onto a slot to replace that slot, or drag between occupied slots to swap them.
- Rotate or remove drafts with the controls on each slot. Landscape inputs are rotated into portrait automatically.
- Outer margin and gap are measured in millimetres. The default is 5 mm margin and 3 mm gap. **Save as template** preserves these settings for reuse.
- **Preview sheet**, **Export PDF** and **Print A4 sheet** use the same PDF layout generator. A partially filled sheet can also be exported or printed.
- Artwork is scaled proportionally without cropping. Four A5 originals are reduced to fit one A4; they cannot remain full A5 size on A4.
- PDF artwork is embedded as vector content when possible. Images are embedded into the output PDF. Extremely small source QR codes still need physical readability testing.

Draft sheets print with portrait A4, one copy, simplex and no additional scaling. Match the printer's A4 paper and printable margins. AWBs use the separately configured printer and paper size, with fit scaling.

## Queue and printing behaviour

- Available AWBs print automatically after all task downloads finish when **Print available AWB automatically** is enabled.
- Scanning the same active task again returns its existing job. **Refresh files** retrieves the current manifest; it does not automatically repeat an already recorded AWB submission.
- An existing parcel label shared by several tasks is automatically submitted once per workstation. This is a local ledger, not a cross-PC print lock; assign an order's AWB to one production PC.
- **Reprint AWB** requires an explicit confirmation. Check for an existing label first.
- A print utility completion is shown as **sent**, not physical-print confirmation. A failed or interrupted attempt is **uncertain** and must be reviewed before reprinting.
- There is no automatic courier booking or payment. Missing AWBs are reported for staff action in Shop-Co.
- Download errors can be retried; interrupted files are not accepted as completed downloads. Errors in importing a draft do not change the downloaded source file.
- Task/order production statuses are not changed automatically. Staff retain the existing Shop-Co workflow.
- Closing the app is blocked while it is downloading or submitting a print job.

Local settings, job history and the print ledger are under Electron's user-data directory (`%APPDATA%/kc-production-station` by default). Access/refresh tokens are stored separately using Electron safeStorage (Windows DPAPI). Passwords are not saved. Preserve the production history when moving/reinstalling a workstation, otherwise automatic label deduplication starts over.

## Development and backend release

```powershell
cd backend
npm ci
npm run build
npm test

cd ../production-station
npm ci
# If the package manager did not run Electron's binary installer:
node node_modules/electron/install.js
npm test
npm run test:electron
npm start
npm run build
node build-icon.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File android/build.ps1
```

The Android build uses the installed Android SDK (platform/build tools 35) and Android Studio JBR. Keep the development signing key for compatible updates. The key is ignored by Git.

Backend release files are scoped to:

- `backend/src/domain/entities/ProductionStation.ts` and its generated `dist` file.
- `backend/src/shared/utils/productionManifest.ts` and its generated `dist` file.
- `backend/src/presentation/routes/productionRoutes.ts` and its generated `dist` file.
- Route registration in `backend/src/settings/app.ts` and `backend/dist/settings/app.js`.
- Startup index initialization in `backend/src/settings/server.ts` and `backend/dist/settings/server.js`.
- `backend/public/production/` (phone HTML, CSS and JavaScript).
- `backend/package.json` and `backend/package-lock.json` (`jsqr` dependency).

The existing Railway Dockerfile includes `public/` and builds `dist/` from source. No database migration or production data rewrite is required; the new station and scan collections are created on first use. The QR manifest merges authoritative FileUpload records with embedded task files and resolves existing parcel/order AWB URLs. Platform order numbers are treated as strings, not forced into ObjectIds.

`npm test` runs geometry, PDF/image, scaled QR decoding, restart-ledger, scan parsing and an isolated MongoDB integration test. It never connects to the production database. `npm run test:electron` exercises the actual main/preload/renderer with synthetic jobs and mocked print submissions; it never prints physically or makes production requests. Test artifacts are generated in ignored `test-output/`.

## Verification for this build

Confirmed: Windows installer build, signed Android APK build, backend build and 66 existing backend tests, 8 production tests, four QR codes decoded at 150 dpi, and Electron smoke workflow including download/retry logic, shared-label deduplication, import, thumbnails, preview, export, mocked printing and explicit reprinting.

Not yet verified: real phone camera and Bluetooth HID, physical AWB/draft printer output, production credentials/files, or deployed pairing routes. No connected Android device was available during the build. Backend changes are local until explicitly released.
