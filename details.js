import fs from "fs";
import puppeteer from "puppeteer";


function extractData() {
    const title = document.querySelector("#product-title > h1 > span").textContent
    const name = title.replace(" review", "")
    const id = title.toLowerCase().replace(" review", "").replaceAll(" ", "-")
    const verdict = document.querySelector("#product-intro > p").textContent
    const pros = Array.from(document.querySelectorAll("#the_good > div > div > ul > li")).map(e => e.textContent)
    const cons = Array.from(document.querySelectorAll("#the_bad > div > div > ul > li")).map(e => e.textContent)
    const ranking = Array.from(document.querySelectorAll("ul.awards-list > li")).map(e => {
        return {
            topIn: e.querySelector("span.rank-text").innerText.trim(),
            category: e.querySelector("a").innerText.trim(),
            href: e.querySelector("a").href,
        }
    })
    const affiliations = Array.from(document.querySelectorAll(".compare_prices > div")).map(e => {
        return {
            shopName: e.querySelector(".shop-name").innerText.trim(),
            price: e.querySelector(".shop_price > .offer_list_price").innerText.trim(),
            offerPrice: e.querySelector(".shop_price > .offer_price").innerText.trim(),
            link: e.querySelector(".shop_button > a").href
        }
    })

    const similarChoose = Array.from(document.querySelectorAll("table span.similar-comparison-shoe-name")).slice(1).map(e => e.innerText)

    return { id, name, verdict, pros, cons, ranking, affiliations, similarChoose }
}


const main = async () => {
    const browser = await puppeteer.launch({
        headless: true,
    });

    const page = await browser.newPage();
    const rawdata = fs.readFileSync('data/links.json');
    const links = Object.values(JSON.parse(rawdata));
    const results = []

    for (const url of [links[44]]) {
        await page.setViewport({ width: 1280, height: 800 })
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.$eval('#footer', el => el.scrollIntoView({ behavior: 'smooth' }))

        await page.waitForSelector("table span.similar-comparison-shoe-name")
        const data = await page.evaluate(extractData)

        // Open a modal 
        await page.$eval(".product-filters__size-phrase button", el => el.click())
        await page.waitForSelector(".rr-modal-dialog .size-summary")
        const size = await page.evaluate(() => {
            return {
                count: document.querySelector(".calculate-size__title").innerText.trim().replace(/[^0-9]/g, ""),
                pourcentage: Array.from(document.querySelectorAll(".rr-modal-dialog .size-summary .labels")).map(e => {
                    return {
                        small: e.querySelector("div:nth-child(1) > span").innerText.trim().replace(/[^0-9]/g, ""),
                        true: e.querySelector("div:nth-child(2) > span").innerText.trim().replace(/[^0-9]/g, ""),
                        large: e.querySelector("div:nth-child(3) > span").innerText.trim().replace(/[^0-9]/g, ""),
                    }
                })[0]
            }
        })

        await page.$eval("body", el => el.click())


        await page.waitForSelector("#facts > div > button")
        await page.$eval("#facts > div > button", el => el.click())

        await page.waitForSelector(".facts-table-container")
        await page.hover('.facts-table-container')

        const facts = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".facts-table-container > table.table > tbody > tr"))
                .map(e => e.textContent.trim())
                .map(el => el.split(":"))
                .map(([type, values]) => ({ id: type.toLowerCase().replaceAll(" ", "-"), type, values: [...new Set(values.trim().replaceAll(" |", ",").replaceAll(",  ", ", ").split(", "))] }))

        })

        results.push({ ...data, size, facts })
    }


    console.log(results)

    fs.writeFileSync('data/items.json', JSON.stringify({ ...results }));

    await browser.close();

};


main();



//  HELP 
// await page.evaluate(() => {
//     const title = document.querySelector("#product-title > h1 > span").textContent
//     const pros = Array.from(document.querySelectorAll("#the_good > div > div > ul > li")).map(e => e.textContent)
//     const cons = Array.from(document.querySelectorAll("#the_bad > div > div > ul > li")).map(e => e.textContent)
//     const ranking = Array.from(document.querySelectorAll("ul.awards-list > li")).map(e => {
//         return {
//             topIn: e.querySelector("span.rank-text").innerText.trim(),
//             category: e.querySelector("a").innerText.trim(),
//             href: e.querySelector("a").href,
//         }
//     })
//     const affiliations = Array.from(document.querySelectorAll(".compare_prices > div")).map(e => {
//         return {
//             shopName: e.querySelector(".shop-name").innerText.trim(),
//             price: e.querySelector(".shop_price > .offer_list_price").innerText.trim(),
//             offerPrice: e.querySelector(".shop_price > .offer_price").innerText.trim(),
//             link: e.querySelector(".shop_button > a").href
//         }
//     })


//     // document.querySelector(".product-filters__size-phrase > button").click()
//     // page.waitForSelector('.rr-modal-dialog');
//     // const size = document.querySelector(".rr-modal-dialog .calculate-size__title").textContent

//     return { title, pros, cons, ranking, affiliations }
// })

// await page.hover("#comparison")
// await page.waitForSelector("#comparison");
// const similarChoose = await page.evaluate(() => Array.from(document.querySelectorAll("span.similar-comparison-shoe-name")).slice(1).map(e => e.textContent))

// // await page.$eval(".product-filters__size-phrase button", el => el.click())
// // await page.waitForSelector(".rr-modal-dialog")
// // const size = await page.evaluate(() => document.querySelector(".rr-modal-dialog .size_guide__button-label"))

