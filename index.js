import fetch from 'node-fetch';
import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Definir el slash command
const commands = [
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Haz una pregunta al asistente de IA')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu pregunta para el asistente')
        .setRequired(true)
    ),
];

// Función para registrar comandos globales
async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    console.log('Registrando slash commands globales...');
    
    // Registrar comandos globales (disponibles en todos los servidores)
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log('Slash commands globales registrados exitosamente!');
    console.log('Nota: Los comandos globales pueden tardar hasta 1 hora en propagarse.');
  } catch (error) {
    console.error('Error registrando comandos:', error);
  }
}

client.once('ready', async () => {
  console.log(`Bot listo: ${client.user.tag}`);
  await registerCommands();
});

// Manejar slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ai') {
    const pregunta = interaction.options.getString('pregunta');
    
    try {
      // Responder inmediatamente para evitar timeout (3 segundos)
      await interaction.deferReply();

      // Construir payload para n8n
      const payload = {
        content: pregunta,
        author: interaction.user.username,
        channelId: interaction.channel.id,
        messageId: interaction.id,
        guildId: interaction.guild?.id
      };

      // Enviar al webhook de n8n
      const response = await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Error al enviar a n8n:', response.statusText);
        await interaction.editReply('❌ Hubo un error procesando tu solicitud.');
        return;
      }

      // Obtener la respuesta del agente IA
      const data = await response.json();
      const reply = data.reply || data.response || 'Lo siento, no obtuve respuesta.';

      // Formatear respuesta con la pregunta del usuario
      const formattedReply = `**Pregunta:** ${pregunta}\n\n${reply}`;

      // Enviar respuesta
      await interaction.editReply(formattedReply);

    } catch (error) {
      console.error('Error en slash command:', error);
      try {
        await interaction.editReply('❌ Ocurrió un error inesperado.');
      } catch (editError) {
        console.error('Error editando respuesta:', editError);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
