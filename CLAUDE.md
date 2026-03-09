# FOCUS RP — Whitelist Bot Kontekst

## Hva dette er
Discord-bot for FiveM RP-server "FOCUS RP" (focusrp.no).
Håndterer whitelist-søknader via DM-flyt med branching-logikk.

## Arkitektur
- `src/index.js` — Discord client, knapp/modal-interaksjoner, accept/deny/question-flow
- `src/applicationHandler.js` — DM-flyt, søknadstilstand (in-memory Map)
- `src/questions.js` — All spørsmålslogikk og branching (rediger KUN her)
- `.env` — Konfigurasjon (token, kanal-IDer, rolle-IDer)

## Søknadsflyt
1. Bruker klikker knapp i APPLICATION_CHANNEL
2. Bot starter DM → intro-embed med Start-knapp
3. 5 generelle spørsmål (fødselsdato, regler, RP-erfaring, MeRP/BreakRP, karaktertype)
4. Spørsmål 5 setter branch: lovlydig / kriminell / nøytral
5. 4 branch-spesifikke karakterspørsmål
6. Søknad postes som embed i STAFF_CHANNEL med 3 knapper

## Staff-knapper
- ✅ Godkjenn → Intervju: gir INTERVIEW_ROLE, DM til søker om intervju
- ❌ Avslå: åpner modal → staff skriver grunn → sendes til søker i DM
- 💬 Spør om mer: åpner modal → staff skriver spørsmål → sendes til søker i DM

## Roller
- INTERVIEW_ROLE_ID: gis ved godkjent søknad (tilgang til #intervju)
- WHITELISTED_ROLE_ID: gis manuelt av staff etter bestått intervju

## Stack
- Node.js + discord.js v14
- Hostet på Railway.app
- Ingen database — in-memory state

## Mangler / kan bygges videre på
- Cooldown på re-søknad håndheves ikke (nevnes bare i DM-tekst)
- Ingen persistent lagring ved bot-restart
- "Spør om mer" lagrer ikke søkerens svar tilbake til staff automatisk
