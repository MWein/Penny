const settings = require('../utils/settings')
const logUtil = require('../utils/log')
const market = require('../tradier/market')
const watchlistUtil = require('../utils/watchlist')

const {
  _getPutPermittedWatchlistItems,
  sellCashSecuredPuts,
} = require('./cashSecuredPut')


const _mockPutWatchlistItem = (symbol, maxPositions, enabled, targetDelta) => ({
  symbol,
  maxPositions,
  put: {
    enabled,
    targetDelta,
  }
})


describe('_getPutPermittedWatchlistItems', () => {
  beforeEach(() => {
    settings.getSetting = jest.fn()
    watchlistUtil.getWatchlist = jest.fn()
  })

  it('If priorityList is empty, return empty array', async () => {
    settings.getSetting.mockReturnValueOnce([])
    watchlistUtil.getWatchlist.mockReturnValue([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
    ])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([])
  })

  it('If watchlist is emtpy, return empty array', async () => {
    settings.getSetting.mockReturnValueOnce([ 'AAPL', 'MSFT' ])
    watchlistUtil.getWatchlist.mockReturnValue([])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([])
  })

  it('If both priorityList and watchlist is empty, return emtpy array', async () => {
    settings.getSetting.mockReturnValueOnce([])
    watchlistUtil.getWatchlist.mockReturnValue([])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([])
  })

  it('Returns empty if there is no symbol overlap between priority list and watchlist', async () => {
    settings.getSetting.mockReturnValueOnce([ 'AAPL', 'MSFT' ])
    watchlistUtil.getWatchlist.mockReturnValue([
      _mockPutWatchlistItem('TSLA', 1, true, 0.3),
      _mockPutWatchlistItem('ABNB', 1, true, 0.3),
    ])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([])
  })

  it('Filters out symbols in the priority list, but with a max positions of 0', async () => {
    settings.getSetting.mockReturnValueOnce([ 'AAPL', 'MSFT' ])
    watchlistUtil.getWatchlist.mockReturnValue([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
      _mockPutWatchlistItem('MSFT', 0, true, 0.3),
    ])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
    ])
  })

  it('Filters out symbols in the priority list, but with a put.enabled of false', async () => {
    settings.getSetting.mockReturnValueOnce([ 'AAPL', 'MSFT' ])
    watchlistUtil.getWatchlist.mockReturnValue([
      _mockPutWatchlistItem('AAPL', 1, false, 0.3),
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
    ])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
    ])
  })

  it('Returns watchlist objects in the same order as the priority list', async () => {
    settings.getSetting.mockReturnValueOnce([ 'MSFT', 'AAPL' ])
    watchlistUtil.getWatchlist.mockReturnValue([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
    ])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
    ])
  })

  it('All rules test', async () => {
    settings.getSetting.mockReturnValueOnce([ 'MSFT', 'AAPL' ])
    watchlistUtil.getWatchlist.mockReturnValue([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
      _mockPutWatchlistItem('TSLA', 0, true, 0.3),
      _mockPutWatchlistItem('ABNB', 1, false, 0.3),
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
    ])
    const permittedWatchlistItems = await _getPutPermittedWatchlistItems()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(permittedWatchlistItems).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
    ])
  })
})



describe('sellCashSecuredPuts', () => {
  beforeEach(() => {
    settings.getSetting = jest.fn()
    logUtil.log = jest.fn()
    market.isMarketOpen = jest.fn().mockReturnValue(true)
    watchlistUtil.getWatchlist = jest.fn()
  })

  it('Does nothing putsEnabled in settings is false', async () => {
    settings.getSetting.mockReturnValue(false) // For putsEnabled
    await sellCashSecuredPuts()
    expect(settings.getSetting).toHaveBeenCalledWith('putsEnabled')
    expect(settings.getSetting).not.toHaveBeenCalledWith('priorityList')
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Puts Disabled')
    expect(market.isMarketOpen).not.toHaveBeenCalled()
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
    // TODO Add all other imports here
  })

  it('Does nothing if the market is not open', async () => {
    settings.getSetting.mockReturnValue(true)
    market.isMarketOpen.mockReturnValue(false)
    await sellCashSecuredPuts()
    expect(settings.getSetting).toHaveBeenCalledWith('putsEnabled')
    expect(settings.getSetting).not.toHaveBeenCalledWith('priorityList')
    expect(market.isMarketOpen).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Market Closed')
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
    // TODO Add all other imports here
  })

  it('Does nothing if the permitted stock list is empty', async () => {
    settings.getSetting.mockReturnValueOnce(true) // Puts Enabled
    settings.getSetting.mockReturnValueOnce([]) // Priority List
    market.isMarketOpen.mockReturnValue(true)
    watchlistUtil.getWatchlist.mockReturnValue([])
    await sellCashSecuredPuts()
    expect(settings.getSetting).toHaveBeenCalledWith('priorityList')
    expect(logUtil.log).toHaveBeenCalledWith('Priority List or Watchlist is Empty')
    // TODO Add all other imports here
  })

})