const priceUtil = require('../tradier/getPrices')
const bestOption = require('../tradier/selectBestOption')
const watchlistUtil = require('../tradier/watchlist')
const nakedPutHelpers = require('./nakedPutCycle')
const settings = require('../utils/settings')
const market = require('../tradier/market')
const logUtil = require('../utils/log')

const {
  sellNakedPuts,
} = require('./nakedPut')

describe('sellNakedPuts', () => {
  const defaultSettings = {
    putsEnabled: true,
    maxAllocation: 1000,
    reserve: 0,
  }

  beforeEach(() => {
    watchlistUtil.getWatchlistSymbols = jest.fn()
    priceUtil.getPrices = jest.fn()
    nakedPutHelpers.sellNakedPutsCycle = jest.fn()
    bestOption.selectBestOption = jest.fn()
    settings.getSettings = jest.fn().mockReturnValue(defaultSettings)
    market.isMarketOpen = jest.fn().mockReturnValue(true)
    logUtil.log = jest.fn()
  })

  it('Does not run if putsEnabled setting is false', async () => {
    const mockSettings = { ...defaultSettings, putsEnabled: false }
    settings.getSettings.mockReturnValue(mockSettings)
    await sellNakedPuts()
    expect(logUtil.log).toHaveBeenCalledWith('Puts Disabled')
    expect(settings.getSettings).toHaveBeenCalled()
    expect(watchlistUtil.getWatchlistSymbols).not.toHaveBeenCalled()
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Does not run if market is closed', async () => {
    market.isMarketOpen.mockReturnValue(false)
    await sellNakedPuts()
    expect(logUtil.log).toHaveBeenCalledWith('Market Closed')
    expect(settings.getSettings).toHaveBeenCalled()
    expect(watchlistUtil.getWatchlistSymbols).not.toHaveBeenCalled()
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Does nothing if watchlist is empty', async () => {
    watchlistUtil.getWatchlistSymbols.mockReturnValue([])
    await sellNakedPuts()
    expect(logUtil.log).toHaveBeenCalledWith('Watchlist Empty')
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Retreives the best options for each ticker in the watchlist whose current prices are below the max allocation setting; does not call cycle function if all nulls', async () => {
    const mockSettings = { ...defaultSettings, maxAllocation: 2001 }
    settings.getSettings.mockReturnValue(mockSettings)
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'FB', 'BB', 'MSFT', 'SFIX' ])
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 20 },
      { symbol: 'FB', price: 150 },
      { symbol: 'BB', price: 5 },
      { symbol: 'MSFT', price: 21 },
      { symbol: 'SFIX', price: 15 },
    ])
    bestOption.selectBestOption.mockReturnValue(null)
    await sellNakedPuts()
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'FB', 'BB', 'MSFT', 'SFIX' ])
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(3)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('BB', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('SFIX', 'put')
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Retreives the best options for each ticker in the watchlist; does not call cycle function if all above max allocation', async () => {
    const mockSettings = { ...defaultSettings, maxAllocation: 999 }
    settings.getSettings.mockReturnValue(mockSettings)
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'BB', 'SFIX' ])
    // Setting the prices super low so it calls selectBestOption on each
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 1 },
      { symbol: 'BB', price: 1 },
      { symbol: 'SFIX', price: 1 }
    ])
    bestOption.selectBestOption.mockReturnValue({ strike: 10 })
    await sellNakedPuts()
    expect(logUtil.log).toHaveBeenCalledWith('No Put Opportunities')
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(3)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('BB', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('BB', 'put')
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Calls the cycle function at least once with only the options that are below max allocation and are not null; exits cycle function if something other than \'success\' is returned', async () => {
    const mockSettings = { ...defaultSettings, maxAllocation: 1001 }
    settings.getSettings.mockReturnValue(mockSettings)
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'WMT' ])
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 1 },
      { symbol: 'WMT', price: 1 },
    ])
    bestOption.selectBestOption.mockReturnValueOnce({ strike: 10 })
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ strike: 1002 })
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValue('oh no')
    await sellNakedPuts()
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledTimes(1)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledWith([ { strike: 10 } ], mockSettings)
    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })

  it('Calls cycle function again if success returned', async () => {
    const mockSettings = { ...defaultSettings, maxAllocation: 1001 }
    settings.getSettings.mockReturnValue(mockSettings)
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'WMT' ])
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 1 },
      { symbol: 'WMT', price: 1 },
    ])
    bestOption.selectBestOption.mockReturnValueOnce({ strike: 10 })
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ strike: 1002 })
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValueOnce('success')
      .mockReturnValueOnce('success')
      .mockReturnValueOnce('oh no')
    await sellNakedPuts()
    expect(watchlistUtil.getWatchlistSymbols).toHaveBeenCalledTimes(1)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledTimes(3)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledWith([ { strike: 10 } ], mockSettings)
    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })
})