// =============================================
// FOCUS RP - Whitelist Bot
// Main entry point
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
  ChannelType
} = require('discord.js');

const { startApplication, handleAnswer, activeApplications } = require('./applicationHandler');

// =============================================
// BOT SETUP
// =============================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.Channel,   // Nødvendig for DM-støtte
    Partials.Message
  ]
});

// Gjør client tilgjengelig globalt for applicationHandler
global.botClient = client;


// =============================================
// BOT KLAR
// =============================================

client.once('ready', async () => {
  console.log(`✅ FOCUS RP Bot er online som ${client.user.tag}`);
  client.user.setActivity('FOCUS RP | focusrp.no', { type: 3 }); // "Watching"

  // Post søknadsknappen i application-kanalen
  await setupApplicationChannel();
});


// =============================================
// SETT OPP SØKNADSKANAL
// =============================================

async function setupApplicationChannel() {
  const channelId = process.env.APPLICATION_CHANNEL_ID;
  if (!channelId) {
    console.warn('[Warn] APPLICATION_CHANNEL_ID ikke satt – hopper over kanalsetup.');
    return;
  }

  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error('[Error] Fant ikke søknadskanalen! Sjekk APPLICATION_CHANNEL_ID.');
    return;
  }

  // Slett gamle meldinger fra boten i kanalen (rydder opp ved restart)
  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(m => m.author.id === client.user.id);
    for (const msg of botMessages.values()) {
      await msg.delete().catch(() => {});
    }
  } catch (err) {
    console.warn('[Warn] Kunne ikke rydde gamle meldinger:', err.message);
  }

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle('🎮 Søk om whitelist på FOCUS RP')
    .setDescription(
      `Ønsker du å bli en del av **FOCUS RP**?\n\n` +
      `Klikk på knappen under for å starte søknaden din.\n` +
      `Søknaden foregår i **DM med boten** – det tar ca. 5–10 minutter.\n\n` +
      `**Krav:**\n` +
      `→ Minimum ${process.env.MIN_AGE || 16} år\n` +
      `→ Lest og forstått alle regler\n` +
      `→ Mikrofon anbefales\n\n` +
      `**Les reglene i #regler før du søker.**`
    )
    .setImage('https://focusrp.no/banner.png') // Bytt til ditt eget banner
    .setFooter({ text: 'FOCUS RP | focusrp.no' });

  await channel.send({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('start_application')
          .setLabel('Søk om whitelist')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📋')
      )
    ]
  });

  console.log(`[Setup] Søknadsknapp postet i #${channel.name}`);
}


// =============================================
// KNAPP-INTERAKSJONER
// =============================================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, user, member } = interaction;
  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  // --- START SØKNAD ---
  if (customId === 'start_application') {
    await interaction.reply({
      content: `📩 Søknaden er startet i DM! Sjekk meldingene dine.`,
      ephemeral: true
    });
    await startApplication(user);
    return;
  }

  // --- BEGIN SØKNAD (etter intro-melding) ---
  if (customId === 'begin_application') {
    await interaction.update({ components: [] }); // Fjern knappen
    const { sendNextQuestion } = require('./applicationHandler');
    await sendNextQuestion(user);
    return;
  }

  // --- STAFF: GODKJENN ---
  if (customId.startsWith('accept_')) {
    const targetUserId = customId.replace('accept_', '');
    await handleStaffDecision(interaction, targetUserId, 'accept', guild);
    return;
  }

  // --- STAFF: AVSLÅ ---
  if (customId.startsWith('deny_')) {
    const targetUserId = customId.replace('deny_', '');
    await handleStaffDecision(interaction, targetUserId, 'deny', guild);
    return;
  }

  // --- STAFF: SPØR OM MER ---
  if (customId.startsWith('question_')) {
    const targetUserId = customId.replace('question_', '');
    await interaction.reply({
      content: `Skriv meldingen din til søkeren, og boten sender den videre. Svar i denne tråden.`,
      ephemeral: true
    });
    // TODO: Implementer follow-up spørsmål flow ved behov
    return;
  }
});


// =============================================
// STAFF AVGJØRELSE (Godkjenn/Avslå)
// =============================================

async function handleStaffDecision(interaction, targetUserId, decision, guild) {
  // Oppdater embed
  const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

  if (decision === 'accept') {
    originalEmbed.setColor(0x44FF88);
    originalEmbed.setFooter({ text: `✅ Godkjent av ${interaction.user.tag} | focusrp.no` });

    // Gi rolle
    try {
      const member = await guild.members.fetch(targetUserId);
      const roleId = process.env.WHITELISTED_ROLE_ID;
      if (roleId) {
        await member.roles.add(roleId);
        console.log(`[Accept] Whitelisted-rolle gitt til ${member.user.tag}`);
      }
    } catch (err) {
      console.error(`[Error] Kunne ikke gi rolle til ${targetUserId}:`, err.message);
    }

    // DM søker
    try {
      const targetUser = await client.users.fetch(targetUserId);
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x44FF88)
            .setTitle('✅ Søknaden din er godkjent!')
            .setDescription(
              `Gratulerer! Du er nå whitelistet på **FOCUS RP**.\n\n` +
              `Du kan nå logge inn på serveren.\n\n` +
              `Finn oss på: \`play.focusrp.no\`\n\n` +
              `Vi gleder oss til å se deg i spillet! 🎮`
            )
            .setFooter({ text: 'FOCUS RP | focusrp.no' })
        ]
      });
    } catch (err) {
      console.error(`[Error] Kunne ikke DM-e søker:`, err.message);
    }

  } else if (decision === 'deny') {
    originalEmbed.setColor(0xFF4444);
    originalEmbed.setFooter({ text: `❌ Avslått av ${interaction.user.tag} | focusrp.no` });

    // DM søker
    try {
      const targetUser = await client.users.fetch(targetUserId);
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF4444)
            .setTitle('❌ Søknaden din er avslått')
            .setDescription(
              `Beklager, søknaden din til **FOCUS RP** ble ikke godkjent denne gangen.\n\n` +
              `Du kan søke på nytt om **7 dager**.\n\n` +
              `Har du spørsmål kan du ta kontakt i vår Discord.`
            )
            .setFooter({ text: 'FOCUS RP | focusrp.no' })
        ]
      });
    } catch (err) {
      console.error(`[Error] Kunne ikke DM-e søker:`, err.message);
    }
  }

  // Oppdater staff-meldingen (fjern knapper, oppdater embed)
  await interaction.update({
    embeds: [originalEmbed],
    components: []
  });
}


// =============================================
// DM-MELDINGER (svar på spørsmål)
// =============================================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  // Sjekk om bruker har aktiv søknad
  const wasHandled = await handleAnswer(message);

  if (!wasHandled) {
    // Ingen aktiv søknad
    await message.reply(
      `Hei! Du har ingen aktiv søknad. Gå til **#søknad**-kanalen på FOCUS RP Discord for å starte.`
    );
  }
});


// =============================================
// ERROR HANDLING
// =============================================

client.on('error', (err) => {
  console.error('[Discord Error]', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});


// =============================================
// LOGIN
// =============================================

client.login(process.env.DISCORD_TOKEN);
