const balanceUtil = require('../tradier/getBalances')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const sendOrdersUtil = require('../tradier/sendOrders')


const {
  _getAffordableOptions,
  _getEstimatedAllocation,
  _getOptionsUnderMaxAllocation,
  _getPutOptionPriority,
  _getOptionsToSell,
  sellNakedPutsCycle,
} = require('./nakedPutCycle')

const {
  generateOrderObject,
  generatePositionObject,
} = require('../utils/testHelpers')


describe('_getAffordableOptions', () => {
  it('Returns options worth less than buyingPower', () => {
    const options = [
      { symbol: 'AAPL', strike: 120 },
      { symbol: 'TSLA', strike: 30 },
      { symbol: 'IBKR', strike: 51 },
      { symbol: 'FB', strike: 10 },
    ]
    const result = _getAffordableOptions(options, 5000)
    expect(result).toEqual([
      { symbol: 'TSLA', strike: 30 },
      { symbol: 'FB', strike: 10 },
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

  it('Returns the estimated allocation for each stock based on the strike price, sorted lowest to highest', () => {
    const prices = [
      { symbol: 'AAPL1234P321', strike: 120 },
      { symbol: 'TSLA1234P321', strike: 100 },
      { symbol: 'PINS1234P321', strike: 501 },
      { symbol: 'AXON1234P321', strike: 12 },
    ]
    const relevantPositions = [
      generatePositionObject('AAPL', 2, 'put'),
      generatePositionObject('AAPL', 1, 'put'),
      generatePositionObject('TSLA', -1, 'put'),
    ]
    const putOrders = [
      generateOrderObject('PINS', -2, 'put', 'sell_to_open'),
      generateOrderObject('PINS', 1, 'put', 'sell_to_open'),
      generateOrderObject('TSLA', 1, 'put', 'sell_to_open'),
    ]
    const result = _getEstimatedAllocation(prices, relevantPositions, putOrders)
    expect(result).toEqual([
      {
        symbol: 'AXON1234P321',
        strike: 12,
        allocation: 0,
        potentialAllocation: 1200,
      },
      {
        symbol: 'TSLA1234P321',
        strike: 100,
        allocation: 20000,
        potentialAllocation: 30000,
      },
      {
        symbol: 'AAPL1234P321',
        strike: 120,
        allocation: 36000,
        potentialAllocation: 48000,
      },
      {
        symbol: 'PINS1234P321',
        strike: 501,
        allocation: 150300,
        potentialAllocation: 200400,
      },
    ])
  })


  it('Takes actual positions into consideration', () => {
    const prices = [
      { symbol: 'AAPL1234P321', strike: 120 },
      { symbol: 'TSLA1234P321', strike: 100 },
      { symbol: 'PINS1234P321', strike: 501 },
      { symbol: 'AXON1234P321', strike: 12 },
    ]
    const relevantPositions = [
      generatePositionObject('AAPL', 2, 'put'),
      generatePositionObject('AAPL', 1, 'put'),
      generatePositionObject('TSLA', -1, 'put'),
      generatePositionObject('AXON', 100, 'stock'),
      generatePositionObject('TSLA', 200, 'stock'),
    ]
    const putOrders = [
      generateOrderObject('PINS', -2, 'put', 'sell_to_open'),
      generateOrderObject('PINS', 1, 'put', 'sell_to_open'),
      generateOrderObject('TSLA', 1, 'put', 'sell_to_open'),
    ]
    const result = _getEstimatedAllocation(prices, relevantPositions, putOrders)
    expect(result).toEqual([
      {
        symbol: 'AXON1234P321',
        strike: 12,
        allocation: 1200,
        potentialAllocation: 2400,
      },
      {
        symbol: 'AAPL1234P321',
        strike: 120,
        allocation: 36000,
        potentialAllocation: 48000,
      },
      {
        symbol: 'TSLA1234P321',
        strike: 100,
        allocation: 40000,
        potentialAllocation: 50000,
      },
      {
        symbol: 'PINS1234P321',
        strike: 501,
        allocation: 150300,
        potentialAllocation: 200400,
      },
    ])
  })
})


describe('_getOptionsUnderMaxAllocation', () => {
  it('Returns the options whose potential allocation is lower than the maximum', () => {
    const maxAllocation = 48000
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
    const result = _getOptionsUnderMaxAllocation(stocks, maxAllocation)
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
    ])
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


describe('sellNakedPutsCycle', () => {
  const defaultSettings = {
    maxAllocation: 1000,
    reserve: 0,
  }

  beforeEach(() => {
    balanceUtil.getBalances = jest.fn()
    positionUtil.getPositions = jest.fn()
    orderUtil.getOrders = jest.fn()
    sendOrdersUtil.sellToOpen = jest.fn()
  })

  it('Exits if bestOptions list is empty', async () => {
    const result = await sellNakedPutsCycle([], defaultSettings)
    expect(result).toEqual('No options choices =(')
  })
  
  it('Exits if theres no cash', async () => {
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 0
    })
    const bestOptions = [
      { symbol: 'AAPL', strike: 140 },
      { symbol: 'MSFT', strike: 500 },
    ]
    const result = await sellNakedPutsCycle(bestOptions, defaultSettings)
    expect(result).toEqual('No money =(')
  })

  it('Exits if theres cash, but the reserve zeros it out', async () => {
    const mockSettings = { ...defaultSettings, reserve: 50000 }
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 50000
    })
    const bestOptions = [
      { symbol: 'AAPL', strike: 140 },
      { symbol: 'MSFT', strike: 500 },
    ]
    const result = await sellNakedPutsCycle(bestOptions, mockSettings)
    expect(result).toEqual('No money =(')
  })

  it('Exits if options too expensive for option buying power; collateral needed is 100 * option strike', async () => {
    const mockSettings = { ...defaultSettings, maxAllocation: 10000000 }
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 1000
    })
    const bestOptions = [
      { symbol: 'AAPL', strike: 140 },
      { symbol: 'MSFT', strike: 500 },
    ]
    const result = await sellNakedPutsCycle(bestOptions, mockSettings)
    expect(result).toEqual('Too broke for this =(')
  })


  it('Exits if options too expensive for buying power with reserve', async () => {
    const mockSettings = {
      ...defaultSettings,
      maxAllocation: 10000000,
      reserve: 40000,
    }
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 50000
    })
    const bestOptions = [
      { symbol: 'AAPL', strike: 140 },
      { symbol: 'MSFT', strike: 500 },
    ]
    const result = await sellNakedPutsCycle(bestOptions, mockSettings)
    expect(result).toEqual('Too broke for this =(')
  })


  it('Exits if all currently held positions have reached maxAllocation', async () => {
    const mockSettings = { ...defaultSettings, maxAllocation: 1000000 }
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 10000000
    })
    const bestOptions = [
      { symbol: 'AAPL', strike: 140 },
      { symbol: 'MSFT', strike: 500 },
    ]
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 500, 'put'),
      generatePositionObject('MSFT', 500, 'put'),
    ])
    orderUtil.getOrders.mockReturnValue([])
    const result = await sellNakedPutsCycle(bestOptions, mockSettings)
    expect(result).toEqual('Looks like everything is maxed out =(')
  })


  it('Creates an order for each stock under its max allocation up until buying power is exhaused', async () => {
    const mockSettings = { ...defaultSettings, maxAllocation: 1000000 }
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 50001
    })
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 1, 'stock'),
      generatePositionObject('MSFT', 1, 'stock'),
    ])
    orderUtil.getOrders.mockReturnValue([])

    const bestOptions = [
      {
        symbol: 'WMT211029P00146000',
        premium: 121,
        strike: 120,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      },
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 1460,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      },
      {
        symbol: 'MSFT211029P00146000',
        premium: 121,
        strike: 80,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      }
    ]

    await sellNakedPutsCycle(bestOptions, mockSettings)
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledTimes(2)
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledWith('MSFT', 'MSFT211029P00146000', 1)
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledWith('WMT', 'WMT211029P00146000', 1)
  })


  it('Creates an order for each stock under its max allocation up until buying power is exhaused; with reserve', async () => {
    const mockSettings = {
      ...defaultSettings,
      maxAllocation: 1000000,
      reserve: 40000
    }
    balanceUtil.getBalances.mockReturnValue({
      optionBuyingPower: 50001
    })
    positionUtil.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 1, 'stock'),
      generatePositionObject('MSFT', 1, 'put'),
    ])
    orderUtil.getOrders.mockReturnValue([])

    const bestOptions = [
      {
        symbol: 'WMT211029P00146000',
        premium: 121,
        strike: 120,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      },
      {
        symbol: 'AAPL211029P00146000',
        premium: 121,
        strike: 1460,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      },
      {
        symbol: 'MSFT211029P00146000',
        premium: 121,
        strike: 80,
        delta: 0.321088,
        distanceTo30: 0.021087999999999996,
        expiration: '2021-10-29',
        weeklyRate: 121,
      }
    ]

    await sellNakedPutsCycle(bestOptions, mockSettings)
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledTimes(1)
    expect(sendOrdersUtil.sellToOpen).toHaveBeenCalledWith('MSFT', 'MSFT211029P00146000', 1)
  })
})