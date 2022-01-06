const getPricesUtil = require('../tradier/getPrices')
const scraperUtil = require('./scrapeTickers')
const settingsUtil = require('./settings')
const watchlistUtil = require('../tradier/watchlist')
const logUtil = require('./log')

const { updateWatchlist } = require('./updateWatchlist')


describe('updateWatchlist', () => {
  beforeEach(() => {
    logUtil.log = jest.fn()
    scraperUtil.scrapeTickers = jest.fn()
    getPricesUtil.getPrices = jest.fn()
    settingsUtil.getSetting = jest.fn()
    watchlistUtil.replaceWatchlist = jest.fn()
  })

  it('Logs an error if the scraper returned nothing', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([])
    settingsUtil.getSetting.mockReturnValue([]) // both custom and banned tickers
    await updateWatchlist()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Ticker scraper may have failed'
    })
  })

  it('Does nothing if the scraper doesnt return any tickers', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([])
    settingsUtil.getSetting.mockReturnValue([]) // both custom and banned tickers
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(getPricesUtil.getPrices).not.toHaveBeenCalled()
    expect(settingsUtil.getSetting).toHaveBeenCalledTimes(2)
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('customTickers')
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('bannedTickers')
  })

  it('Gets prices for each ticker returned, including custom tickers', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
    settingsUtil.getSetting.mockReturnValueOnce([ 'AAL' ]) // custom tickers
    settingsUtil.getSetting.mockReturnValueOnce([]) // banned tickers
    getPricesUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 20 }
    ])
    settingsUtil.getSetting.mockReturnValueOnce(5)
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('maxAllocation')
    expect(getPricesUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'SFIX', 'TSLA', 'AAL' ])
  })

  it('Gets prices for each ticker returned, excluding banned tickers', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
    settingsUtil.getSetting.mockReturnValueOnce([ 'AAL' ]) // custom tickers
    settingsUtil.getSetting.mockReturnValueOnce([ 'SFIX', 'TSLA' ]) // banned tickers
    getPricesUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 20 }
    ])
    settingsUtil.getSetting.mockReturnValueOnce(5)
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('maxAllocation')
    expect(getPricesUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'AAL' ])
  })

  it('Updates the watchlist with each ticker (all prices under max allocation)', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
    settingsUtil.getSetting.mockReturnValueOnce([]) // custom tickers
    settingsUtil.getSetting.mockReturnValueOnce([]) // banned tickers
    getPricesUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 100 },
      { symbol: 'SFIX', price: 20 },
      { symbol: 'TSLA', price: 56 },
    ])
    settingsUtil.getSetting.mockReturnValueOnce(50000)
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('maxAllocation')
    expect(getPricesUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'SFIX', 'TSLA' ])
    expect(watchlistUtil.replaceWatchlist).toHaveBeenCalledWith([ 'AAPL', 'SFIX', 'TSLA' ])
  })

  it('Filters out tickers that are above max allocation', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
    settingsUtil.getSetting.mockReturnValueOnce([]) // custom tickers
    settingsUtil.getSetting.mockReturnValueOnce([]) // banned tickers
    getPricesUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 100 },
      { symbol: 'SFIX', price: 20 },
      { symbol: 'TSLA', price: 56 },
    ])
    settingsUtil.getSetting.mockReturnValue(6000)
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('maxAllocation')
    expect(getPricesUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'SFIX', 'TSLA' ])
    expect(watchlistUtil.replaceWatchlist).toHaveBeenCalledWith([ 'SFIX', 'TSLA' ])
  })

  it('Fails gracefully and logs if error occurs', async() => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
    settingsUtil.getSetting.mockReturnValueOnce(5) // custom tickers, not iterable to invoke an error
    settingsUtil.getSetting.mockReturnValueOnce([]) // banned tickers

    await updateWatchlist()

    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'updateWatchlist function error'
    })
  })
})