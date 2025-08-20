const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('promo')
    .setDescription('Cherche les meilleures offres pour un produit')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Déploiement des commandes globales…');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // pas de GUILD_ID
      { body: commands },
    );

    console.log('✅ Commandes globales déployées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du déploiement :', error);
  }
})();
