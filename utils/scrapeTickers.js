const puppeteer = require('puppeteer')

const scrapeTickers = async (tries = 0) => {
  if (tries > 5) {
    console.log('Too many failed attempts')
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
        // eslint-disable-next-line no-undef
        document.querySelectorAll('.ticker'),
        (element) => element.textContent
      )
    )

    console.log('Closing browser')
    await browser.close()

    return scrapedTickers.map(x => x.trim())
  } catch (e) {
    console.log(e)
    console.log('Something went wrong, trying again')
    await browser.close()
    const result = await scrapeTickers(tries + 1)
    return result
  }
}


module.exports = {
  scrapeTickers
}