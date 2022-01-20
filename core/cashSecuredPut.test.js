const settings = require('../utils/settings')
const logUtil = require('../utils/log')
const market = require('../tradier/market')
const watchlistUtil = require('../utils/watchlist')
const priceUtil = require('../tradier/getPrices')
const balanceUtil = require('../tradier/getBalances')
const bestOptionUtil = require('../tradier/selectBestOption')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const sendOrdersUtil = require('../tradier/sendOrders')

const {
  _getWatchlistPriorityUnion,
  _preStartFilterWatchlistItems,
  _selectBestOptionsFromWatchlist,
  _selectOptionsToSell,
  sellCashSecuredPuts,
} = require('./cashSecuredPut')

const {
  generateSymbol,
  generateOrderObject,
  generatePositionObject,
} = require('../utils/testHelpers')


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
    expect(positionUtil.getPositions).not.toHaveBeenCalled()
  })

  it('On the first pass, filters out enabled of false.', async () => {
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 1, false, 0.3)
    ], 1000)
    expect(result).toEqual([])
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(positionUtil.getPositions).not.toHaveBeenCalled()
  })

  it('Gets prices for items that make it through the first pass filter. Returns anyway if a price isnt returned for some reason.', async () => {
    priceUtil.getPrices.mockReturnValue([])
    positionUtil.getPositions.mockReturnValue([])
    orderUtil.getOrders.mockReturnValue([])
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
    positionUtil.getPositions.mockReturnValue([])
    orderUtil.getOrders.mockReturnValue([])
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
    positionUtil.getPositions.mockReturnValue([])
    orderUtil.getOrders.mockReturnValue([])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Gets prices for items that make it through the first pass filter. Adjusts maximumPositions if there are stock positions.', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
    ])
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('MSFT', 230, 'stock'),
      generatePositionObject('AAPL', 100, 'stock'),
    ])
    orderUtil.getOrders.mockReturnValue([])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 5, true, 0.3)
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 3, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Gets prices for items that make it through the first pass filter. Adjusts maximumPositions if there are put positions.', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
    ])
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('MSFT', 3, 'put'),
      generatePositionObject('AAPL', 1, 'put'),
    ])
    orderUtil.getOrders.mockReturnValue([])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 5, true, 0.3)
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 2, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Gets prices for items that make it through the first pass filter. Adjusts maximumPositions if there are stock and put positions.', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
    ])
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('MSFT', 300, 'stock'),
      generatePositionObject('MSFT', 1, 'put'),
    ])
    orderUtil.getOrders.mockReturnValue([])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 5, true, 0.3)
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 1, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Gets prices for items that make it through the first pass filter. Adjusts maximumPositions if there are put orders.', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
    ])
    positionUtil.getPositions.mockReturnValue([])
    orderUtil.getOrders.mockReturnValue([
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open'),
    ])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 5, true, 0.3)
    ], 1000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 3, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('If there are more positions already out there than maxPositions, return nothing.', async () => {
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
    ])
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('MSFT', 300, 'stock'),
    ])
    orderUtil.getOrders.mockReturnValue([
      generateOrderObject('MSFT', -3, 'put', 'sell_to_open'),
    ])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('MSFT', 5, true, 0.3)
    ], 1000)
    expect(result).toEqual([])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('All rules', async () => {
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('MSFT', 3, 'put'),
      generatePositionObject('AAPL', 400, 'stock'),
    ])
    orderUtil.getOrders.mockReturnValue([
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open'),
    ])
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'MSFT', price: 5 },
      { symbol: 'AAPL', price: 12 },
    ])
    const result = await _preStartFilterWatchlistItems([
      _mockPutWatchlistItem('AAPL', 4, true, 0.3),
      _mockPutWatchlistItem('MSFT', 7, true, 0.3),
      _mockPutWatchlistItem('TSLA', 0, true, 0.3),
      _mockPutWatchlistItem('ABNB', 1, false, 0.3),
    ], 4000)
    expect(result).toEqual([
      _mockPutWatchlistItem('MSFT', 2, true, 0.3)
    ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'MSFT' ])
  })
})



describe('_selectBestOptionsFromWatchlist', () => {
  beforeEach(() => {
    bestOptionUtil.selectBestOption = jest.fn()
  })

  it('Goes through each watchlist item and calls the best option function', async () => {
    bestOptionUtil.selectBestOption.mockImplementation(symbol => ({
      symbol: `${symbol}1234P3214`
    }))
    const bestOptions = await _selectBestOptionsFromWatchlist([
      _mockPutWatchlistItem('AAPL', 5, true, 0.314),
      _mockPutWatchlistItem('MSFT', 4, true, 0.512),
    ])
    expect(bestOptions).toEqual([
      {
        optionSymbol: 'AAPL1234P3214',
        maxPositions: 5,
      },
      {
        optionSymbol: 'MSFT1234P3214',
        maxPositions: 4,
      },
    ])
    expect(bestOptionUtil.selectBestOption).toHaveBeenCalledTimes(2)
    expect(bestOptionUtil.selectBestOption).toHaveBeenCalledWith('AAPL', 'put', null, 0.314)
    expect(bestOptionUtil.selectBestOption).toHaveBeenCalledWith('MSFT', 'put', null, 0.512)
  })

  it('Returns only valid options if something comes up null', async () => {
    bestOptionUtil.selectBestOption.mockReturnValueOnce(null)
    bestOptionUtil.selectBestOption.mockReturnValueOnce({
      symbol: 'MSFT1234P3214'
    })
    const bestOptions = await _selectBestOptionsFromWatchlist([
      _mockPutWatchlistItem('AAPL', 5, true, 0.314),
      _mockPutWatchlistItem('MSFT', 4, true, 0.512),
    ])
    expect(bestOptions).toEqual([
      {
        optionSymbol: 'MSFT1234P3214',
        maxPositions: 4,
      },
    ])
    expect(bestOptionUtil.selectBestOption).toHaveBeenCalledTimes(2)
    expect(bestOptionUtil.selectBestOption).toHaveBeenCalledWith('AAPL', 'put', null, 0.314)
    expect(bestOptionUtil.selectBestOption).toHaveBeenCalledWith('MSFT', 'put', null, 0.512)
  })
})



describe('_selectOptionsToSell', () => {
  it('Sells only one of the one symbol it can actually afford', () => {
    const options = [
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        maxPositions: 2,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 150),
        maxPositions: 5,
      },
      {
        optionSymbol: generateSymbol('ABNB', 'put', '2022-01-01', 220),
        maxPositions: 1,
      },
    ]
    expect(_selectOptionsToSell(3000, options)).toEqual([
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        positions: 1,
      },
    ])
  })


  it('Sells two of the one symbol it can actually afford', () => {
    const options = [
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        maxPositions: 2,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 150),
        maxPositions: 5,
      },
      {
        optionSymbol: generateSymbol('ABNB', 'put', '2022-01-01', 220),
        maxPositions: 1,
      },
    ]
    expect(_selectOptionsToSell(5000, options)).toEqual([
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        positions: 2,
      },
    ])
  })


  it('Sells one of each symbol that it can afford', () => {
    const options = [
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        maxPositions: 2,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 25),
        maxPositions: 5,
      },
      {
        optionSymbol: generateSymbol('ABNB', 'put', '2022-01-01', 220),
        maxPositions: 1,
      },
    ]
    expect(_selectOptionsToSell(5000, options)).toEqual([
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        positions: 1,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 25),
        positions: 1,
      },
    ])
  })


  it('Sells 2 of the first, and 1 of the second', () => {
    const options = [
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        maxPositions: 2,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 25),
        maxPositions: 5,
      },
      {
        optionSymbol: generateSymbol('ABNB', 'put', '2022-01-01', 220),
        maxPositions: 1,
      },
    ]
    expect(_selectOptionsToSell(7500, options)).toEqual([
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        positions: 2,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 25),
        positions: 1,
      },
    ])
  })


  it('Sells everything if theres enough capital', () => {
    const options = [
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        maxPositions: 2,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 25),
        maxPositions: 5,
      },
      {
        optionSymbol: generateSymbol('ABNB', 'put', '2022-01-01', 220),
        maxPositions: 1,
      },
    ]
    expect(_selectOptionsToSell(500000, options)).toEqual([
      {
        optionSymbol: generateSymbol('TSLA', 'put', '2022-01-01', 25),
        positions: 2,
      },
      {
        optionSymbol: generateSymbol('AAPL', 'put', '2022-01-01', 25),
        positions: 5,
      },
      {
        optionSymbol: generateSymbol('ABNB', 'put', '2022-01-01', 220),
        positions: 1,
      },
    ])
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
    sendOrdersUtil.sellToOpen = jest.fn()
  })

  it('Catches and logs exceptions', async () => {
    market.isMarketOpen.mockImplementation(() => {
      throw new Error('Oh nooooooo!')
    })
    await sellCashSecuredPuts()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error: Oh nooooooo!'
    })
  })

  it('Does nothing putsEnabled in settings is false', async () => {
    settings.getSettings.mockReturnValue({
      putsEnabled: false
    })
    await sellCashSecuredPuts()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Puts Disabled')
    expect(market.isMarketOpen).not.toHaveBeenCalled()
  })

  it('Does nothing if the market is not open', async () => {
    settings.getSettings.mockReturnValue({
      putsEnabled: true
    })
    market.isMarketOpen.mockReturnValue(false)
    await sellCashSecuredPuts()
    expect(market.isMarketOpen).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Market Closed')
    expect(balanceUtil.getBalances).not.toHaveBeenCalled()
  })

  it('Does nothing if balance is 0 or negative (reserve)', async () => {
    settings.getSettings.mockReturnValue({
      putsEnabled: true,
      reserve: 10
    })
    market.isMarketOpen.mockReturnValue(true)
    balanceUtil.getBalances.mockReturnValue({ optionBuyingPower: 10 })
    await sellCashSecuredPuts()
    expect(settings.getSettings).toHaveBeenCalled()
    expect(balanceUtil.getBalances).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('No buying power')
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
  })

  it('Does nothing if the permitted stock list is empty', async () => {
    settings.getSettings.mockReturnValue({
      putsEnabled: true,
      priorityList: []
    })
    market.isMarketOpen.mockReturnValue(true)
    balanceUtil.getBalances.mockReturnValue({ optionBuyingPower: 1000 })
    watchlistUtil.getWatchlist.mockReturnValue([])
    await sellCashSecuredPuts()
    expect(settings.getSettings).toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith('Priority List or Watchlist is Empty')
    expect(watchlistUtil.getWatchlist).toHaveBeenCalled()
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    // TODO Add all other imports here
  })


  // balanceUtil.getBalances.mockReturnValue({ optionBuyingPower: 2001 })
})