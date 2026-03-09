# FOCUS RP — Whitelist Bot v2

## Ny i v2
- Fødselsdato-validering (DD.MM.ÅÅÅÅ) istedet for alder
- Dypere karakterspørsmål tilpasset branch
- Avslå med grunn via modal (sendes til søkeren i DM)
- Fungerende "Spør om mer"-knapp via modal
- Godkjenning sender søker videre til intervju-steg (ikke direkte whitelist)
- Penere embed-design inspirert av focusrp.no

## Roller du trenger på Discord
- `INTERVIEW_ROLE_ID` — gis automatisk ved godkjent søknad, gir tilgang til #intervju
- `WHITELISTED_ROLE_ID` — gis manuelt av staff etter bestått intervju

## .env-variabler
Se `.env.example` for alle variabler.

## Deploy på Railway
1. Push til GitHub
2. New Project → Deploy from GitHub repo
3. Legg inn alle .env-verdier under Variables
4. Railway starter automatisk med `npm start`

## Bot-tillatelser som kreves
- Send Messages, Read Message History
- Manage Roles (for å gi roller)
- Use Slash Commands
- Add Reactions

## Viktig: Rollehierarki
Bot-rollen må ligge OVER rollene den skal gi (INTERVIEW og WHITELISTED).
