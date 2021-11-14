const getPricesUtil = require('../tradier/getPrices')
const scraperUtil = require('./scrapeTickers')
const settingsUtil = require('./settings')
const watchlistUtil = require('../tradier/watchlist')

const { updateWatchlist } = require('./updateWatchlist')


describe('updateWatchlist', () => {
  beforeEach(() => {
    scraperUtil.scrapeTickers = jest.fn()
    getPricesUtil.getPrices = jest.fn()
    settingsUtil.getSetting = jest.fn()
    watchlistUtil.replaceWatchlist = jest.fn()
  })

  it('Does nothing if the scraper doesnt return any tickers', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([])
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(getPricesUtil.getPrices).not.toHaveBeenCalled()
    expect(settingsUtil.getSetting).not.toHaveBeenCalled()
  })

  it('Gets prices for each ticker returned', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
    getPricesUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 20 }
    ])
    settingsUtil.getSetting.mockReturnValue(5)
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('maxAllocation')
    expect(getPricesUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'SFIX', 'TSLA' ])
  })

  it('Updates the watchlist with each ticker (all prices under max allocation)', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
    getPricesUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 100 },
      { symbol: 'SFIX', price: 20 },
      { symbol: 'TSLA', price: 56 },
    ])
    settingsUtil.getSetting.mockReturnValue(50000)
    await updateWatchlist()
    expect(scraperUtil.scrapeTickers).toHaveBeenCalledTimes(1)
    expect(settingsUtil.getSetting).toHaveBeenCalledWith('maxAllocation')
    expect(getPricesUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'SFIX', 'TSLA' ])
    expect(watchlistUtil.replaceWatchlist).toHaveBeenCalledWith([ 'AAPL', 'SFIX', 'TSLA' ])
  })

  it('Filters out tickers that are above max allocation', async () => {
    scraperUtil.scrapeTickers.mockReturnValue([ 'AAPL', 'SFIX', 'TSLA' ])
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
})