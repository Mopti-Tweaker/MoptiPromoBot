const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const searchPriceAPI = require("./priceapi");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "promo") return;

  await interaction.reply("🔍 Quel produit veux-tu rechercher ?");
  const filter = (m) => m.author.id === interaction.user.id;
  const collector = interaction.channel.createMessageCollector({
    filter,
    time: 30000,
    max: 1,
  });

  collector.on("collect", async (msg) => {
    const keyword = msg.content;
    await interaction.followUp("⏳ Je cherche les meilleurs prix...");

    const results = await searchPriceAPI(keyword);
    if (!results || results.length === 0) {
      await interaction.followUp("❌ Aucun résultat trouvé.");
      return;
    }

    // 🔹 On prend uniquement le premier produit (le plus pertinent)
    const product = results[0];
    const bestOffers = (product.offers || []).sort(
      (a, b) => parseFloat(a.price) - parseFloat(b.price)
    );

    if (!bestOffers.length) {
      await interaction.followUp("⚠️ Pas d'offres trouvées.");
      return;
    }

    const bestOffer = bestOffers[0];

    const embed = new EmbedBuilder()
      .setTitle(product.name || "Produit")
      .setURL(bestOffer.url || product.url || "https://www.amazon.fr")
      .setDescription(
        `💰 **Prix le plus bas : ${bestOffer.price} €**\n` +
          `🛒 Vendu par : **${bestOffer.shop_name}**`
      )
      .setColor(0x00ff00);

    if (product.image_url) embed.setImage(product.image_url);

    // 🔹 Bouton pour voir plus d'offres
    const button = new ButtonBuilder()
      .setLabel("Voir plus d'offres")
      .setStyle(ButtonStyle.Primary)
      .setCustomId("voir_offres");

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.followUp({ embeds: [embed], components: [row] });

    // Gestion du clic sur le bouton
    client.on("interactionCreate", async (btnInteraction) => {
      if (!btnInteraction.isButton()) return;
      if (btnInteraction.customId !== "voir_offres") return;

      // 🔹 Création d'une liste des 5 meilleures offres
      const list = bestOffers
        .slice(0, 5)
        .map(
          (o, i) =>
            `#${i + 1} **${o.price} €** – [${o.shop_name}](${o.url || "#"})`
        )
        .join("\n");

      const moreEmbed = new EmbedBuilder()
        .setTitle(`Plus d'offres pour ${product.name || "ce produit"}`)
        .setDescription(list)
        .setColor(0x0099ff);

      await btnInteraction.reply({ embeds: [moreEmbed], ephemeral: true });
    });
  });
});

client.login(process.env.DISCORD_TOKEN);
