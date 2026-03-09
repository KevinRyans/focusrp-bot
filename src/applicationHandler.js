// =============================================
// FOCUS RP - Søknadshåndtering v2
// DM-flyt, branching, deny med grunn, spør om mer
// =============================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const QUESTIONS = require('./questions');

// In-memory state
// Map<userId, { step, branch, answers, startedAt, dmChannelId }>
const activeApplications = new Map();

// Map<staffMessageId, userId> — for å koble staff-handling til søker
const staffMessageMap = new Map();

// Map<userId, dmChannelId> — for "spør om mer"-flow
const dmChannelCache = new Map();

// Map<userId, { staffMessageId, staffChannelId }> — venter på svar til staff-spørsmål
const pendingStaffReplies = new Map();

const TIMEOUT_MS = (parseInt(process.env.APPLICATION_TIMEOUT_MINUTES) || 30) * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [userId, app] of activeApplications.entries()) {
    if (now - app.startedAt > TIMEOUT_MS) {
      activeApplications.delete(userId);
      console.log(`[Timeout] Søknad fra ${userId} slettet pga inaktivitet.`);
    }
  }
}, 5 * 60 * 1000);


// ─── START SØKNAD ───────────────────────────────────────────────────────────

async function startApplication(user) {
  if (activeApplications.has(user.id)) {
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE8B84B)
          .setDescription(`⚠️ Du har allerede en aktiv søknad. Svar på spørsmålet i DM-en, eller vent til søknaden utløper etter ${process.env.APPLICATION_TIMEOUT_MINUTES || 30} minutter.`)
      ]
    }).catch(() => {});
    return;
  }

  activeApplications.set(user.id, {
    step: 0,
    branch: null,
    answers: {},
    startedAt: Date.now()
  });

  // Cache DM-channel for later (spør om mer)
  const dmChannel = await user.createDM().catch(() => null);
  if (dmChannel) dmChannelCache.set(user.id, dmChannel.id);

  try {
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1A1A2E)
          .setAuthor({ name: 'FOCUS RP — Whitelist', iconURL: 'https://focusrp.no/favicon.ico' })
          .setTitle('Velkommen til FOCUS RP')
          .setDescription(
            `**Rollespill på ordentlig.**\n\n` +
            `Du har startet søknadsprosessen for FOCUS RP.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `**Slik fungerer det:**\n` +
            `→ **9 spørsmål** totalt\n` +
            `→ Svar direkte i denne DM-chatten\n` +
            `→ Du har **${process.env.APPLICATION_TIMEOUT_MINUTES || 30} min** per spørsmål\n` +
            `→ Søknaden behandles av staff innen 24 timer\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Trykk på knappen under for å starte.`
          )
          .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' })
          .setTimestamp()
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
  }
}


// ─── EMBED HELPER ───────────────────────────────────────────────────────────

function buildQuestionEmbed(q, stepNumber, branch) {
  const branchColors = {
    lovlydig:  0x4A90D9,
    kriminell: 0xE05252,
    'nøytral': 0x9B9B9B
  };
  const color = branchColors[branch] || 0x1A1A2E;

  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: `FOCUS RP — Søknad  ·  Spørsmål ${stepNumber}/9` })
    .setTitle(q.title)
    .setDescription(q.description)
    .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' });
}


// ─── SEND NESTE SPØRSMÅL ────────────────────────────────────────────────────

async function sendNextQuestion(user) {
  const app = activeApplications.get(user.id);
  if (!app) return;

  const generalQuestions = QUESTIONS.general;
  const totalGeneralSteps = generalQuestions.length;

  if (app.step < totalGeneralSteps) {
    const q = generalQuestions[app.step];
    await user.send({ embeds: [buildQuestionEmbed(q, app.step + 1, null)] });
    return;
  }

  if (app.branch) {
    const branchQuestions = QUESTIONS[app.branch];
    const branchStep = app.step - totalGeneralSteps;
    if (branchStep < branchQuestions.length) {
      const q = branchQuestions[branchStep];
      await user.send({ embeds: [buildQuestionEmbed(q, app.step + 1, app.branch)] });
      return;
    }
    await finishApplication(user);
    return;
  }
}


// ─── BEHANDLE SVAR ──────────────────────────────────────────────────────────

async function handleAnswer(message) {
  const user = message.author;
  const app = activeApplications.get(user.id);
  if (!app) return false;

  const generalQuestions = QUESTIONS.general;
  const totalGeneralSteps = generalQuestions.length;
  let currentQuestion;

  if (app.step < totalGeneralSteps) {
    currentQuestion = generalQuestions[app.step];
  } else if (app.branch) {
    const branchQuestions = QUESTIONS[app.branch];
    const branchStep = app.step - totalGeneralSteps;
    currentQuestion = branchQuestions[branchStep];
  }

  if (!currentQuestion) return false;

  const validation = currentQuestion.validate
    ? currentQuestion.validate(message.content)
    : { pass: true };

  if (!validation.pass) {
    if (validation.autoReject) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE05252)
            .setTitle('❌ Søknad avslått')
            .setDescription(validation.reason)
            .setFooter({ text: 'FOCUS RP  ·  focusrp.no' })
        ]
      });
      activeApplications.delete(user.id);
      console.log(`[AutoReject] ${user.tag} ble automatisk avslått.`);
      return true;
    }
    await message.reply(`⚠️ ${validation.reason}\n\nPrøv igjen:`);
    return true;
  }

  app.answers[currentQuestion.id] = message.content;
  if (validation.branch) app.branch = validation.branch;
  app.step++;
  activeApplications.set(user.id, app);

  await message.react('✅');
  await sendNextQuestion(user);
  return true;
}


// ─── FULLFØR SØKNAD ─────────────────────────────────────────────────────────

async function finishApplication(user) {
  const app = activeApplications.get(user.id);
  if (!app) return;
  activeApplications.delete(user.id);

  await user.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE8B84B)
        .setAuthor({ name: 'FOCUS RP — Whitelist', iconURL: 'https://focusrp.no/favicon.ico' })
        .setTitle('📨 Søknad mottatt')
        .setDescription(
          `Takk for at du søkte på **FOCUS RP**, ${user.username}!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Søknaden din er sendt til staff og vil bli behandlet\n` +
          `så snart som mulig — vanligvis innen **24 timer**.\n\n` +
          `Du vil motta en DM her når søknaden er behandlet.\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' })
        .setTimestamp()
    ]
  });

  await postToStaffChannel(user, app);
}


// ─── POST TIL STAFF-KANAL ───────────────────────────────────────────────────

async function postToStaffChannel(user, app) {
  const staffChannelId = process.env.STAFF_CHANNEL_ID;
  const staffChannel = global.botClient?.channels.cache.get(staffChannelId);

  if (!staffChannel) {
    console.error('[Error] Staff-kanalen ikke funnet! Sjekk STAFF_CHANNEL_ID i .env');
    return;
  }

  const allQuestions = [
    ...QUESTIONS.general,
    ...(QUESTIONS[app.branch] || [])
  ];

  const fields = allQuestions
    .filter(q => app.answers[q.id])
    .map(q => {
      const descTruncated = q.description.substring(0, 200);
      const answer = app.answers[q.id];
      const value = `**Spørsmål:** ${descTruncated}\n**Svar:** ${answer}`;
      return {
        name: q.title,
        value: value.substring(0, 1024),
        inline: false
      };
    });

  const branchConfig = {
    lovlydig:  { color: 0x4A90D9, label: '🔵 Lovlydig',  emoji: '🔵' },
    kriminell: { color: 0xE05252, label: '🔴 Kriminell', emoji: '🔴' },
    'nøytral': { color: 0x9B9B9B, label: '⚪ Nøytral',   emoji: '⚪' }
  };
  const bc = branchConfig[app.branch] || { color: 0x1A1A2E, label: 'Ukjent', emoji: '❓' };

  const embed = new EmbedBuilder()
    .setColor(bc.color)
    .setAuthor({ name: 'FOCUS RP — Ny søknad', iconURL: 'https://focusrp.no/favicon.ico' })
    .setTitle(`${bc.emoji}  ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 Søker',        value: `<@${user.id}> \`(${user.id})\``, inline: true },
      { name: '🎭 Karaktertype', value: bc.label,                          inline: true },
      { name: '📅 Sendt',        value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      { name: '─────────────────────────────────', value: '_ _', inline: false },
      ...fields
    )
    .setFooter({ text: 'FOCUS RP Whitelist System  ·  focusrp.no' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_${user.id}`)
      .setLabel('Godkjenn → Intervju')
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

  const staffMsg = await staffChannel.send({ embeds: [embed], components: [row] });
  staffMessageMap.set(staffMsg.id, user.id);
  console.log(`[Application] Søknad fra ${user.tag} (${app.branch}) postet til staff.`);
}


// ─── EXPORTS ────────────────────────────────────────────────────────────────

module.exports = {
  startApplication,
  sendNextQuestion,
  handleAnswer,
  activeApplications,
  staffMessageMap,
  dmChannelCache,
  pendingStaffReplies
};
