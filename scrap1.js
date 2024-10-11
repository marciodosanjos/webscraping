const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = "https://www.aosfatos.org/noticias/?formato=checagem";

  console.log("Acessando a página 1...");
  await page.goto(baseUrl, { waitUntil: "networkidle2" });

  // Captura os links dos artigos que contêm '/noticias/' e não incluem '/?'
  const articlesOnPage = await page.$$eval(
    ".group.relative.size-max.w-full a[href]",
    (links) =>
      links
        .map((link) => link.href)
        .filter((url) => url.includes("/noticias/") && !url.includes("/?"))
  );

  console.log(`Encontrados ${articlesOnPage.length} artigos na página 1`);

  // Acessar cada artigo para coletar o conteúdo
  let articleData = [];

  for (let articleUrl of articlesOnPage) {
    console.log(`Acessando artigo: ${articleUrl}`);
    await page.goto(articleUrl, { waitUntil: "networkidle2" });

    // Extrai o título e o texto puro dentro da div de classe específica
    const articleContent = await page.evaluate(() => {
      const title = document.querySelector("h1")
        ? document.querySelector("h1").innerText
        : "";
      const content = document.querySelector(
        "div.prose.prose-zinc.md\\:prose-lg.max-w-entry.mx-auto.my-5.md\\:my-10"
      )
        ? document.querySelector(
            "div.prose.prose-zinc.md\\:prose-lg.max-w-entry.mx-auto.my-5.md\\:my-10"
          ).innerText
        : "";
      return { title, content };
    });

    articleData.push({ url: articleUrl, ...articleContent });
  }

  // Salva os dados em um arquivo JSON
  fs.writeFileSync(
    "artigos_aos_fatos_pagina1.json",
    JSON.stringify(articleData, null, 2),
    "utf8"
  );

  console.log(
    'Scraping finalizado e dados salvos em "artigos_aos_fatos_pagina1.json".'
  );

  await browser.close();
})();
