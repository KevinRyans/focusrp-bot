// =============================================
// FOCUS RP - Spørsmålsbank v2
// Fødselsdato-validering + dype karakterspørsmål
// =============================================

const QUESTIONS = {

  // ─── GENERELLE SPØRSMÅL (alle søkere) ───────────────────────────────────────

  general: [
    {
      id: 'birthdate',
      title: '📅 Fødselsdato',
      description:
        `Hva er din fødselsdato?\n` +
        `Skriv i formatet **DD.MM.ÅÅÅÅ**\n\n` +
        `*Eksempel: \`15.04.2001\`*`,
      validate: (answer) => {
        const clean = answer.trim();
        const match = clean.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (!match) {
          return { pass: false, reason: `Bruk formatet **DD.MM.ÅÅÅÅ** — f.eks. \`15.04.2001\`` };
        }
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        const birth = new Date(year, month - 1, day);
        if (
          birth.getFullYear() !== year ||
          birth.getMonth() !== month - 1 ||
          birth.getDate() !== day
        ) {
          return { pass: false, reason: `Det ser ikke ut som en gyldig dato. Prøv igjen med format **DD.MM.ÅÅÅÅ**.` };
        }
        const today = new Date();
        let age = today.getFullYear() - year;
        const hadBirthday =
          today.getMonth() > month - 1 ||
          (today.getMonth() === month - 1 && today.getDate() >= day);
        if (!hadBirthday) age--;
        const minAge = parseInt(process.env.MIN_AGE) || 16;
        if (age < minAge) {
          return {
            pass: false,
            autoReject: true,
            reason: `Du må være **minst ${minAge} år** for å søke på FOCUS RP.\nSøknaden din er avslått automatisk.`
          };
        }
        return { pass: true };
      }
    },

    {
      id: 'rules_read',
      title: '📋 Regler',
      description:
        `Har du lest og forstått **alle** reglene til FOCUS RP?\n` +
        `Du finner dem i **#regler**-kanalen på Discord.\n\n` +
        `Svar: \`ja\` eller \`nei\``,
      validate: (answer) => {
        if (answer.trim().toLowerCase() !== 'ja') {
          return {
            pass: false,
            autoReject: true,
            reason: `Du må lese reglene **før** du søker.\nFinn dem i **#regler**, og send inn en ny søknad når du har lest dem.`
          };
        }
        return { pass: true };
      }
    },

    {
      id: 'rp_experience',
      title: '🎮 Roleplay-erfaring',
      description:
        `Hva er din erfaring med RP fra før?\n\n` +
        `*Vær ærlig — vi vurderer ikke etter erfaring, men etter ærlighet.*\n` +
        `*Minimum 40 tegn.*`,
      validate: (answer) => {
        if (answer.trim().length < 40) {
          return { pass: false, reason: `Gi et litt mer utfyllende svar om bakgrunnen din. (Minimum 40 tegn)` };
        }
        return { pass: true };
      }
    },

    {
      id: 'rp_definition',
      title: '🧠 RP-forståelse',
      description:
        `Forklar med egne ord hva **MeRP** og **BreakRP** betyr,\n` +
        `og gi et eksempel på hvert.\n\n` +
        `*Dette tester grunnleggende RP-forståelse.*`,
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Forklar begge begrepene og gi eksempler. (Minimum 60 tegn)` };
        }
        return { pass: true };
      }
    },

    {
      id: 'character_type',
      title: '🎭 Karaktertype',
      description:
        `Hva slags karakter ønsker du å spille på FOCUS RP?\n\n` +
        `\`lovlydig\`   →  Sivil, yrkesaktiv, lovtro karakter\n` +
        `\`kriminell\`  →  Karakter med kriminell bakgrunn/livsstil\n` +
        `\`nøytral\`    →  Blanding, eller vet ikke ennå\n\n` +
        `*Svar med ett av alternativene over.*`,
      validate: (answer) => {
        const clean = answer.trim().toLowerCase();
        const map = {
          'lovlydig': 'lovlydig',
          'kriminell': 'kriminell',
          'nøytral': 'nøytral',
          'noytral': 'nøytral'
        };
        if (!map[clean]) {
          return { pass: false, reason: `Svar med \`lovlydig\`, \`kriminell\` eller \`nøytral\`.` };
        }
        return { pass: true, branch: map[clean] };
      }
    }
  ],

  // ─── LOVLYDIG BRANCH ────────────────────────────────────────────────────────

  lovlydig: [
    {
      id: 'lv_karakter',
      title: '📝 Karakterbakgrunn',
      description:
        `Hvem er karakteren din?\n` +
        `Fortell om **navn, alder, yrke og bakgrunnshistorie**.\n\n` +
        `*Hva har denne personen opplevd? Hva driver dem?*\n` +
        `*Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterhistorie. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_yrke_motivasjon',
      title: '💼 Yrke & Motivasjon',
      description:
        `Hvilket yrke ønsker karakteren å ha, og **hvorfor nettopp dette**?\n\n` +
        `*Ikke bare yrkestittel — hva betyr det for karakteren?*\n` +
        `*Hva ønsker de å oppnå gjennom det?*`,
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Utdyp motivasjonen bak yrkesvalget. (Minimum 50 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_grense_scenario',
      title: '⚖️ Scenario — moralsk press',
      description:
        `En kollega ber karakteren din om å se en annen vei på noe ulovlig\n` +
        `som gavner begge parter — og truer med å si opp dersom du ikke gjør det.\n\n` +
        `**Hva gjør karakteren din, steg for steg?**\n\n` +
        `*Vis beslutningsprosessen. Ikke hva "riktig svar" er — hva gjør DIN karakter?*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi et mer gjennomtenkt svar på scenarioet. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_rp_bidrag',
      title: '🌆 Bidrag til serveren',
      description:
        `Hva ønsker du å bidra med til FOCUS RP som lovlydig karakter?\n\n` +
        `*Tenk på andre spillere, historier, og miljøet på serveren.*\n` +
        `*Hva skaper DU for andre?*`,
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Utdyp hvordan du ønsker å bidra. (Minimum 50 tegn)` }
        : { pass: true }
    }
  ],

  // ─── KRIMINELL BRANCH ───────────────────────────────────────────────────────

  kriminell: [
    {
      id: 'kr_karakter',
      title: '📝 Karakterbakgrunn',
      description:
        `Hvem er karakteren din?\n` +
        `Fortell om **navn, alder og historien bak den kriminelle livsstilen**.\n\n` +
        `*Hva har ført dem hit? Hva er drivkraften? Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterhistorie. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_fearrp',
      title: '😰 FearRP — Scenario',
      description:
        `Karakteren din er alene og blir omringet av fire maskerte og bevæpnede\n` +
        `menn. De krever at du overlater bilen og alle verdisaker — nå.\n\n` +
        `**Hva gjør karakteren din, og hva tenker de i øyeblikket?**\n\n` +
        `*Vis din forståelse av FearRP og karakterens menneskelige reaksjoner.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Utdyp svaret ditt. Vi vil se tankeprosessen. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_grenser',
      title: '🚫 Grenser for kriminell RP',
      description:
        `Kriminell RP kan gå mange veier. Beskriv:\n\n` +
        `→ Hva er du **komfortabel** med å RP-e?\n` +
        `→ Hva er dine **absolutte grenser**?\n` +
        `→ Hva er forskjellen på god kriminell RP og "griefer"-adferd?`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Vær mer konkret og utfyllende. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_rp_verdi',
      title: '🎭 RP-verdi for andre',
      description:
        `Kriminell RP handler ikke bare om action for deg selv.\n\n` +
        `**Gi et konkret eksempel på en RP-situasjon du ønsker å skape**\n` +
        `som gir verdi for ANDRE spillere — lovlydig eller kriminell.`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi et mer konkret og gjennomtenkt eksempel. (Minimum 80 tegn)` }
        : { pass: true }
    }
  ],

  // ─── NØYTRAL BRANCH ─────────────────────────────────────────────────────────

  'nøytral': [
    {
      id: 'nu_karakter',
      title: '📝 Karakterkonsept',
      description:
        `Hvem er karakteren din?\n` +
        `Fortell om **navn, alder, bakgrunn og personlighet**.\n\n` +
        `*Hva gjør denne personen interessant? Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterbeskrivelse. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_motivasjon',
      title: '🌆 Motivasjon',
      description:
        `Hva bringer karakteren til Oslo, og hva holder dem der?\n\n` +
        `*Hva søker karakteren — trygghet, penger, tilhørighet, hevn?*\n` +
        `*Vær spesifikk.*`,
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Gi et mer utfyllende svar. (Minimum 50 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_moralsk_valg',
      title: '⚖️ Moralsk valg',
      description:
        `Karakteren din ser en nær venn stjele fra en fattig familiebedrift.\n` +
        `Vennen hevder de ikke hadde noe annet valg.\n\n` +
        `**Hva gjør karakteren din — og hva sier det om hvem de er?**\n\n` +
        `*Ingen fasit. Vi vil se karakterens indre logikk.*`,
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Utdyp svaret og karakterens tankeprosess. (Minimum 60 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_rp_eksempel',
      title: '🎭 Drømmescenario',
      description:
        `Beskriv en konkret RP-situasjon du drømmer om å oppleve på FOCUS.\n\n` +
        `*Hvem er involvert? Hva skjer? Hva er karakterens rolle?*\n` +
        `*Vær så spesifikk som mulig. Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi et mer konkret og detaljert scenario. (Minimum 80 tegn)` }
        : { pass: true }
    }
  ]
};

module.exports = QUESTIONS;
