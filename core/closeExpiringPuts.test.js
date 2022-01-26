const positionsUtil = require('../tradier/getPositions')
const pricesUtil = require('../tradier/getPrices')
const ordersUtil = require('../tradier/getOrders')
const sendOrdersUtil = require('../tradier/sendOrders')
const logUtil = require('../utils/log')
const settings = require('../utils/settings')
const market = require('../tradier/market')

const {
  _getPutsExpiringToday,
  _filterForPutsAtProfit,
  _closeExistingBTCOrders,
  closeExpiringPuts
} = require('./closeExpiringPuts')

const {
  generateOrderObject,
  generatePositionObject,
} = require('../utils/testHelpers')


describe('_getPutsExpiringToday', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    positionsUtil.getPositions = jest.fn()
    pricesUtil.getPrices = jest.fn()
  })

  it('Returns empty array if there arent any puts, should not call prices or quotes functions', async () => {
    const mockPositions = [
      generatePositionObject('AAPL', 3, 'call', 100, '2021-01-01', 1234),
      generatePositionObject('TSLA', 3, 'call', 100, '2021-01-01', 1234),
      generatePositionObject('SFIX', 3, 'call', 100, '2021-01-01', 1234),
      generatePositionObject('ASAN', 3, 'call', 100, '2021-01-01', 1234),
    ]
    positionsUtil.getPositions.mockReturnValue(mockPositions)
    const result = await _getPutsExpiringToday()
    expect(result).toEqual([])
    expect(pricesUtil.getPrices).not.toHaveBeenCalled()
  })

  it('Returns empty if no puts expiring today, should not call prices', async () => {
    const mockPositions = [
      generatePositionObject('TSLA', 3, 'put', 100, '2021-01-01', 1234, '2021-10-15'),
      generatePositionObject('ASAN', 3, 'put', 100, '2021-01-01', 1234, '2021-10-14'),
    ]
    positionsUtil.getPositions.mockReturnValue(mockPositions)
    pricesUtil.getPrices.mockReturnValue([
      {
        symbol: 'TSLA211015P3214',
        price: 100
      },
      {
        symbol: 'ASAN211014P3214',
        price: 100
      },
    ])
    const result = await _getPutsExpiringToday()
    expect(result).toEqual([])
    expect(pricesUtil.getPrices).not.toHaveBeenCalled()
  })

  it('Does not return an item if prices doesnt return it', async () => {
    const mockPositions = [
      generatePositionObject('TSLA', 3, 'put', 100, '2021-01-01', 1234, '2021-10-12'),
      generatePositionObject('ASAN', 3, 'put', 100, '2021-01-01', 1234, '2021-10-12'),
    ]
    positionsUtil.getPositions.mockReturnValue(mockPositions)
    pricesUtil.getPrices.mockReturnValue([
      {
        symbol: 'ASAN211012P3214',
        price: 100
      },
    ])

    const result = await _getPutsExpiringToday()

    expect(result).toEqual([
      {
        symbol: 'ASAN211012P3214',
        cost_basis: 100,
        date_acquired: '2021-01-01',
        expiration: '2021-10-12',
        id: 1234,
        price: 100,
        quantity: 3,
      }
    ])

    expect(pricesUtil.getPrices).toHaveBeenCalledWith([ 'TSLA211012P3214', 'ASAN211012P3214' ])
  })


  it('Filters for puts expiring today, should only call quotes for puts, and prices for expiring puts', async () => {
    const mockPositions = [
      generatePositionObject('AAPL', 3, 'call', 100, '2021-01-01', 1234, '2021-10-12'),
      generatePositionObject('TSLA', 3, 'put', 100, '2021-01-01', 1234, '2021-10-12'),
      generatePositionObject('SFIX', 3, 'call', 100, '2021-01-01', 1234, '2021-10-12'),
      generatePositionObject('ASAN', 3, 'put', 100, '2021-01-01', 1234, '2021-10-14'),
    ]
    positionsUtil.getPositions.mockReturnValue(mockPositions)
    pricesUtil.getPrices.mockReturnValue([
      {
        symbol: 'TSLA211012P3214',
        price: 100
      },
      {
        symbol: 'ASAN211014P3214',
        price: 100
      },
    ])

    const result = await _getPutsExpiringToday()

    expect(result).toEqual([
      {
        symbol: 'TSLA211012P3214',
        cost_basis: 100,
        date_acquired: '2021-01-01',
        expiration: '2021-10-12',
        id: 1234,
        price: 100,
        quantity: 3,
      }
    ])

    expect(pricesUtil.getPrices).toHaveBeenCalledWith([ 'TSLA211012P3214' ])
  })
})


describe('_filterForPutsAtProfit', () => {
  it('Filters for puts at a profit... duh', () => {
    const mockPuts = [
      {
        symbol: 'ZNGA1234',
        cost_basis: -42,
        quantity: -2,
        price: 0.25
      },
      {
        symbol: 'AAPL1234',
        cost_basis: -25,
        quantity: -1,
        price: 0.02
      },
      {
        symbol: 'TSLA1234',
        cost_basis: -80,
        quantity: -1,
        price: 0.81
      },
      {
        symbol: 'TTD1234',
        cost_basis: -80,
        quantity: -2,
        price: 0.41
      },
      {
        symbol: 'BB1234',
        cost_basis: -80,
        quantity: -2,
        price: 0.39
      },
    ]

    const result = _filterForPutsAtProfit(mockPuts)

    expect(result).toEqual([
      {
        symbol: 'AAPL1234',
        cost_basis: -25,
        quantity: -1,
        price: 0.02
      },
      {
        symbol: 'BB1234',
        cost_basis: -80,
        quantity: -2,
        price: 0.39
      },
    ])
  })
})


describe('_closeExistingBTCOrders', () => {
  beforeEach(() => {
    ordersUtil.getOrders = jest.fn()
    sendOrdersUtil.cancelOrders = jest.fn()
  })

  it('Gets all of the orders and closes the ones with the parameter symbols', async () => {
    ordersUtil.getOrders.mockReturnValue([
      generateOrderObject('ZNGA', 2, 'put', 'buy_to_close', 'open', 1234),
      generateOrderObject('BB', 2, 'put', 'sell_to_open', 'open', 4321),
      generateOrderObject('AAPL', 2, 'put', 'buy_to_close', 'open', 147),
      generateOrderObject('TSLA', 2, 'put', 'buy_to_close', 'open', 963),
    ])

    await _closeExistingBTCOrders(['ZNGA1234P3214', 'BB1234P3214', 'TSLA1234P3214'])

    expect(sendOrdersUtil.cancelOrders).toHaveBeenCalledWith([ 1234, 963 ])
  })
})


describe('closeExpiringPuts', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    positionsUtil.getPositions = jest.fn()
    pricesUtil.getPrices = jest.fn()
    ordersUtil.getOrders = jest.fn()
    sendOrdersUtil.cancelOrders = jest.fn()
    sendOrdersUtil.buyToCloseMarket = jest.fn()
    logUtil.log = jest.fn()
    settings.getSetting = jest.fn().mockReturnValue(true) // Return true for closeExpiringPuts setting
    market.isMarketOpen = jest.fn().mockReturnValue(true)
  })


  it('Catches and logs exceptions', async () => {
    market.isMarketOpen.mockImplementation(() => {
      throw new Error('Oh nooooooo!')
    })
    await closeExpiringPuts()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error: Oh nooooooo!'
    })
  })


  it('Does nothing if closeExpiringPuts is false', async () => {
    settings.getSetting.mockReturnValue(false)
    await closeExpiringPuts()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Close Expiring Puts Disabled')
    expect(positionsUtil.getPositions).not.toHaveBeenCalled()
    expect(pricesUtil.getPrices).not.toHaveBeenCalled()
    expect(ordersUtil.getOrders).not.toHaveBeenCalled()
    expect(sendOrdersUtil.cancelOrders).not.toHaveBeenCalled()
    expect(sendOrdersUtil.buyToCloseMarket).not.toHaveBeenCalled()
  })


  it('Does nothing if market is closed', async () => {
    settings.getSetting.mockReturnValue(true)
    market.isMarketOpen.mockReturnValue(false)
    await closeExpiringPuts()
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Market Closed')
    expect(positionsUtil.getPositions).not.toHaveBeenCalled()
    expect(pricesUtil.getPrices).not.toHaveBeenCalled()
    expect(ordersUtil.getOrders).not.toHaveBeenCalled()
    expect(sendOrdersUtil.cancelOrders).not.toHaveBeenCalled()
    expect(sendOrdersUtil.buyToCloseMarket).not.toHaveBeenCalled()
  })


  it('Logs initial action and if there are no expiring puts', async () => {
    positionsUtil.getPositions.mockReturnValue([])
    await closeExpiringPuts()
    expect(logUtil.log).toHaveBeenCalledTimes(2)
    expect(logUtil.log).toHaveBeenCalledWith('Closing profitable puts expiring today')
    expect(logUtil.log).toHaveBeenCalledWith('No profitable puts expiring today')
  })

  it('Cancels orders for expiring puts, creates new market orders', async () => {
    positionsUtil.getPositions.mockReturnValue([
      generatePositionObject('TSLA', 3, 'put', -200, '2021-01-01', 1234, '2021-10-12'),
      generatePositionObject('ASAN', 3, 'put', -200, '2021-01-01', 4321, '2021-10-12'),
    ])
    ordersUtil.getOrders.mockReturnValue([
      generateOrderObject('TSLA', 3, 'put', 'buy_to_close', 'open', 741, '2021-10-12'),
      generateOrderObject('ASAN', 3, 'put', 'buy_to_close', 'open', 369, '2021-10-12'),
    ])
    pricesUtil.getPrices.mockReturnValue([
      {
        symbol: 'TSLA211012P3214',
        price: 0.05
      },
      {
        symbol: 'ASAN211012P3214',
        price: 0.05
      },
    ])
    await closeExpiringPuts()
    expect(logUtil.log).toHaveBeenCalledWith('Cancelling current BTC orders')
    expect(sendOrdersUtil.cancelOrders).toHaveBeenCalledWith([ 741, 369 ])
    expect(sendOrdersUtil.buyToCloseMarket).toHaveBeenCalledTimes(2)
    expect(sendOrdersUtil.buyToCloseMarket).toHaveBeenCalledWith('TSLA', 'TSLA211012P3214', 3)
    expect(sendOrdersUtil.buyToCloseMarket).toHaveBeenCalledWith('ASAN', 'ASAN211012P3214', 3)
  })
})