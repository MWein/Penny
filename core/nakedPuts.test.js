const balanceUtil = require('../tradier/getBalances')
const watchlistUtil = require('../tradier/watchlist')
const priceUtil = require('../tradier/getPrices')

const {
  _getAffordableStocks,
  _getEstimatedAllocation,
  _sellNakedPutsCycle
} = require('./nakedPut')

const {
  generateOrderObject,
  generatePositionObject,
} = require('../utils/testHelpers')


describe('_getAffordableStocks', () => {
  it('Filters out stocks that are over buying power', () => {
    process.env.MAXIMUMALLOCATION = 500000
    const prices = [
      { symbol: 'AAPL', price: 140 },
      { symbol: 'MSFT', price: 20 },
      { symbol: 'PINS', price: 30 },
    ]
    const result = _getAffordableStocks(prices, 3000)
    expect(result).toEqual([
      { symbol: 'MSFT', price: 20 },
    ])
  })

  it('Filters out stocks that are over maximum allocation setting', () => {
    process.env.MAXIMUMALLOCATION = 3000
    const prices = [
      { symbol: 'MSFT', price: 140 },
      { symbol: 'AAPL', price: 20 },
      { symbol: 'PINS', price: 30 },
    ]
    const result = _getAffordableStocks(prices, 500000)
    expect(result).toEqual([
      { symbol: 'AAPL', price: 20 },
    ])
  })
})


describe('_getEstimatedAllocation', () => {
  it('Returns empty if prices is empty', () => {
    const prices = []
    const putPositions = [
      generatePositionObject('AAPL', 2, 'put'),
    ]
    const putOrders = [
      generateOrderObject('TSLA', 2, 'put', 'sell_to_open'),
    ]
    const result = _getEstimatedAllocation(prices, putPositions, putOrders)
    expect(result).toEqual([])
  })

  it('Returns the estimated allocation for each stock based on the current price', () => {
    const prices = [
      { symbol: 'AAPL', price: 120 },
      { symbol: 'TSLA', price: 100 },
      { symbol: 'PINS', price: 501 },
      { symbol: 'AXON', price: 12 },
    ]
    const putPositions = [
      generatePositionObject('AAPL', 2, 'put'),
      generatePositionObject('AAPL', 1, 'put'),
      generatePositionObject('TSLA', -1, 'put'),
    ]
    const putOrders = [
      generateOrderObject('PINS', -2, 'put', 'sell_to_open'),
      generateOrderObject('PINS', 1, 'put', 'sell_to_open'),
      generateOrderObject('TSLA', 1, 'put', 'sell_to_open'),
    ]
    const result = _getEstimatedAllocation(prices, putPositions, putOrders)
    expect(result).toEqual([
      {
        symbol: 'AAPL',
        price: 120,
        allocation: 36000
      },
      {
        symbol: 'TSLA',
        price: 100,
        allocation: 20000
      },
      {
        symbol: 'PINS',
        price: 501,
        allocation: 150300
      },
      {
        symbol: 'AXON',
        price: 12,
        allocation: 0
      },
    ])
  })
})


describe('_sellNakedPutsCycle', () => {
  beforeEach(() => {
    balanceUtil.getBalances = jest.fn()
    watchlistUtil.getWatchlistSymbols = jest.fn()
    priceUtil.getPrices = jest.fn()
  })

  it('Exits if watchlist is empty', async () => {
    const result = await _sellNakedPutsCycle()
    expect(result).toEqual('Nothing in watchlist =(')
  })
  
  it('Exits if theres no cash', async () => {
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 0
    })
    const result = await _sellNakedPutsCycle([ 'AAPL', 'TSLA', 'PINS', 'AXON', 'MSFT' ])
    expect(result).toEqual('No money =(')
  })

  it('Gets prices for each stock in the watchlist', async () => {
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 1000
    })
    priceUtil.getPrices.mockReturnValue([])
    await _sellNakedPutsCycle([ 'AAPL', 'TSLA', 'PINS', 'AXON', 'MSFT' ])
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'AAPL', 'TSLA', 'PINS', 'AXON', 'MSFT' ])
  })

  it('Exits if stocks too expensive for option buying power; collateral needed is 100 * option strike', async () => {
    process.env.MAXIMUMALLOCATION = 10000000
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 1000
    })
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 140 },
      { symbol: 'MSFT', price: 500 },
    ])
    const result = await _sellNakedPutsCycle([ 'AAPL', 'TSLA', 'PINS', 'AXON', 'MSFT' ])
    expect(result).toEqual('Too broke for this =(')
  })

  it('Exits if collateral needed for every stock exceeds MAXIMUMALLOCATION', async () => {
    process.env.MAXIMUMALLOCATION = 100
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 10000000
    })
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 140 },
      { symbol: 'MSFT', price: 500 },
    ])
    const result = await _sellNakedPutsCycle([ 'AAPL', 'TSLA', 'PINS', 'AXON', 'MSFT' ])
    expect(result).toEqual('Too broke for this =(')
  })

})