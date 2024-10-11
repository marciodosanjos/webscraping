const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = "https://www.aosfatos.org/noticias/?formato=checagem";
  let pageNum = 1;
  let allArticles = [];

  while (true) {
    console.log(`Acessando página ${pageNum}...`);
    await page.goto(`${baseUrl}&page=${pageNum}`, {
      waitUntil: "networkidle2",
    });

    // Captura os links dos artigos que contêm '/noticias/' e não incluem '/?'
    const articlesOnPage = await page.$$eval(
      ".group.relative.size-max.w-full a[href]",
      (links) =>
        links
          .map((link) => link.href)
          .filter((url) => url.includes("/noticias/") && !url.includes("/?"))
    );

    if (articlesOnPage.length === 0) {
      console.log("Nenhum card encontrado, finalizando scraping.");
      break;
    }

    console.log(
      `Encontrados ${articlesOnPage.length} artigos na página ${pageNum}`
    );
    allArticles.push(...articlesOnPage);

    // Avança para a próxima página
    pageNum++;
  }

  console.log(`Total de links de artigos coletados: ${allArticles.length}`);

  // Agora, acessar cada artigo para coletar o conteúdo
  let articleData = [];

  for (let articleUrl of allArticles) {
    // Correção aqui: use allArticles
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
          ).innerText // Aqui também não é necessário repetir a classe
        : "";
      return { title, content };
    });

    articleData.push({ url: articleUrl, ...articleContent });
  }

  // Salva os dados em um arquivo JSON
  fs.writeFileSync(
    "artigos_aos_fatos.json",
    JSON.stringify(articleData, null, 2),
    "utf8"
  );

  console.log(
    'Scraping finalizado e dados salvos em "artigos_aos_fatos.json".'
  );

  await browser.close();
})();
