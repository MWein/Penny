const balanceUtil = require('../tradier/getBalances')
//const watchlistUtil = require('../tradier/watchlist')
const priceUtil = require('../tradier/getPrices')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const bestOption = require('../tradier/selectBestOption')
const sendOrdersUtil = require('../tradier/sendOrders')


const {
  _getAffordableStocks,
  _getEstimatedAllocation,
  _getStocksUnderMaxAllocation,
  _getPutOptionPriority,
  _getOptionsToSell,
  _sellNakedPutsCycle,
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

  it('Returns the estimated allocation for each stock based on the current price, sorted lowest to highest', () => {
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
        symbol: 'AXON',
        price: 12,
        allocation: 0,
        potentialAllocation: 1200,
      },
      {
        symbol: 'TSLA',
        price: 100,
        allocation: 20000,
        potentialAllocation: 30000,
      },
      {
        symbol: 'AAPL',
        price: 120,
        allocation: 36000,
        potentialAllocation: 48000,
      },
      {
        symbol: 'PINS',
        price: 501,
        allocation: 150300,
        potentialAllocation: 200400,
      },
    ])
  })
})


describe('_getStocksUnderMaxAllocation', () => {
  it('Returns the tickers whose potential allocation is lower than the maximum', () => {
    process.env.MAXIMUMALLOCATION = 48000
    const stocks = [
      {
        symbol: 'AXON',
        price: 12,
        allocation: 0,
        potentialAllocation: 1200,
      },
      {
        symbol: 'TSLA',
        price: 100,
        allocation: 20000,
        potentialAllocation: 30000,
      },
      {
        symbol: 'AAPL',
        price: 120,
        allocation: 36000,
        potentialAllocation: 48000,
      },
      {
        symbol: 'PINS',
        price: 501,
        allocation: 150300,
        potentialAllocation: 200400,
      },
    ]
    const result = _getStocksUnderMaxAllocation(stocks)
    expect(result).toEqual([ 'AXON', 'TSLA' ])
  })
})


describe('_getPutOptionPriority', () => {
  it('Skips nulls if no best option was returned in a cycle', () => {
    const bestOptions = [
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 146,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      },
      null,
    ]
    const result = _getPutOptionPriority(bestOptions)
    expect(result).toEqual([
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 146,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
        percReturn: 0.008287671232876713
      },
    ])
  })

  it('Returns a list of best options with percent return; sorted best to worst', () => {
    const bestOptions = [
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 146,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      },
      {
        symbol: 'PINS211105P00047500',
        premium: 168,
        strike: 47.5,
        delta: 0.305893,
        distanceTo30: 0.005893000000000037,
        expiration: '2021-11-05',
        weeklyRate: 84,
      },
      {
        symbol: 'WMT211029P00149000',
        premium: 62,
        strike: 149,
        delta: 0.33609,
        distanceTo30: 0.03609000000000001,
        expiration: '2021-10-29',
        weeklyRate: 62,
      }
    ]
    const result = _getPutOptionPriority(bestOptions)
    expect(result).toEqual([
      {
        symbol: 'PINS211105P00047500',
        premium: 168,
        strike: 47.5,
        delta: 0.305893,
        distanceTo30: 0.005893000000000037,
        expiration: '2021-11-05',
        weeklyRate: 84,
        percReturn: 0.03536842105263158
      },
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 146,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
        percReturn: 0.008287671232876713
      },
      {
        symbol: 'WMT211029P00149000',
        premium: 62,
        strike: 149,
        delta: 0.33609,
        distanceTo30: 0.03609000000000001,
        expiration: '2021-10-29',
        weeklyRate: 62,
        percReturn: 0.004161073825503355
      }
    ])
  })
})


describe('_getOptionsToSell', () => {
  it('Returns all if the buying power is greater than the sum of the options', () => {
    const options = [
      {
        symbol: 'PINS211105P00047500',
        premium: 168,
        strike: 47.5,
        delta: 0.305893,
        distanceTo30: 0.005893000000000037,
        expiration: '2021-11-05',
        weeklyRate: 84,
        percReturn: 0.03536842105263158
      },
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 146,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
        percReturn: 0.008287671232876713
      },
      {
        symbol: 'WMT211029P00149000',
        premium: 62,
        strike: 149,
        delta: 0.33609,
        distanceTo30: 0.03609000000000001,
        expiration: '2021-10-29',
        weeklyRate: 62,
        percReturn: 0.004161073825503355
      }
    ]
    const results = _getOptionsToSell(options, 35000)
    expect(results).toEqual([
      'PINS211105P00047500',
      'AAPL211029P00146000',
      'WMT211029P00149000'
    ])
  })

  it('Returns only the best options, cuts off when buying power is exhaused', () => {
    const options = [
      {
        symbol: 'PINS211105P00047500',
        premium: 168,
        strike: 47.5,
        delta: 0.305893,
        distanceTo30: 0.005893000000000037,
        expiration: '2021-11-05',
        weeklyRate: 84,
        percReturn: 0.03536842105263158
      },
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 146,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
        percReturn: 0.008287671232876713
      },
      {
        symbol: 'WMT211029P00149000',
        premium: 62,
        strike: 149,
        delta: 0.33609,
        distanceTo30: 0.03609000000000001,
        expiration: '2021-10-29',
        weeklyRate: 62,
        percReturn: 0.004161073825503355
      }
    ]
    const results = _getOptionsToSell(options, 21000)
    expect(results).toEqual([
      'PINS211105P00047500',
      'AAPL211029P00146000'
    ])
  })

  it('Returns only the best options, skips a stock if its above its buying power, but keeps the next if its below', () => {
    const options = [
      {
        symbol: 'PINS211105P00047500',
        premium: 168,
        strike: 47.5,
        delta: 0.305893,
        distanceTo30: 0.005893000000000037,
        expiration: '2021-11-05',
        weeklyRate: 84,
        percReturn: 0.03536842105263158
      },
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 1460,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
        percReturn: 0.008287671232876713
      },
      {
        symbol: 'WMT211029P00149000',
        premium: 62,
        strike: 149,
        delta: 0.33609,
        distanceTo30: 0.03609000000000001,
        expiration: '2021-10-29',
        weeklyRate: 62,
        percReturn: 0.004161073825503355
      }
    ]
    const results = _getOptionsToSell(options, 21000)
    expect(results).toEqual([
      'PINS211105P00047500',
      'WMT211029P00149000'
    ])
  })
})


describe('_sellNakedPutsCycle', () => {
  beforeEach(() => {
    balanceUtil.getBalances = jest.fn()
    priceUtil.getPrices = jest.fn()
    positionUtil.getPositions = jest.fn()
    orderUtil.getOrders = jest.fn()
    bestOption.selectBestOption = jest.fn()
    sendOrdersUtil.sellToOpen = jest.fn()
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

  it('Exits if all currently held positions have reached MAXIMUMALLOCATION', async () => {
    process.env.MAXIMUMALLOCATION = 1000000
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 10000000
    })
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 140 },
      { symbol: 'MSFT', price: 500 },
    ])
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 500, 'put'),
      generatePositionObject('MSFT', 500, 'put'),
    ])
    orderUtil.getOrders.mockReturnValue([])
    const result = await _sellNakedPutsCycle([ 'AAPL', 'MSFT' ])
    expect(result).toEqual('Looks like everything is maxed out =(')
  })

  it('For every stock that is under its max allocation, selects best position', async () => {
    process.env.MAXIMUMALLOCATION = 1000000
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 10000000
    })
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'AAPL', price: 140 },
      { symbol: 'MSFT', price: 500 },
    ])
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 500, 'put'),
      generatePositionObject('MSFT', 1, 'put'),
    ])
    orderUtil.getOrders.mockReturnValue([])
    bestOption.selectBestOption.mockReturnValue(null)
    await _sellNakedPutsCycle([ 'AAPL', 'MSFT' ])
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(1)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('MSFT', 'put')
  })

  it('Creates an order for each stock under its max allocation up until buying power is exhaused', async () => {
    process.env.MAXIMUMALLOCATION = 1000000
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 50001
    })
    priceUtil.getPrices.mockReturnValue([
      { symbol: 'WMT', price: 20 },
      { symbol: 'AAPL', price: 140 },
      { symbol: 'MSFT', price: 500 },
    ])
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 1, 'put'),
      generatePositionObject('MSFT', 1, 'put'),
    ])
    orderUtil.getOrders.mockReturnValue([])

    // Doesn't matter much what these are
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'WMT211029P00146000',
      premium: 121,
      strike: 120,
      delta: 0.321088,
      distanceTo30: 0.021087999999999996,
      expiration: '2021-10-29',
      weeklyRate: 121,
    })
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'AAPL211029P00146000',
      premium: 121,
      strike: 1460,
      delta: 0.321088,
      distanceTo30: 0.021087999999999996,
      expiration: '2021-10-29',
      weeklyRate: 121,
    })
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'MSFT211029P00146000',
      premium: 121,
      strike: 80,
      delta: 0.321088,
      distanceTo30: 0.021087999999999996,
      expiration: '2021-10-29',
      weeklyRate: 121,
    })

    await _sellNakedPutsCycle([ 'AAPL', 'MSFT' ])
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledTimes(2)
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledWith('MSFT', 'MSFT211029P00146000', 1)
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledWith('WMT', 'WMT211029P00146000', 1)
  })
})