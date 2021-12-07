const puppeteer = require('puppeteer')
const logUtil = require('./log')
const { scrapeTickers } = require('./scrapeTickers')


describe('scrapeTickers', () => {
  let goto, type, click, waitForNavigation, evaluate, newPage, close


  beforeEach(() => {
    logUtil.log = jest.fn()

    goto = jest.fn()
    type = jest.fn()
    click = jest.fn()
    waitForNavigation = jest.fn()
    evaluate = jest.fn()

    newPage = jest.fn()
    newPage.mockReturnValue({
      goto,
      type,
      click,
      waitForNavigation,
      evaluate,
    })

    close = jest.fn()
    puppeteer.launch = jest.fn()
    puppeteer.launch.mockReturnValue({
      newPage,
      close,
    })
  })


  it('If tries is greater than or equal to 5, returns empty array', async () => {
    const result = await scrapeTickers(5)
    expect(result).toEqual([])
    expect(puppeteer.launch).not.toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'WATCHLIST: Failure'
    })
  })

  it('Tries 5 times before quitting', async () => {
    newPage.mockImplementation(() => {
      throw new Error('shit')
    })
    const result = await scrapeTickers()

    expect(result).toEqual([])
    expect(puppeteer.launch).toHaveBeenCalledTimes(5)
    expect(newPage).toHaveBeenCalledTimes(5)
    expect(close).toHaveBeenCalledTimes(5)
    expect(logUtil.log).toHaveBeenCalledTimes(6)
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Something went wrong, trying again'
    })
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'WATCHLIST: Failure'
    })
  })


  // Needs jsdom environment to run this test, which fucks everything else up
  // it('Happy path', async () => {
  //   process.env = {
  //     ...process.env,
  //     SCRAPE_TARGETPAGE: 'example.com',
  //     SCRAPE_FIELD1: 'hello',
  //     SCRAPE_FIELD2: 'goodbye',
  //     SCRAPE_VALUE1: 'something',
  //     SCRAPE_VALUE2: 'somethingelse',
  //     SCRAPE_BUTTONID: 'button',
  //   }

  //   document.body.innerHTML =
  //   '<div>' +
  //   '  <span id="username" />' +
  //   '  <button id="button" />' +
  //   '</div>'


  //   const tickers = await scrapeTickers()

  //   expect(puppeteer.launch).toHaveBeenCalled()
  //   expect(newPage).toHaveBeenCalled()
  //   expect(logUtil.log).toHaveBeenCalledWith('Navigating to login page')
  //   expect(goto).toHaveBeenCalledWith('example.com')
  //   expect(logUtil.log).toHaveBeenCalledWith('Entering creds')
  //   expect(type).toHaveBeenCalledWith('hello', 'something')
  //   expect(type).toHaveBeenCalledWith('goodbye', 'somethingelse')
  //   expect(logUtil.log).toHaveBeenCalledWith('Clicking login button')
  //   expect(click).toHaveBeenCalledWith('button')
  //   expect(waitForNavigation).toHaveBeenCalled()
  //   expect(logUtil.log).toHaveBeenCalledWith('Scraping tickers')
  //   expect(logUtil.log).toHaveBeenCalledWith('Closing browser')
  //   expect(close).toHaveBeenCalled()

  //   expect(tickers).toEqual([])
  // })


  // Alternate happy path test to cover at least some of the file
  it('Happy path', async () => {
    process.env = {
      ...process.env,
      SCRAPE_TARGETPAGE: 'example.com',
      SCRAPE_FIELD1: 'hello',
      SCRAPE_FIELD2: 'goodbye',
      SCRAPE_VALUE1: 'something',
      SCRAPE_VALUE2: 'somethingelse',
      SCRAPE_BUTTONID: 'button',
    }

    const tickers = await scrapeTickers()

    expect(puppeteer.launch).toHaveBeenCalled()
    expect(newPage).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith('Navigating to login page')
    expect(goto).toHaveBeenCalledWith('example.com')
    expect(logUtil.log).toHaveBeenCalledWith('Entering creds')
    expect(type).toHaveBeenCalledWith('hello', 'something')
    expect(type).toHaveBeenCalledWith('goodbye', 'somethingelse')
    expect(logUtil.log).toHaveBeenCalledWith('Clicking login button')
    expect(click).toHaveBeenCalledWith('button')
    expect(waitForNavigation).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith('Scraping tickers')
    expect(logUtil.log).toHaveBeenCalledWith('Closing browser')
    expect(close).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith('WATCHLIST: Success')

    expect(tickers).toEqual([])
  })
})