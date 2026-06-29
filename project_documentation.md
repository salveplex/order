# Prosjektdokumentasjon: Voss Taxi Web App (Order)

Dette dokumentet inneholder all nødvendig informasjon om arkitektur, filstier, serveroppsett, deployment-rutiner og integrasjoner for Voss Taxi-prosjektet. Dokumentet er skrevet for å gi Claude (eller andre utviklere) full kontekst umiddelbart.

---

## 1. Stier og Miljøer (Paths & Environments)

### Lokalt Utviklingsmiljø (Windows)
- **Lokal sti:** `d:\AI\claude\order`
- **Utviklingsserver:** Kjøres via `npm run dev` (kjører typisk på `http://localhost:3000`)
- **Lokal database:** `d:\AI\claude\order\data\history.db` (SQLite)

### VPS / Produksjonsmiljø (Linux)
- **SSH Host Alias:** `vps` (Konfigurert i lokal `.ssh/config`)
- **Produksjonsbruker:** `vosstaxi` (Kommandoer må ofte kjøres med `sudo -u vosstaxi`)
- **VPS Prosjekt-sti:** `/home/vosstaxi/sites/order_vps`
- **VPS Database-sti:** `/home/vosstaxi/sites/order_vps/data/history.db`
- **Prosessmanager:** PM2. Appen kjører under navnet `order_vps` (PM2 ID: 6).

### Versjonskontroll (Git)
- **Repository:** `https://github.com/salveplex/order`
- **Hovedgren (Branch):** `main`

---

## 2. Teknologistakk
- **Rammeverk:** Next.js 16.2.9 (med Turbopack for byggehastighet)
- **Språk:** TypeScript / React
- **Styling:** Tailwind CSS
- **Database:** SQLite (via `better-sqlite3`)
- **Kart/Visualisering:** Leaflet (brukes i `app/demo/page.tsx` og sporingssider)
- **E-post:** Nodemailer (SMTP)

---

## 3. Deployment og Git-rutiner

For å oppdatere koden på live-serveren (VPS), følges denne standardrutinen:

**1. Lokalt (Push til GitHub):**
```powershell
cd d:\AI\claude\order
git add .
git commit -m "Beskrivelse av endring"
git push
```

**2. Deploy på VPS:**
Kjør følgende kommando lokalt fra PowerShell for å bygge og restarte serveren automatisk:
```powershell
ssh vps "sudo -u vosstaxi bash -c 'cd /home/vosstaxi/sites/order_vps && git pull && npm run build && pm2 restart order_vps'"
```

*Alternativt kan man logge inn manuelt:*
1. `ssh vps`
2. `sudo su - vosstaxi`
3. `cd /home/vosstaxi/sites/order_vps`
4. `git pull`
5. `npm run build`
6. `pm2 restart order_vps`

**Sjekke logger på VPS:**
```bash
sudo -u vosstaxi pm2 logs order_vps
```

**Overføre filer direkte via SCP (ved behov):**
```powershell
# Fra lokal til VPS:
scp d:\AI\claude\order\filnavn.ext vps:/home/vosstaxi/sites/order_vps/

# OBS: Husk å fikse rettigheter hvis filer kopieres som root:
ssh vps "chown -R vosstaxi:vosstaxi /home/vosstaxi/sites/order_vps/"
```

---

## 4. Kjernemekanismer og API-integrasjoner

### A. Taxi4U API Integrasjon
Prosjektet kommuniserer tungt med Taxi4U sitt baksystem for bestilling og status.
- **Autentisering:** Systemet må først hente et JWT-token via `POST /api/auth/login` (med `userId` og `password`). Dette tokenet brukes som `Bearer`-token for påfølgende kall. *(Merk: Auth skjer IKKE mot `/api/v2/auth`, men den eldre auth-endepunktet).*
- **Opprett bestilling:** Sendes til `POST /api/v2/book/general`. Returnerer et objekt som inneholder `bookRef` (f.eks. `BEO842`) som brukes som unik identifikator for turen.
- **Statushenting:** Numeriske statuskoder fra Taxi4U mappes internt:
  - `1`: accepted (Tildelt/Godkjent)
  - `2`: inProgress (I bil / Kjører tur)
  - `3`: completed (Ferdigkjørt)

### B. Kvitteringssystem og Cron-jobb
- **Database (SQLite):** Når en bruker bestiller og krysser av for "Ønsker kvittering", lagres forespørselen i tabellen `receipt_requests` i `history.db`. Databasen har kolonnene: `id`, `bookingId`, `email`, `language`, `status` (pending/sent), og `timestamp`.
- **Cron-endepunkt:** `/api/cron/receipts`
- **Flyt:** 
  1. Cron-jobben kjører periodisk (hvert 10. minutt) på VPS-en.
  2. Den sjekker SQLite for oppføringer med `status = 'pending'`.
  3. Den kaller Taxi4U for å sjekke om turen er ferdigkjørt og om data er tilgjengelig.
  4. Hvis tilgjengelig, genereres en HTML-kvittering oversatt til kundens språk (norsk, engelsk, tysk, etc.) via Nodemailer, og sendes ut.
  5. Databasen oppdateres til `status = 'sent'`.

### C. Booking-skjema (`BookingForm.tsx`)
- Ligger under `components/BookingForm.tsx`.
- Inneholder kompleks logikk for adresse-søk, avstandsberegning (maksimalt 20 km fra et spesifikt punkt), språkvalg, og bilattributter.
- **Attributter:** 6-seter (tidligere en standard) er nå en "opt-in" attributt.
- Datatypen som sendes til backend heter `BookingData`.

---

## 5. Viktige Filer & Mappestruktur

- `app/api/bookings/route.ts` - Hovedendepunkt for å motta bestillinger fra skjemaet, lagre kvitteringsforespørsel i DB, og videresende til Taxi4U.
- `app/api/bookings/status/route.ts` - Henter live-status på turer fra Taxi4U og oversetter tallkoder (1, 2, 3) til tekst.
- `app/api/cron/receipts/route.ts` - Bakgrunnsjobb som genererer og sender e-postkvitteringer, inkludert språkhåndtering (NO, NN, EN, DE, FR, ES).
- `lib/db.ts` - Oppsett og initialisering av `better-sqlite3`. Kjører automatisk migreringer/oppretter tabeller.
- `lib/taxi4u-api.ts` - Hjelpefunksjoner for å kalle Taxi4U sine endepunkter, håndtere adresse-autofullføring osv.
- `components/BookingForm.tsx` - Hoved-UI for bestilling.
- `components/BookingTracking.tsx` - Viser live-status til brukeren (bruker statusene `accepted`, `inProgress`, `completed`).
- `data/history.db` - SQLite-databasen (ikke sjekket inn i Git pga. .gitignore).

---

## 6. Kjente feller & Retningslinjer (Tips til Claude)
1. **IKKE slett eksisterende felt i `history.db`:** Hvis databasestrukturen endres, må det skrives trygge `ALTER TABLE`-statements pakket i `try/catch` i `lib/db.ts`.
2. **React Hooks:** Pass på hoisting-regler for funksjoner. Bruk `function navn() {}` i stedet for `const navn = () => {}` dersom de skal brukes inne i `useEffect`-hooks som ligger lenger opp i filen.
3. **Typescript Strictness:** Det finnes en del `any`-typer knyttet til tredjeparts-biblioteker (som Leaflet `L`) og eldre Taxi4U-respons-objekter. Rør disse kun hvis du vet 100% sikkert hva API-et returnerer, ellers brekker bygget under `npm run build`.
4. **Auth Mot Taxi4U:** Bruk alltid `getAuthToken()`-funksjonen, og send tokenet som `Bearer`-header. Ikke gjett på andre auth-endepunkter.

---
*Dette dokumentet fungerer som "Source of Truth" for prosjektets nåværende tilstand per juni 2026.*
