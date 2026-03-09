// =============================================
// FOCUS RP - Whitelist Bot v2
// Modal deny, spør om mer, intervju-flow, pen embed
// =============================================

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType
} = require('discord.js');

const {
  startApplication,
  handleAnswer,
  activeApplications,
  staffMessageMap,
  dmChannelCache,
  pendingStaffReplies
} = require('./applicationHandler');

// ─── CLIENT ─────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message]
});

global.botClient = client;

// ─── KLAR ───────────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅  FOCUS RP Bot er online som ${client.user.tag}`);
  client.user.setActivity('focusrp.no', { type: 3 }); // Watching
  await setupApplicationChannel();
});

// ─── SØKNADSKANAL SETUP ─────────────────────────────────────────────────────

async function setupApplicationChannel() {
  const channelId = process.env.APPLICATION_CHANNEL_ID;
  if (!channelId) { console.warn('[Warn] APPLICATION_CHANNEL_ID ikke satt.'); return; }

  const channel = client.channels.cache.get(channelId);
  if (!channel) { console.error('[Error] Søknadskanal ikke funnet.'); return; }

  // Slett botens egne gamle meldinger
  try {
    const msgs = await channel.messages.fetch({ limit: 20 });
    for (const m of msgs.values()) {
      if (m.author.id === client.user.id) await m.delete().catch(() => {});
    }
  } catch {}

  // ── EMBED ──
  const embed = new EmbedBuilder()
    .setColor(0x1A1A2E)
    .setAuthor({
      name: 'FOCUS RP — Whitelist',
      iconURL: 'https://focusrp.no/favicon.ico'
    })
    .setTitle('Rollespill på *ordentlig*')
    .setDescription(
      `FOCUS er en norsk FiveM-server for deg som vil ha mer enn bare skyte og kjøre.\n` +
      `Her bygger du en karakter, skriver en historie og er del av noe større.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `**📋  Søknadsprosessen**\n` +
      `\`01\`  Fyll ut søknaden i DM med boten\n` +
      `\`02\`  Staff behandler søknaden din\n` +
      `\`03\`  Bestå intervju — og du er inn\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `**⚠️  Krav**\n` +
      `→  Minimum **${process.env.MIN_AGE || 16} år**\n` +
      `→  Lest og forstått alle **#regler**\n` +
      `→  Ønsker seriøst og kvalitetsrikt RP\n\n` +
      `*Søknaden tar ca. 10–15 minutter.*`
    )
    .setImage('https://focusrp.no/banner.png')
    .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('start_application')
      .setLabel('Søk om whitelist')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📋')
  );

  await channel.send({ embeds: [embed], components: [row] });
  console.log(`[Setup] Søknadsknapp postet i #${channel.name}`);
}

// ─── INTERAKSJONER ──────────────────────────────────────────────────────────

client.on('interactionCreate', async (interaction) => {

  // ── KNAPPER ──
  if (interaction.isButton()) {
    const { customId, user } = interaction;
    const guild = client.guilds.cache.get(process.env.GUILD_ID);

    // Start søknad
    if (customId === 'start_application') {
      await interaction.reply({ content: `📩 Søknaden er startet i DM! Sjekk meldingene dine fra boten.`, ephemeral: true });
      await startApplication(user);
      return;
    }

    // Begin (etter intro-melding i DM)
    if (customId === 'begin_application') {
      await interaction.update({ components: [] });
      const { sendNextQuestion } = require('./applicationHandler');
      await sendNextQuestion(user);
      return;
    }

    // ── GODKJENN ──
    if (customId.startsWith('accept_')) {
      const targetId = customId.replace('accept_', '');
      await handleAccept(interaction, targetId, guild);
      return;
    }

    // ── AVSLÅ (åpner modal for grunn) ──
    if (customId.startsWith('deny_')) {
      const targetId = customId.replace('deny_', '');

      const modal = new ModalBuilder()
        .setCustomId(`deny_modal_${targetId}`)
        .setTitle('Avslå søknad — skriv grunn');

      const reasonInput = new TextInputBuilder()
        .setCustomId('deny_reason')
        .setLabel('Grunn for avslag (sendes til søkeren)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('F.eks: Søknaden mangler tilstrekkelig karakterdybde. Vi ønsker at du jobber mer med bakgrunnshistorien og prøver igjen...')
        .setMinLength(10)
        .setMaxLength(500)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      await interaction.showModal(modal);
      return;
    }

    // ── SPØR OM MER ──
    if (customId.startsWith('question_')) {
      const targetId = customId.replace('question_', '');

      const modal = new ModalBuilder()
        .setCustomId(`question_modal_${targetId}`)
        .setTitle('Spørsmål til søker');

      const questionInput = new TextInputBuilder()
        .setCustomId('staff_question')
        .setLabel('Melding/spørsmål til søkeren')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('F.eks: Kan du utdype karakterens bakgrunnshistorie litt mer? Vi vil gjerne vite mer om...')
        .setMinLength(10)
        .setMaxLength(500)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(questionInput));
      await interaction.showModal(modal);
      return;
    }
  }

  // ── MODALS ──
  if (interaction.isModalSubmit()) {
    const { customId, user } = interaction;

    // Avslå med grunn
    if (customId.startsWith('deny_modal_')) {
      const targetId = customId.replace('deny_modal_', '');
      const reason = interaction.fields.getTextInputValue('deny_reason');
      await handleDeny(interaction, targetId, reason);
      return;
    }

    // Spørsmål til søker
    if (customId.startsWith('question_modal_')) {
      const targetId = customId.replace('question_modal_', '');
      const question = interaction.fields.getTextInputValue('staff_question');
      await handleStaffQuestion(interaction, targetId, question);
      return;
    }
  }
});

// ─── GODKJENN → INTERVJU ────────────────────────────────────────────────────

async function handleAccept(interaction, targetId, guild) {
  // Gi intervju-rolle (ikke whitelist-rolle ennå)
  const interviewRoleId = process.env.INTERVIEW_ROLE_ID;
  let member;
  try {
    member = await guild.members.fetch(targetId);
    if (interviewRoleId) {
      await member.roles.add(interviewRoleId);
    }
  } catch (err) {
    console.error(`[Error] Kunne ikke gi intervju-rolle til ${targetId}:`, err.message);
  }

  // DM søker
  try {
    const targetUser = await client.users.fetch(targetId);
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE8B84B)
          .setAuthor({ name: 'FOCUS RP — Whitelist', iconURL: 'https://focusrp.no/favicon.ico' })
          .setTitle('🎉 Søknaden er godkjent — du er kalt inn til intervju!')
          .setDescription(
            `Gratulerer, **${targetUser.username}**!\n\n` +
            `Søknaden din er godkjent av staff.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `**Neste steg: Intervju**\n` +
            `Du har fått tilgang til **#intervju**-kanalen på Discord.\n` +
            `En av våre staff-medlemmer vil ta kontakt med deg der.\n\n` +
            `Består du intervjuet er du offisielt med på FOCUS RP! 🎮\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          )
          .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' })
          .setTimestamp()
      ]
    });
  } catch (err) {
    console.error(`[Error] Kunne ikke DM-e søker ${targetId}:`, err.message);
  }

  // Oppdater staff-embed
  const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
  originalEmbed.setColor(0xE8B84B);
  originalEmbed.setFooter({ text: `🎉 Godkjent → Intervju  ·  Av ${interaction.user.tag}  ·  focusrp.no` });

  await interaction.update({ embeds: [originalEmbed], components: [] });
  console.log(`[Accept] ${targetId} kalt inn til intervju av ${interaction.user.tag}`);
}

// ─── AVSLÅ MED GRUNN ────────────────────────────────────────────────────────

async function handleDeny(interaction, targetId, reason) {
  // DM søker med grunn
  try {
    const targetUser = await client.users.fetch(targetId);
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE05252)
          .setAuthor({ name: 'FOCUS RP — Whitelist', iconURL: 'https://focusrp.no/favicon.ico' })
          .setTitle('❌ Søknaden din er avslått')
          .setDescription(
            `Hei **${targetUser.username}**,\n\n` +
            `Beklager — søknaden din til **FOCUS RP** ble ikke godkjent denne gangen.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `**📝 Tilbakemelding fra staff:**\n${reason}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Du kan søke på nytt om **7 dager**.\n` +
            `Har du spørsmål kan du sende en melding i Discord.`
          )
          .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' })
          .setTimestamp()
      ]
    });
  } catch (err) {
    console.error(`[Error] Kunne ikke DM-e ${targetId}:`, err.message);
  }

  // Oppdater staff-embed
  const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
  originalEmbed.setColor(0xE05252);
  originalEmbed.addFields({ name: '❌ Avslagsgrunn', value: reason });
  originalEmbed.setFooter({ text: `❌ Avslått av ${interaction.user.tag}  ·  focusrp.no` });

  await interaction.update({ embeds: [originalEmbed], components: [] });
  console.log(`[Deny] ${targetId} avslått av ${interaction.user.tag}. Grunn: ${reason}`);
}

// ─── SPØR OM MER ────────────────────────────────────────────────────────────

async function handleStaffQuestion(interaction, targetId, question) {
  try {
    const targetUser = await client.users.fetch(targetId);
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x4A90D9)
          .setAuthor({ name: 'FOCUS RP — Whitelist', iconURL: 'https://focusrp.no/favicon.ico' })
          .setTitle('💬 Staff har et spørsmål til søknaden din')
          .setDescription(
            `Hei **${targetUser.username}**!\n\n` +
            `Staff har lest søknaden din og ønsker litt mer informasjon:\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `**📩 Spørsmål fra staff:**\n${question}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*Svar direkte i denne DM-chatten.*`
          )
          .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' })
          .setTimestamp()
      ]
    });

    // Registrer at vi venter på svar fra søkeren
    pendingStaffReplies.set(targetId, {
      staffMessageId: interaction.message.id,
      staffChannelId: interaction.message.channelId,
      askedBy: interaction.user.tag,
      question
    });

    // Marker embed som "avventer svar"
    const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    originalEmbed.setColor(0x4A90D9);
    originalEmbed.addFields({ name: '💬 Spørsmål sendt', value: `**${interaction.user.tag}** spurte: ${question}` });

    await interaction.update({ embeds: [originalEmbed] });
    await interaction.followUp({ content: `✅ Spørsmålet er sendt til søkeren. De svarer i DM.`, ephemeral: true });

    console.log(`[Question] ${interaction.user.tag} sendte spørsmål til ${targetId}`);
  } catch (err) {
    await interaction.reply({ content: `❌ Kunne ikke sende melding til søkeren. De har kanskje lukket DMs.`, ephemeral: true });
    console.error(`[Error] Spørsmål til ${targetId} feilet:`, err.message);
  }
}

// ─── DM-MELDINGER (svar på spørsmål) ────────────────────────────────────────

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  // Sjekk om brukeren venter på å svare på et staff-spørsmål
  const pending = pendingStaffReplies.get(message.author.id);
  if (pending) {
    pendingStaffReplies.delete(message.author.id);
    try {
      const staffChannel = await client.channels.fetch(pending.staffChannelId);
      const staffMsg = await staffChannel.messages.fetch(pending.staffMessageId);
      const updatedEmbed = EmbedBuilder.from(staffMsg.embeds[0]);
      updatedEmbed.setColor(0x9B9B9B);
      updatedEmbed.addFields({
        name: `💬 Svar fra søker`,
        value: `**Spørsmål:** ${pending.question}\n**Svar:** ${message.content.substring(0, 800)}`,
        inline: false
      });
      updatedEmbed.setFooter({ text: `Svar mottatt  ·  focusrp.no` });
      await staffMsg.edit({ embeds: [updatedEmbed] });
    } catch (err) {
      console.error(`[Error] Kunne ikke oppdatere staff-embed med svar:`, err.message);
    }
    await message.react('✅');
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x4A90D9)
          .setDescription(`✅ Svaret ditt er sendt til staff. De vil behandle søknaden din snart.`)
          .setFooter({ text: 'focusrp.no  ·  Rollespill på ordentlig' })
      ]
    });
    return;
  }

  const wasHandled = await handleAnswer(message);

  if (!wasHandled) {
    await message.reply(
      `Hei! Du har ingen aktiv søknad i gang.\nGå til **#søknad**-kanalen på FOCUS RP Discord for å starte søknaden.`
    );
  }
});

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────

client.on('error', (err) => console.error('[Discord Error]', err));
process.on('unhandledRejection', (err) => console.error('[Unhandled Rejection]', err));

// ─── LOGIN ───────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);
