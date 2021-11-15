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
      message: 'Too many failed scrape attempts. Aborting.'
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
      message: 'Too many failed scrape attempts. Aborting.'
    })
  })


})