const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.PRICEAPI_KEY;

async function searchPriceAPI(keyword) {
  try {
    // 1️⃣ Création du job
    const createJob = await axios.post("https://api.priceapi.com/v2/jobs", {
      token: API_KEY,
      source: "idealo",
      country: "fr",
      topic: "product_and_offers",
      key: "term",
      values: [keyword],
    });

    const jobId = createJob.data.job_id;
    console.log(`✅ Job créé : ${jobId}`);

    // 2️⃣ Attente de la fin du job
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const statusRes = await axios.get(
        `https://api.priceapi.com/v2/jobs/${jobId}?token=${API_KEY}`
      );

      console.log(`⏳ [${i}] Status:`, statusRes.data.status);

      if (statusRes.data.status === "finished") break;
    }

    // 3️⃣ Téléchargement des résultats
    const download = await axios.get(
      `https://api.priceapi.com/products/bulk/${jobId}?token=${API_KEY}`,
      { headers: { Accept: "application/json" } }
    );

    if (!download.data.results) {
      console.log("⚠️ Aucun résultat dans bulk");
      return [];
    }

    // ✅ On renvoie un tableau des produits avec leurs offres triées par prix
    return download.data.results.map((r) => {
      const content = r.content;
      if (!content.offers) return content;

      content.offers = content.offers.sort(
        (a, b) => parseFloat(a.price) - parseFloat(b.price)
      );
      return content;
    });
  } catch (err) {
    console.error("❌ Erreur PriceAPI:", err.response?.data || err.message);
    return [];
  }
}

module.exports = searchPriceAPI;
