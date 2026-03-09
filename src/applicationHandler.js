// =============================================
// FOCUS RP - Søknadshåndtering
// Styrer DM-flyten og søknadstilstand
// =============================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const QUESTIONS = require('./questions');

// In-memory state for aktive søknader
// Map<userId, { step, branch, answers, startedAt }>
const activeApplications = new Map();

const TIMEOUT_MS = (parseInt(process.env.APPLICATION_TIMEOUT_MINUTES) || 30) * 60 * 1000;

// Rydder opp søknader som har timet ut
setInterval(() => {
  const now = Date.now();
  for (const [userId, app] of activeApplications.entries()) {
    if (now - app.startedAt > TIMEOUT_MS) {
      activeApplications.delete(userId);
      console.log(`[Timeout] Søknad fra ${userId} slettet pga inaktivitet.`);
    }
  }
}, 5 * 60 * 1000); // Sjekk hvert 5. minutt


// --- START SØKNAD ---
async function startApplication(user) {
  if (activeApplications.has(user.id)) {
    await user.send(`⚠️ Du har allerede en aktiv søknad i gang. Svar på forrige spørsmål, eller vent til søknaden utløper etter ${process.env.APPLICATION_TIMEOUT_MINUTES || 30} minutter.`);
    return;
  }

  activeApplications.set(user.id, {
    step: 0,
    branch: null,
    answers: {},
    startedAt: Date.now()
  });

  try {
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2B2D31)
          .setTitle('🎮 Velkommen til FOCUS RP Whitelist-søknad')
          .setDescription(
            `Hei **${user.username}**! Du har startet søknadsprosessen for FOCUS RP.\n\n` +
            `**Slik fungerer det:**\n` +
            `→ Du vil få **8 spørsmål** totalt\n` +
            `→ Svar direkte i denne DM-chatten\n` +
            `→ Du har **${process.env.APPLICATION_TIMEOUT_MINUTES || 30} minutter** per spørsmål\n` +
            `→ Noen svar filtreres automatisk – vær ærlig\n\n` +
            `Søknaden din vil bli gjennomgått av staff så fort som mulig.\n\n` +
            `*Trykk på knappen under for å starte.*`
          )
          .setFooter({ text: 'FOCUS RP | focusrp.no' })
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('begin_application')
            .setLabel('Start søknaden')
            .setStyle(ButtonStyle.Success)
            .setEmoji('▶️')
        )
      ]
    });
  } catch (err) {
    console.error(`[Error] Kunne ikke sende DM til ${user.tag}:`, err.message);
    // DMs er kanskje lukket
  }
}


// --- SEND NESTE SPØRSMÅL ---
async function sendNextQuestion(user) {
  const app = activeApplications.get(user.id);
  if (!app) return;

  const generalQuestions = QUESTIONS.general;
  const totalGeneralSteps = generalQuestions.length;

  // Er vi i general-fasen?
  if (app.step < totalGeneralSteps) {
    const q = generalQuestions[app.step];
    await user.send(q.question);
    return;
  }

  // Er vi i branch-fasen?
  if (app.branch) {
    const branchQuestions = QUESTIONS[app.branch];
    const branchStep = app.step - totalGeneralSteps;

    if (branchStep < branchQuestions.length) {
      const q = branchQuestions[branchStep];
      await user.send(q.question);
      return;
    }

    // Alle spørsmål besvart
    await finishApplication(user);
    return;
  }
}


// --- BEHANDLE SVAR ---
async function handleAnswer(message) {
  const user = message.author;
  const app = activeApplications.get(user.id);

  if (!app) return false; // Ingen aktiv søknad

  const generalQuestions = QUESTIONS.general;
  const totalGeneralSteps = generalQuestions.length;
  let currentQuestion;

  // Hent riktig spørsmål
  if (app.step < totalGeneralSteps) {
    currentQuestion = generalQuestions[app.step];
  } else if (app.branch) {
    const branchQuestions = QUESTIONS[app.branch];
    const branchStep = app.step - totalGeneralSteps;
    currentQuestion = branchQuestions[branchStep];
  }

  if (!currentQuestion) return false;

  // Valider svaret
  const validation = currentQuestion.validate ? currentQuestion.validate(message.content) : { pass: true };

  if (!validation.pass) {
    // Auto-avslag (f.eks. for ung, ikke lest regler)
    if (validation.autoReject) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF4444)
            .setTitle('❌ Søknad avslått')
            .setDescription(validation.reason)
            .setFooter({ text: 'FOCUS RP | focusrp.no' })
        ]
      });
      activeApplications.delete(user.id);
      console.log(`[AutoReject] ${user.tag} ble automatisk avslått.`);
      return true;
    }

    // Valideringsfeil – be om nytt svar
    await message.reply(`⚠️ ${validation.reason}\n\nProv igjen:`);
    return true;
  }

  // Lagre svaret
  app.answers[currentQuestion.id] = message.content;

  // Sett branch hvis karakter-type ble valgt
  if (validation.branch) {
    app.branch = validation.branch;
  }

  // Gå til neste steg
  app.step++;
  activeApplications.set(user.id, app);

  // Bekreft og send neste spørsmål
  await message.react('✅');
  await sendNextQuestion(user);
  return true;
}


// --- FULLFØR SØKNAD ---
async function finishApplication(user) {
  const app = activeApplications.get(user.id);
  if (!app) return;

  activeApplications.delete(user.id);

  // Bekreft til søker
  await user.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('📨 Søknad mottatt!')
        .setDescription(
          `Takk for at du søkte på FOCUS RP, **${user.username}**!\n\n` +
          `Søknaden din er nå sendt til staff og vil bli behandlet så snart som mulig.\n\n` +
          `Du vil motta en melding her i DM når søknaden er behandlet.\n\n` +
          `*Gjennomsnittlig behandlingstid: 24 timer*`
        )
        .setFooter({ text: 'FOCUS RP | focusrp.no' })
    ]
  });

  // Post til staff-kanal
  await postToStaffChannel(user, app);
}


// --- POST TIL STAFF-KANAL ---
async function postToStaffChannel(user, app, client) {
  // client injiseres via module.exports
  const staffChannelId = process.env.STAFF_CHANNEL_ID;
  const staffChannel = global.botClient?.channels.cache.get(staffChannelId);

  if (!staffChannel) {
    console.error('[Error] Staff-kanalen ble ikke funnet! Sjekk STAFF_CHANNEL_ID i .env');
    return;
  }

  // Bygg svar-fields
  const allQuestions = [
    ...QUESTIONS.general,
    ...(QUESTIONS[app.branch] || [])
  ];

  const fields = allQuestions
    .filter(q => app.answers[q.id])
    .map(q => {
      // Hent spørsmålsteksten (fjern discord markdown formatering)
      const cleanQuestion = q.question
        .replace(/\*\*/g, '')
        .split('\n')[0]
        .replace(/^[^\—]+— /, '');

      return {
        name: cleanQuestion.substring(0, 100),
        value: app.answers[q.id].substring(0, 1024) || '*Ikke besvart*',
        inline: false
      };
    });

  // Branch-farge
  const branchColors = {
    lovlydig: 0x4488FF,
    kriminell: 0xFF4444,
    nøytral: 0xAAAAAA
  };

  const branchEmojis = {
    lovlydig: '🔵 Lovlydig',
    kriminell: '🔴 Kriminell',
    nøytral: '⚪ Nøytral'
  };

  const embed = new EmbedBuilder()
    .setColor(branchColors[app.branch] || 0x2B2D31)
    .setTitle(`📋 Ny søknad — ${user.tag}`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: '👤 Søker', value: `<@${user.id}> (${user.id})`, inline: true },
      { name: '🎭 Karaktertype', value: branchEmojis[app.branch] || 'Ukjent', inline: true },
      { name: '📅 Sendt', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      { name: '\u200B', value: '\u200B', inline: false },
      ...fields
    )
    .setFooter({ text: 'FOCUS RP Whitelist System | focusrp.no' });

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_${user.id}`)
      .setLabel('Godkjenn')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId(`deny_${user.id}`)
      .setLabel('Avslå')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌'),
    new ButtonBuilder()
      .setCustomId(`question_${user.id}`)
      .setLabel('Spør om mer')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('💬')
  );

  await staffChannel.send({ embeds: [embed], components: [actionRow] });
  console.log(`[Application] Søknad fra ${user.tag} (${app.branch}) postet til staff.`);
}


module.exports = {
  startApplication,
  sendNextQuestion,
  handleAnswer,
  activeApplications
};
