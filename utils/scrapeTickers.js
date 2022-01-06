const puppeteer = require('puppeteer')
const logUtil = require('./log')
const sleepUtil = require('./sleep')


const scrapeTickers = async (tries = 0) => {
  if (tries >= 5) {
    logUtil.log({
      type: 'error',
      message: 'WATCHLIST: Failure'
    })
    return []
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true })

  try {
    const page = await browser.newPage()

    logUtil.log('Navigating to login page')
    await page.goto(process.env.SCRAPE_TARGETPAGE)

    await sleepUtil.sleep(2)

    logUtil.log('Entering creds')
    await page.type(process.env.SCRAPE_FIELD1, process.env.SCRAPE_VALUE1)
    await page.type(process.env.SCRAPE_FIELD2, process.env.SCRAPE_VALUE2)

    logUtil.log('Clicking login button')
    await page.click(process.env.SCRAPE_BUTTONID)

    logUtil.log('Waiting for page to load')
    await page.waitForNavigation()

    await sleepUtil.sleep(5)

    logUtil.log('Scraping tickers')
    const scrapedTickers = await page.evaluate(() =>
      Array.from(
        // eslint-disable-next-line no-undef
        document.querySelectorAll('.text-cyan-900'),
        (element) => element.textContent
      )
    )

    logUtil.log('Closing browser')
    await browser.close()

    logUtil.log('WATCHLIST: Success')

    const filteredTickers = scrapedTickers.map(x => x.trim()).filter(x => !['Reset', 'Show More'].includes(x))

    //filteredTickers.map(x => console.log(x))

    return filteredTickers
  } catch (e) {
    logUtil.log({
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