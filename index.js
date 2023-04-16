import fs from "fs";
import puppeteer from "puppeteer";


const main = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto("https://runrepeat.com/catalog/running-shoes", {
    waitUntil: "domcontentloaded",
  });

  const links = []

  const pagesCount = await page.evaluate(() => {
    const paginationElement = document.querySelectorAll("ul.pagination > li > a")
    const paginationLinks = Array.from(paginationElement).map(el => el.innerText)
    return paginationLinks[paginationLinks.length - 2]
  });

  console.log(`Scraping ${pagesCount} pages...`)

  for (let i = 1; i < +pagesCount + 1; i++) {
    const productLinks = await page.evaluate(() => {
      const productItem = document.querySelectorAll("#rankings-list > li > div.col-md-7.col-sm-12.col-xs-12 > div.product-name.hidden-sm.hidden-xs > a")
      return Array.from(productItem).map(el => el.href)
    });

    links.push(...productLinks)

    await page.goto("https://runrepeat.com/catalog/running-shoes?page=" + (+i + 1), {
      waitUntil: "domcontentloaded",
    });
  }

  console.log(`${links.length} items scraped!`, links)

  fs.writeFileSync('data/links.json', JSON.stringify({ ...links }));

  await browser.close();

};

main();


