// =============================================
// FOCUS RP - Spørsmålsbank med branching-logikk
// Rediger spørsmålene her etter behov
// =============================================

const QUESTIONS = {

  // --- GENERELLE SPØRSMÅL (alle søkere) ---
  general: [
    {
      id: 'age',
      question: `👤 **Spørsmål 1/8 — Alder**\n\nHva er alderen din?\n\n*Skriv kun tallet, f.eks: \`19\`*`,
      validate: (answer) => {
        const age = parseInt(answer.trim());
        const minAge = parseInt(process.env.MIN_AGE) || 16;
        if (isNaN(age)) {
          return { pass: false, reason: `Skriv alderen din som et tall.` };
        }
        if (age < minAge) {
          return {
            pass: false,
            autoReject: true,
            reason: `Du må være minst **${minAge} år** for å søke på FOCUS RP. Søknaden din er avslått automatisk.`
          };
        }
        return { pass: true };
      }
    },
    {
      id: 'rules_read',
      question: `📋 **Spørsmål 2/8 — Regler**\n\nHar du lest og forstått **alle reglene** til FOCUS RP?\n\n*Svar: \`ja\` eller \`nei\`*`,
      validate: (answer) => {
        if (answer.trim().toLowerCase() !== 'ja') {
          return {
            pass: false,
            autoReject: true,
            reason: `Du må lese reglene før du søker. Finn dem i **#regler**-kanalen, og søk på nytt når du har lest dem.`
          };
        }
        return { pass: true };
      }
    },
    {
      id: 'rp_experience',
      question: `🎮 **Spørsmål 3/8 — RP-erfaring**\n\nHva er din erfaring med roleplay fra før?\n\n*Vær ærlig – vi vurderer ikke etter erfaring, men etter ærlighet. Minimum 30 tegn.*`,
      validate: (answer) => {
        if (answer.trim().length < 30) {
          return { pass: false, reason: `Gi et mer utfyllende svar. Fortell oss litt mer om din bakgrunn.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'character_type',
      question: `🎭 **Spørsmål 4/8 — Karaktertype**\n\nHva slags karakter ønsker du å spille på FOCUS RP?\n\nSvar med ett av følgende:\n\`lovlydig\` — Sivil, politi, lege, mekaniker, etc.\n\`kriminell\` — Kriminell bakgrunn og livsstil\n\`nøytral\` — En blanding, eller vet ikke ennå`,
      validate: (answer) => {
        const clean = answer.trim().toLowerCase();
        const valid = ['lovlydig', 'kriminell', 'nøytral'];
        if (!valid.includes(clean)) {
          return { pass: false, reason: `Svar med \`lovlydig\`, \`kriminell\` eller \`nøytral\`.` };
        }
        return { pass: true, branch: clean };
      }
    }
  ],

  // --- LOVLYDIG BRANCH ---
  lovlydig: [
    {
      id: 'lv_name_backstory',
      question: `📝 **Spørsmål 5/8 — Karakterbakgrunn (Lovlydig)**\n\nHva heter karakteren din, og hva er bakgrunnshistorien?\n\n*Hvem er denne personen? Hva har de opplevd? Minimum 60 tegn.*`,
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Gi en mer detaljert karakterbakgrunn. Vi vil virkelig forstå hvem karakteren din er.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'lv_job',
      question: `💼 **Spørsmål 6/8 — Yrke**\n\nHva slags yrke ønsker karakteren din å ha på serveren?\n\n*Vær spesifikk. Har karakteren drømt om dette, eller er det noe de havner i?*`,
      validate: (answer) => {
        if (answer.trim().length < 20) {
          return { pass: false, reason: `Utdyp svaret ditt litt mer.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'lv_scenario',
      question: `⚖️ **Spørsmål 7/8 — Scenario**\n\nEn nær venn ber karakteren din om hjelp med noe ulovlig for å redde familien sin fra gjeld. Ingen vil få vite det.\n\nHvordan reagerer og handler karakteren din?\n\n*Vis oss din RP-tankegang.*`,
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Utdyp scenariosvaret ditt. Vi vil se tankeprosessen din.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'lv_goals',
      question: `🎯 **Spørsmål 8/8 — Mål**\n\nHva er de langsiktige målene til karakteren din?\n\n*Hva ønsker du å bygge opp og oppleve over tid på serveren?*`,
      validate: (answer) => {
        if (answer.trim().length < 30) {
          return { pass: false, reason: `Gi et mer utfyllende svar.` };
        }
        return { pass: true };
      }
    }
  ],

  // --- KRIMINELL BRANCH ---
  kriminell: [
    {
      id: 'kr_name_backstory',
      question: `📝 **Spørsmål 5/8 — Karakterbakgrunn (Kriminell)**\n\nHva heter karakteren din, og hva er historien bak den kriminelle livsstilen?\n\n*Hvordan havnet de her? Hva driver dem? Minimum 60 tegn.*`,
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Gi en mer detaljert karakterbakgrunn.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'kr_limits',
      question: `🚫 **Spørsmål 6/8 — Grenser**\n\nHva er dine grenser for kriminell RP?\n\n*Hva er du komfortabel med, og hva er du ikke? Tenk på: vold mot tilfeldige sivile, kidnapping, tortur, seksuelle temaer i RP, etc.*`,
      validate: (answer) => {
        if (answer.trim().length < 40) {
          return { pass: false, reason: `Vær mer spesifikk på grensene dine.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'kr_fearrp_scenario',
      question: `😰 **Spørsmål 7/8 — FearRP Scenario**\n\nKarakteren din er alene og blir omringet av 4 bevæpnede fiender. De krever at du legger fra deg våpenet.\n\nHva gjør karakteren din?\n\n*Dette tester din forståelse av FearRP og realistisk RP.*`,
      validate: (answer) => {
        if (answer.trim().length < 40) {
          return { pass: false, reason: `Utdyp svaret ditt.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'kr_rp_value',
      question: `🎭 **Spørsmål 8/8 — RP-verdi**\n\nKriminell RP handler ikke bare om action. Hvordan planlegger du å skape verdifulle og interessante RP-situasjoner for **andre spillere**, ikke bare deg selv?`,
      validate: (answer) => {
        if (answer.trim().length < 40) {
          return { pass: false, reason: `Vi vil se mer refleksjon rundt dette.` };
        }
        return { pass: true };
      }
    }
  ],

  // --- NØYTRAL BRANCH ---
  nøytral: [
    {
      id: 'nu_name_backstory',
      question: `📝 **Spørsmål 5/8 — Karakterkonsept**\n\nHva heter karakteren din, og hvem er denne personen?\n\n*Beskriv karakterkonseptet med egne ord. Minimum 60 tegn.*`,
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Gi en mer detaljert beskrivelse av karakteren din.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'nu_motivation',
      question: `🌆 **Spørsmål 6/8 — Motivasjon**\n\nHva bringer karakteren din til byen, og hva holder dem her?\n\n*Hva søker karakteren etter?*`,
      validate: (answer) => {
        if (answer.trim().length < 30) {
          return { pass: false, reason: `Gi et mer utfyllende svar.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'nu_rp_example',
      question: `🤝 **Spørsmål 7/8 — RP-eksempel**\n\nGi et konkret eksempel på en RP-situasjon du ønsker å skape eller delta i på serveren.\n\n*Vær spesifikk – ikke "kul RP", men faktisk hva som skjer.*`,
      validate: (answer) => {
        if (answer.trim().length < 60) {
          return { pass: false, reason: `Gi et mer konkret og detaljert eksempel.` };
        }
        return { pass: true };
      }
    },
    {
      id: 'nu_morality',
      question: `⚖️ **Spørsmål 8/8 — Moralsk scenario**\n\nKarakteren din vitner til at en person du er blitt kjent med begår en forbrytelse mot en uskyldig. Politiet er ikke i nærheten.\n\nHva gjør karakteren din, og hvorfor?\n\n*Ingen rett eller galt svar – vi vil se tankegangen din.*`,
      validate: (answer) => {
        if (answer.trim().length < 40) {
          return { pass: false, reason: `Utdyp svaret ditt.` };
        }
        return { pass: true };
      }
    }
  ]
};

module.exports = QUESTIONS;
