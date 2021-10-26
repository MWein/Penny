const balanceUtil = require('../tradier/getBalances')
const priceUtil = require('../tradier/getPrices')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const bestOption = require('../tradier/selectBestOption')
const { getUnderlying } = require('../utils/determineOptionType')
const sendOrdersUtil = require('../tradier/sendOrders')
const watchlistUtil = require('../tradier/watchlist')
const nakedPutHelpers = require('./nakedPutCycle')

const {
  sellNakedPuts,
} = require('./nakedPut')

describe('sellNakedPuts', () => {
  beforeEach(() => {
    watchlistUtil.getWatchlistSymbols = jest.fn()
    nakedPutHelpers.sellNakedPutsCycle = jest.fn()
    bestOption.selectBestOption = jest.fn()
  })

  it('Does nothing if watchlist is empty', async () => {
    watchlistUtil.getWatchlistSymbols.mockReturnValue([])
    await sellNakedPuts()
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Retreives the best options for each ticker in the watchlist; does not call cycle function if all nulls', async () => {
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'BB', 'SFIX' ])
    bestOption.selectBestOption.mockReturnValue(null)
    await sellNakedPuts()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(3)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('BB', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('BB', 'put')
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Retreives the best options for each ticker in the watchlist; does not call cycle function if all above max allocation', async () => {
    process.env.MAXALLOCATION = 999
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'BB', 'SFIX' ])
    bestOption.selectBestOption.mockReturnValue({ strike: 10 })
    await sellNakedPuts()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(3)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('BB', 'put')
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('BB', 'put')
    expect(nakedPutHelpers.sellNakedPutsCycle).not.toHaveBeenCalled()
  })

  it('Calls the cycle function at least once with only the options that are below max allocation and are not null; exits cycle function if something other than \'success\' is returned', async () => {
    process.env.MAXALLOCATION = 1001
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'WMT' ])
    bestOption.selectBestOption.mockReturnValueOnce({ strike: 10 })
    bestOption.selectBestOption.mockReturnValueOnce(null)
    bestOption.selectBestOption.mockReturnValueOnce({ strike: 1002 })
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValue('oh no')
    await sellNakedPuts()
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledTimes(1)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledWith([ 'AAPL', 'WMT' ], [ { strike: 10 } ])
  })

  it('Calls cycle function again if success returned', async () => {
    process.env.MAXALLOCATION = 1001
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'WMT' ])
    bestOption.selectBestOption.mockReturnValueOnce({ strike: 10 })
    bestOption.selectBestOption.mockReturnValueOnce(null)
    bestOption.selectBestOption.mockReturnValueOnce({ strike: 1002 })
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValueOnce('success')
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValueOnce('success')
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValueOnce('oh no')
    await sellNakedPuts()
    expect(watchlistUtil.getWatchlistSymbols).toHaveBeenCalledTimes(1)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledTimes(3)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledWith([ 'AAPL', 'WMT' ], [ { strike: 10 } ])
  })
})