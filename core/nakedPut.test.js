const watchlistUtil = require('../tradier/watchlist')
const nakedPutHelpers = require('./nakedPutCycle')

const {
  sellNakedPuts,
} = require('./nakedPut')

describe('sellNakedPuts', () => {
  beforeEach(() => {
    watchlistUtil.getWatchlistSymbols = jest.fn()
    nakedPutHelpers.sellNakedPutsCycle = jest.fn()
  })

  it('Calls cycle function at least once; exits if cycle function returns something other than success', async () => {
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'WMT' ])
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValue('oh no')
    await sellNakedPuts()
    expect(watchlistUtil.getWatchlistSymbols).toHaveBeenCalledTimes(1)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledTimes(1)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledWith([ 'AAPL', 'WMT' ])
  })

  it('Calls cycle function again if success returned', async () => {
    watchlistUtil.getWatchlistSymbols.mockReturnValue([ 'AAPL', 'WMT' ])
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValueOnce('success')
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValueOnce('success')
    nakedPutHelpers.sellNakedPutsCycle.mockReturnValueOnce('oh no')
    await sellNakedPuts()
    expect(watchlistUtil.getWatchlistSymbols).toHaveBeenCalledTimes(1)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledTimes(3)
    expect(nakedPutHelpers.sellNakedPutsCycle).toHaveBeenCalledWith([ 'AAPL', 'WMT' ])
  })
})