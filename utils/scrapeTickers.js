const puppeteer = require('puppeteer')
const { log } = require('./log')


const scrapeTickers = async (tries = 0) => {
  if (tries > 5) {
    log({
      type: 'error',
      message: 'Too many failed scrape attempts. Aborting.'
    })
    return []
  }

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  const page = await browser.newPage()

  try {
    log('Navigating to login page')
    await page.goto(process.env.SCRAPE_TARGETPAGE)

    log('Entering creds')
    await page.type(process.env.SCRAPE_FIELD1, process.env.SCRAPE_VALUE1)
    await page.type(process.env.SCRAPE_FIELD2, process.env.SCRAPE_VALUE2)

    log('Clicking login button')
    await page.click(process.env.SCRAPE_BUTTONID)
    await page.waitForNavigation()

    log('Scraping tickers')
    const scrapedTickers = await page.evaluate(() =>
      Array.from(
        // eslint-disable-next-line no-undef
        document.querySelectorAll('.ticker'),
        (element) => element.textContent
      )
    )

    log('Closing browser')
    await browser.close()

    return scrapedTickers.map(x => x.trim())
  } catch (e) {
    console.log(e)
    log({
      type: 'error',
      message: 'Something went wrong, trying again'
    })
    await browser.close()
    const result = await scrapeTickers(tries + 1)
    return result
  }
}


module.exports = {
  scrapeTickers
}