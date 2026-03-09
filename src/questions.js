// =============================================
// FOCUS RP - Spørsmålsbank v3
// Scenario-basert, naturlig norsk, tester RP-forståelse
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
      title: '🎮 RP-bakgrunn',
      description:
        `Hva har du spilt av RP fra før?\n\n` +
        `Vær ærlig. Vi straffer ikke folk som er nye — vi merker bare raskt om noen overdriver.\n\n` +
        `*Minimum 40 tegn.*`,
      validate: (answer) => {
        if (answer.trim().length < 40) {
          return { pass: false, reason: `Gi et litt mer utfyllende svar. (Minimum 40 tegn)` };
        }
        return { pass: true };
      }
    },

    {
      id: 'rp_definition',
      title: '🧠 Scenario — metagaming',
      description:
        `Du sitter i en RP-scene. En Discord-venn sender deg melding og forteller deg akkurat hva som venter rundt hjørnet — info karakteren din umulig kan vite.\n\n` +
        `**To spørsmål:**\n` +
        `→ Hva heter regelbruddet det ville vært å bruke denne infoen IC?\n` +
        `→ Hva gjør du med meldingen?`,
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Svar på begge spørsmålene. (Minimum 60 tegn)` };
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
        `Hvem er karakteren din?\n\n` +
        `Navn, alder, hva de gjør til daglig — og det viktigste: hva er historien bak dem? ` +
        `Hva har skjedd i livet deres som gjør dem til den de er?\n\n` +
        `*Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterhistorie. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_fearrp',
      title: '😰 Scenario — FearRP',
      description:
        `Karakteren din er alene på en øde parkeringsplass sent på kvelden. To maskerte menn nærmer seg og sier: *«Gi oss bilen og lommeboka, nå.»*\n\n` +
        `En del av deg tenker at det bare er et spill og vil bare kjøre vekk.\n\n` +
        `**Hva gjør karakteren din, og hva heter prinsippet du bryter dersom du ignorerer trusselen?**`,
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Svar på begge deler. (Minimum 60 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_rdm',
      title: '🚗 Scenario — RDM/VDM',
      description:
        `Du kjører rolig nedover gaten. En bil begynner å ramme deg gjentatte ganger, sjåføren hopper ut og skyter mot deg — uten ett ord RP-messig.\n\n` +
        `**Hva heter dette regelrubruddet, og hva gjør du (IC og OOC)?**`,
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Svar på begge deler. (Minimum 60 tegn)` }
        : { pass: true }
    },

    {
      id: 'lv_rp_bidrag',
      title: '🌆 Bidrag til serveren',
      description:
        `Hva ønsker du å bidra med til FOCUS RP som lovlydig karakter?\n\n` +
        `Ikke "jeg vil ha det gøy" — tenk på de andre spillerne. Hva skaper du for dem?`,
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Utdyp litt mer. (Minimum 50 tegn)` }
        : { pass: true }
    }
  ],

  // ─── KRIMINELL BRANCH ───────────────────────────────────────────────────────

  kriminell: [
    {
      id: 'kr_karakter',
      title: '📝 Karakterbakgrunn',
      description:
        `Hvem er karakteren din?\n\n` +
        `Navn, alder, og det viktigste: hva er veien som førte dem til kriminalitet? ` +
        `«Han er bare slik» holder ikke — gi oss noe å tro på.\n\n` +
        `*Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterhistorie. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_rdm',
      title: '🔫 Scenario — RDM',
      description:
        `En bekjent i miljøet ditt foreslår å kjøre forbi en tilfeldig gruppe folk og skyte mot dem — ingen RP-grunn, «bare for moro».\n\n` +
        `**Hva heter dette regelrubruddet, og hva sier/gjør karakteren din?**`,
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Svar på begge deler. (Minimum 60 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_fearrp',
      title: '😰 Scenario — FearRP',
      description:
        `Karakteren din er alene og blir omringet av fire bevæpnede menn. De krever bilen og alle verdisaker.\n\n` +
        `Karakteren din er «tough» — du vil argumentere tilbake.\n\n` +
        `**Hva gjør karakteren din, og hvorfor er det feil å ikke vise frykt her?**`,
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Utdyp svaret. (Minimum 60 tegn)` }
        : { pass: true }
    },

    {
      id: 'kr_rp_verdi',
      title: '🎭 RP-verdi for andre',
      description:
        `Kriminell RP er ikke bare action for deg selv.\n\n` +
        `Gi oss et konkret eksempel på en situasjon du vil skape på serveren — en scene som gir noe til ANDRE spillere, enten de er kriminelle eller ikke.`,
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Gi et mer konkret eksempel. (Minimum 60 tegn)` }
        : { pass: true }
    }
  ],

  // ─── NØYTRAL BRANCH ─────────────────────────────────────────────────────────

  'nøytral': [
    {
      id: 'nu_karakter',
      title: '📝 Karakterkonsept',
      description:
        `Hvem er karakteren din?\n\n` +
        `Navn, alder, bakgrunn. En nøytral karakter kan fort bli uklar — ` +
        `overbevis oss om at denne personen har en tydelig identitet.\n\n` +
        `*Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi en mer detaljert karakterbeskrivelse. (Minimum 80 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_metagaming',
      title: '🧠 Scenario — metagaming',
      description:
        `Du handler med noen du aldri har møtt IC. OOC kjenner du dem fra Discord — du vet at de egentlig jobber undercover for politiet.\n\n` +
        `**Hva heter det dersom du bruker denne infoen IC, og hva gjør du?**`,
      validate: (a) => a.trim().length < 60
        ? { pass: false, reason: `Svar på begge deler. (Minimum 60 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_failrp',
      title: '🚨 Scenario — FailRP',
      description:
        `Karakteren din er involvert i en bilulykke. Bilen er vraket og du er skadet RP-messig. En annen spiller stopper og tilbyr hjelp — men du hopper bare inn i en ny bil og kjører avgårde som om ingenting har skjedd.\n\n` +
        `**Hva er galt med dette, og hva heter regelrubruddet?**`,
      validate: (a) => a.trim().length < 50
        ? { pass: false, reason: `Forklar hva som er galt. (Minimum 50 tegn)` }
        : { pass: true }
    },

    {
      id: 'nu_rp_eksempel',
      title: '🎭 Drømmescenario',
      description:
        `Beskriv en konkret RP-situasjon du drømmer om å oppleve på FOCUS.\n\n` +
        `Hvem er involvert? Hva skjer? Hva er karakterens rolle?\n` +
        `Vær spesifikk — «noe kult» teller ikke.\n\n` +
        `*Minimum 80 tegn.*`,
      validate: (a) => a.trim().length < 80
        ? { pass: false, reason: `Gi et mer konkret og detaljert scenario. (Minimum 80 tegn)` }
        : { pass: true }
    }
  ]
};

module.exports = QUESTIONS;
