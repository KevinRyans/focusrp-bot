// =============================================
// FOCUS RP - Spørsmålsbank v2
// Fødselsdato-validering + dype karakterspørsmål
// =============================================

const QUESTIONS = {

  // ─── GENERELLE SPØRSMÅL (alle søkere) ───────────────────────────────────────

  general: [
    {
      id: 'birthdate',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║           Spørsmål  1 / 9         ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `📅  **Fødselsdato**`,
        ``,
        `Hva er din fødselsdato?`,
        `Skriv i formatet **DD.MM.ÅÅÅÅ**`,
        ``,
        `*Eksempel: \`15.04.2001\`*`,
      ].join('\n'),
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
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║           Spørsmål  2 / 9         ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `📋  **Regler**`,
        ``,
        `Har du lest og forstått **alle** reglene til FOCUS RP?`,
        `Du finner dem i **#regler**-kanalen på Discord.`,
        ``,
        `Svar: \`ja\` eller \`nei\``,
      ].join('\n'),
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
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║           Spørsmål  3 / 9         ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🎮  **Roleplay-erfaring**`,
        ``,
        `Hva er din erfaring med RP fra før?`,
        ``,
        `*Vær ærlig — vi vurderer ikke etter erfaring, men etter ærlighet.*`,
        `*Minimum 40 tegn.*`,
      ].join('\n'),
      validate: (answer) => {
        if (answer.trim().length < 40) {
          return { pass: false, reason: `Gi et litt mer utfyllende svar om bakgrunnen din. (Minimum 40 tegn)` };
        }
        return { pass: true };
      }
    },

    {
      id: 'rp_definition',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║           Spørsmål  4 / 9         ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🧠  **RP-forståelse**`,
        ``,
        `Forklar med egne ord hva **MeRP** og **BreakRP** betyr,`,
        `og gi et eksempel på hvert.`,
        ``,
        `*Dette tester grunnleggende RP-forståelse.*`,
      ].join('\n'),
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Forklar begge begrepene og gi eksempler. (Minimum 60 tegn)` };
        }
        return { pass: true };
      }
    },

    {
      id: 'character_type',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║           Spørsmål  5 / 9         ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🎭  **Karaktertype**`,
        ``,
        `Hva slags karakter ønsker du å spille på FOCUS RP?`,
        ``,
        `\`lovlydig\`   →  Sivil, yrkesaktiv, lovtro karakter`,
        `\`kriminell\`  →  Karakter med kriminell bakgrunn/livsstil`,
        `\`nøytral\`    →  Blanding, eller vet ikke ennå`,
        ``,
        `*Svar med ett av alternativene over.*`,
      ].join('\n'),
      validate: (answer) => {
        const clean = answer.trim().toLowerCase();
        const map = {
          'lovlydig': 'lovlydig',
          'kriminell': 'kriminell',
          'nøytral': 'nøytral',
          'noytral': 'nøytral',
          'nøytral': 'nøytral'
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
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Lovlydig  ·   Spørsmål  6 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `📝  **Karakterbakgrunn**`,
        ``,
        `Hvem er karakteren din?`,
        `Fortell om **navn, alder, yrke og bakgrunnshistorie**.`,
        ``,
        `*Hva har denne personen opplevd? Hva driver dem?*`,
        `*Minimum 80 tegn.*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterhistorie. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_yrke_motivasjon',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Lovlydig  ·   Spørsmål  7 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `💼  **Yrke & Motivasjon**`,
        ``,
        `Hvilket yrke ønsker karakteren å ha, og **hvorfor nettopp dette**?`,
        ``,
        `*Ikke bare yrkestittel — hva betyr det for karakteren?*`,
        `*Hva ønsker de å oppnå gjennom det?*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Utdyp motivasjonen bak yrkesvalget. (Minimum 50 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_grense_scenario',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Lovlydig  ·   Spørsmål  8 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `⚖️  **Scenario — moralsk press**`,
        ``,
        `En kollega ber karakteren din om å se en annen vei på noe ulovlig`,
        `som gavner begge parter — og truer med å si opp dersom du ikke gjør det.`,
        ``,
        `**Hva gjør karakteren din, steg for steg?**`,
        ``,
        `*Vis beslutningsprosessen. Ikke hva "riktig svar" er — hva gjør DIN karakter?*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi et mer gjennomtenkt svar på scenarioet. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_rp_bidrag',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Lovlydig  ·   Spørsmål  9 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🌆  **Bidrag til serveren**`,
        ``,
        `Hva ønsker du å bidra med til FOCUS RP som lovlydig karakter?`,
        ``,
        `*Tenk på andre spillere, historier, og miljøet på serveren.*`,
        `*Hva skaper DU for andre?*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Utdyp hvordan du ønsker å bidra. (Minimum 50 tegn)` }
        : { pass: true }
    }
  ],

  // ─── KRIMINELL BRANCH ───────────────────────────────────────────────────────

  kriminell: [
    {
      id: 'kr_karakter',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║   Kriminell  ·   Spørsmål  6 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `📝  **Karakterbakgrunn**`,
        ``,
        `Hvem er karakteren din?`,
        `Fortell om **navn, alder og historien bak den kriminelle livsstilen**.`,
        ``,
        `*Hva har ført dem hit? Hva er drivkraften? Minimum 80 tegn.*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterhistorie. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_fearrp',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║   Kriminell  ·   Spørsmål  7 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `😰  **FearRP — Scenario**`,
        ``,
        `Karakteren din er alene og blir omringet av fire maskerte og bevæpnede`,
        `menn. De krever at du overlater bilen og alle verdisaker — nå.`,
        ``,
        `**Hva gjør karakteren din, og hva tenker de i øyeblikket?**`,
        ``,
        `*Vis din forståelse av FearRP og karakterens menneskelige reaksjoner.*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Utdyp svaret ditt. Vi vil se tankeprosessen. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_grenser',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║   Kriminell  ·   Spørsmål  8 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🚫  **Grenser for kriminell RP**`,
        ``,
        `Kriminell RP kan gå mange veier. Beskriv:`,
        ``,
        `→ Hva er du **komfortabel** med å RP-e?`,
        `→ Hva er dine **absolutte grenser**?`,
        `→ Hva er forskjellen på god kriminell RP og "griefer"-adferd?`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Vær mer konkret og utfyllende. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_rp_verdi',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║   Kriminell  ·   Spørsmål  9 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🎭  **RP-verdi for andre**`,
        ``,
        `Kriminell RP handler ikke bare om action for deg selv.`,
        ``,
        `**Gi et konkret eksempel på en RP-situasjon du ønsker å skape**`,
        `som gir verdi for ANDRE spillere — lovlydig eller kriminell.`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi et mer konkret og gjennomtenkt eksempel. (Minimum 80 tegn)` }
        : { pass: true }
    }
  ],

  // ─── NØYTRAL BRANCH ─────────────────────────────────────────────────────────

  'nøytral': [
    {
      id: 'nu_karakter',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Nøytral   ·   Spørsmål  6 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `📝  **Karakterkonsept**`,
        ``,
        `Hvem er karakteren din?`,
        `Fortell om **navn, alder, bakgrunn og personlighet**.`,
        ``,
        `*Hva gjør denne personen interessant? Minimum 80 tegn.*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterbeskrivelse. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_motivasjon',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Nøytral   ·   Spørsmål  7 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🌆  **Motivasjon**`,
        ``,
        `Hva bringer karakteren til Oslo, og hva holder dem der?`,
        ``,
        `*Hva søker karakteren — trygghet, penger, tilhørighet, hevn?*`,
        `*Vær spesifikk.*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Gi et mer utfyllende svar. (Minimum 50 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_moralsk_valg',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Nøytral   ·   Spørsmål  8 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `⚖️  **Moralsk valg**`,
        ``,
        `Karakteren din ser en nær venn stjele fra en fattig familiebedrift.`,
        `Vennen hevder de ikke hadde noe annet valg.`,
        ``,
        `**Hva gjør karakteren din — og hva sier det om hvem de er?**`,
        ``,
        `*Ingen fasit. Vi vil se karakterens indre logikk.*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Utdyp svaret og karakterens tankeprosess. (Minimum 60 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_rp_eksempel',
      question: [
        ``,
        `╔════════════════════════════════════╗`,
        `║        FOCUS RP  —  SØKNAD        ║`,
        `║    Nøytral   ·   Spørsmål  9 / 9  ║`,
        `╚════════════════════════════════════╝`,
        ``,
        `🎭  **Drømmescenario**`,
        ``,
        `Beskriv en konkret RP-situasjon du drømmer om å oppleve på FOCUS.`,
        ``,
        `*Hvem er involvert? Hva skjer? Hva er karakterens rolle?*`,
        `*Vær så spesifikk som mulig. Minimum 80 tegn.*`,
      ].join('\n'),
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi et mer konkret og detaljert scenario. (Minimum 80 tegn)` }
        : { pass: true }
    }
  ]
};

module.exports = QUESTIONS;
