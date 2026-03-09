# FOCUS RP — Whitelist Bot

Discord-bot med adaptiv DM-søknadsflyt for FiveM RP-server.

---

## Funksjoner

- ✅ Søknadsknapp i valgfri kanal
- ✅ DM-basert søknadsflyt (8 spørsmål)
- ✅ Automatisk branching basert på karaktertype (Lovlydig / Kriminell / Nøytral)
- ✅ Auto-avslag på eliminasjonskrav (alder, regler ikke lest)
- ✅ Søknad postes i staff-kanal med Godkjenn/Avslå/Spør-knapper
- ✅ Automatisk rolletildeling ved godkjennelse
- ✅ DM til søker ved godkjennelse/avslag

---

## Oppsett (steg for steg)

### 1. Opprett Discord Bot

1. Gå til https://discord.com/developers/applications
2. Klikk **New Application** → gi den et navn
3. Gå til **Bot** → klikk **Add Bot**
4. Under **Privileged Gateway Intents**, aktiver:
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
5. Kopier **Token** – dette er `DISCORD_TOKEN`
6. Gå til **OAuth2 → URL Generator**:
   - Scope: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Manage Roles`, `Read Message History`, `Use Slash Commands`, `Add Reactions`
7. Kopier URL og inviter boten til serveren din

### 2. Finn Discord-IDer

Aktiver **Developer Mode** i Discord (Settings → Advanced → Developer Mode).
Høyreklikk på serveren/kanal/rolle for å kopiere ID.

Du trenger:
- **GUILD_ID** — ID til Discord-serveren
- **APPLICATION_CHANNEL_ID** — Kanalen der søknadsknappen skal stå (f.eks. #søknad)
- **STAFF_CHANNEL_ID** — Kanalen der staff ser søknadene (f.eks. #søknader-staff)
- **WHITELISTED_ROLE_ID** — Rollen som gis ved godkjennelse

### 3. Konfigurer .env

```bash
cp .env.example .env
```

Fyll ut alle verdiene i `.env`.

### 4. Kjør lokalt (test)

```bash
npm install
npm start
```

---

## Deploy på Railway (anbefalt)

Railway gir gratis hosting som er mer enn nok for en Discord-bot.

1. Gå til https://railway.app og logg inn med GitHub
2. Klikk **New Project → Deploy from GitHub repo**
3. Velg dette repoet (push koden til GitHub først)
4. Gå til **Variables**-fanen og legg til alle verdiene fra `.env`
5. Railway starter boten automatisk

**Alternativ: Start kommando**
Railway bruker automatisk `npm start` fra package.json.

---

## Tilpasse spørsmålene

Alle spørsmål ligger i `src/questions.js`.

Hver spørsmål-objekt har:
- `id` — unik identifikator (brukes internt)
- `question` — teksten som sendes til søkeren
- `validate` — funksjon som validerer svaret (returner `{ pass: true/false }`)
  - `autoReject: true` — avslutter søknaden automatisk
  - `branch: 'lovlydig'/'kriminell'/'nøytral'` — setter branching

---

## Kanalstruktur (anbefalt)

```
📁 Søknad
   #søknad           ← APPLICATION_CHANNEL_ID (søkere ser denne)
📁 Staff
   #søknader-staff   ← STAFF_CHANNEL_ID (kun staff)
```

---

## Feilsøking

| Problem | Løsning |
|---|---|
| Bot sender ikke DM | Bruker har lukket DMs. Bot gir beskjed i kanal. |
| Staff-kanal ikke funnet | Sjekk STAFF_CHANNEL_ID i .env |
| Rolle gis ikke | Bot-rollen må være OVER Whitelisted-rollen i rollehierarkiet |
| Bot er offline etter restart | Sjekk at TOKEN er riktig og ikke regenerert |
