const https = require("https");

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("❌ RESEND_API_KEY est manquante.");
  process.exit(1);
}

function request(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.resend.com",
        path,
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          let data;

          try {
            data = JSON.parse(body);
          } catch {
            data = body;
          }

          resolve({
            status: res.statusCode,
            data,
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("🔎 Vérification des domaines Resend...\n");

  const result = await request("/domains");

  if (result.status !== 200) {
    console.error("❌ Impossible de récupérer les domaines.");
    console.error("HTTP:", result.status);
    console.error(result.data);
    process.exit(1);
  }

  const domains = result.data.data || [];

  if (domains.length === 0) {
    console.log("⚠️ Aucun domaine configuré dans Resend.");
    console.log(
      "Ajoute d'abord le domaine depuis le dashboard Resend."
    );
    return;
  }

  console.log(`✅ ${domains.length} domaine(s) trouvé(s).\n`);

  for (const domain of domains) {
    console.log("────────────────────────────────");
    console.log(`Domaine : ${domain.name}`);
    console.log(`ID      : ${domain.id}`);
    console.log(`Statut  : ${domain.status}`);

    if (domain.status === "verified") {
      console.log("✅ Domaine vérifié");
    } else {
      console.log("⚠️ Domaine NON vérifié");
    }

    if (domain.records) {
      console.log("\nDNS :");

      for (const record of domain.records) {
        console.log(
          `  ${record.type} ${record.name} → ${record.value} (${record.status || "unknown"})`
        );
      }
    }
  }

  console.log("\n────────────────────────────────");
}

main().catch((error) => {
  console.error("❌ Erreur :", error.message);
  process.exit(1);
});