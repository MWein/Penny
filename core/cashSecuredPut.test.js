const settings = require('../utils/settings')
const logUtil = require('../utils/log')
const market = require('../tradier/market')
const watchlistUtil = require('../utils/watchlist')
const priceUtil = require('../tradier/getPrices')
const balanceUtil = require('../tradier/getBalances')
const bestOptionUtil = require('../tradier/selectBestOption')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')

const {
  _getWatchlistPriorityUnion,
  _preStartFilterWatchlistItems,
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


describe('_getWatchlistPriorityUnion', () => {
  it('If priorityList is empty, return empty array', () => {
    expect(_getWatchlistPriorityUnion([], [
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
    ])).toEqual([])
  })

  it('If watchlist is emtpy, return empty array', () => {
    expect(_getWatchlistPriorityUnion([ 'AAPL', 'MSFT' ], [])).toEqual([])
  })

  it('If both priorityList and watchlist is empty, return emtpy array', () => {
    expect(_getWatchlistPriorityUnion([], [])).toEqual([])
  })

  it('Returns empty if there is no symbol overlap between priority list and watchlist', () => {
    const permittedWatchlistItems = _getWatchlistPriorityUnion(
      [ 'AAPL', 'MSFT' ],
      [
        _mockPutWatchlistItem('TSLA', 1, true, 0.3),
        _mockPutWatchlistItem('ABNB', 1, true, 0.3),
      ]
    )
    expect(permittedWatchlistItems).toEqual([])
  })

  it('Returns watchlist items in the priority list. 1 missing from watchlist', () => {
    const permittedWatchlistItems = _getWatchlistPriorityUnion(
      [ 'AAPL', 'MSFT', 'TSLA' ],
      [
        _mockPutWatchlistItem('AAPL', 1, true, 0.3),
        _mockPutWatchlistItem('MSFT', 1, true, 0.3),
      ]
    )
    expect(permittedWatchlistItems).toEqual([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
    ])
  })

  it('Returns watchlist items in the priority list. 1 missing from priority list', () => {
    const permittedWatchlistItems = _getWatchlistPriorityUnion(
      [ 'AAPL', 'MSFT' ],
      [
        _mockPutWatchlistItem('AAPL', 1, true, 0.3),
        _mockPutWatchlistItem('MSFT', 1, true, 0.3),
        _mockPutWatchlistItem('TSLA', 1, true, 0.3),
      ]
    )
    expect(permittedWatchlistItems).toEqual([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
    ])
  })

  it('Returns watchlist objects in the same order as the priority list', () => {
    const permittedWatchlistItems = _getWatchlistPriorityUnion(
      [ 'MSFT', 'AAPL' ],
      [
        _mockPutWatchlistItem('AAPL', 1, true, 0.3),
        _mockPutWatchlistItem('MSFT', 1, true, 0.3),
      ]
    )
    expect(permittedWatchlistItems).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
    ])
  })
})



describe('_preStartFilterWatchlistItems', () => {
  beforeEach(() => {
    priceUtil.getPrices = jest.fn()
    positionUtil.getPositions = jest.fn()
    orderUtil.getOrders = jest.fn()
  })

  it('On the first pass, filters out maxPositions of 0. getPrices is called with empty array but that function doesnt make the network call if empty.', async () => {
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 0, true, 0.3)
    ], 1000)
    expect(result).toEqual([])
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
  })

  it('On the first pass, filters out enabled of false.', async () => {
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 1, false, 0.3)
    ], 1000)
    expect(result).toEqual([])
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
  })

  it('Gets prices for items that make it through the first pass filter. Returns anyway if a price isnt returned for some reason.', async () => {
    priceUtil.getPrices.mockReturnValue([])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Gets prices for items that make it through the first pass filter. Returns empty array if all prices are above buying power.', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 21 },
    ])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ], 1000)
    expect(result).toEqual([])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Gets prices for items that make it through the first pass filter. Returns items that are below buying power.', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
    ])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('All rules', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
      { symbol: 'AAPL', price: 12 },
    ])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('AAPL', 1, true, 0.3),
      _mockPutWatchlistItem('MSFT', 1, true, 0.3),
      _mockPutWatchlistItem('TSLA', 0, true, 0.3),
      _mockPutWatchlistItem('ABNB', 1, false, 0.3),
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'MSFT' ])
  })
})



describe('_selectBestOptionsFromWatchlist', () => {
  beforeEach(() => {
    bestOptionUtil.selectBestOption = jest.fn()
  })

  it('Failing test to remind me this is here', async () => {
    expect(1).toEqual(0)
  })
})



describe('_selectOptionsToSell', () => {
  it('Only sells the one it can actually afford', () => {

  })


})



describe('sellCashSecuredPuts', () => {
  beforeEach(() => {
    settings.getSettings = jest.fn().mockReturnValue({
      putsEnabled: true,

    })
    logUtil.log = jest.fn()
    market.isMarketOpen = jest.fn().mockReturnValue(true)
    watchlistUtil.getWatchlist = jest.fn()
    priceUtil.getPrices = jest.fn()
    balanceUtil.getBalances = jest.fn()
    bestOptionUtil.selectBestOption = jest.fn()
    positionUtil.getPositions = jest.fn()
    orderUtil.getOrders = jest.fn()
  })

  it('Does nothing putsEnabled in settings is false', async () => {
    settings.getSettings.mockReturnValue({
      putsEnabled: false
    })
    await sellCashSecuredPuts()
    expect(settings.getSettings).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Puts Disabled')
    expect(market.isMarketOpen).not.toHaveBeenCalled()
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(balanceUtil.getBalances).not.toHaveBeenCalled()
    // TODO Add all other imports here
  })

  it('Does nothing if the market is not open', async () => {
    settings.getSettings.mockReturnValue({
      putsEnabled: true
    })
    market.isMarketOpen.mockReturnValue(false)
    await sellCashSecuredPuts()
    expect(settings.getSettings).toHaveBeenCalled()
    expect(market.isMarketOpen).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Market Closed')
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
    // TODO Add all other imports here
  })

  it('Does nothing if the permitted stock list is empty', async () => {
    settings.getSettings.mockReturnValue({
      putsEnabled: true,
      priorityList: []
    })
    market.isMarketOpen.mockReturnValue(true)
    watchlistUtil.getWatchlist.mockReturnValue([])
    await sellCashSecuredPuts()
    expect(settings.getSettings).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith('Priority List or Watchlist is Empty')
    expect(watchlistUtil.getWatchlist).toHaveBeenCalled()
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(balanceUtil.getBalances).not.toHaveBeenCalled()
    // TODO Add all other imports here
  })

  it('Exits if pre-filter doesnt pass any stocks', async () => {

  })


  // balanceUtil.getBalances.mockReturnValue({ optionBuyingPower: 2001 })
})