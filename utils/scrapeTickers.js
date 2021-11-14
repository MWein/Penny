const puppeteer = require('puppeteer')

const scrapeTickers = async (tries = 0) => {
  if (tries > 5) {
    return []
  }

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  const page = await browser.newPage()

  try {
    console.log('Navigating to login page')
    await page.goto(process.env.SCRAPE_TARGETPAGE)

    console.log('Entering creds')
    await page.type(process.env.SCRAPE_FIELD1, process.env.SCRAPE_VALUE1)
    await page.type(process.env.SCRAPE_FIELD2, process.env.SCRAPE_VALUE2)

    console.log('Clicking login button')
    await page.click(process.env.SCRAPE_BUTTONID)
    await page.waitForNavigation()

    console.log('Scraping tickers')
    const scrapedTickers = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(process.env.SCRAPE_QUERYID),
        (element) => element.textContent
      )
    )

    console.log('Closing browser')
    await browser.close()

    const cleanedTickers = scrapedTickers.map(x => x.trim())
    return cleanedTickers
  } catch (e) {
    console.log('Something went wrong, trying again')
    await browser.close()
    const result = await scrapeTickers(tries + 1)
    return result
  }
}


module.exports = {
  scrapeTickers
}