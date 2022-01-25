const network = require('../utils/network')
const {
  filterForCoveredCallOrders,
  filterForCashSecuredPutOrders,
  filterForOptionBuyToCloseOrders,
  getOrder,
  getOrders,
} = require('./getOrders')
const { generateOrderObject } = require('../utils/testHelpers')


describe('Order filter functions', () => {
  const orders = [
    generateOrderObject('AAPL', 50, 'stock', 'buy', 'pending'),
    generateOrderObject('AXON', 7, 'call', 'sell_to_open', 'pending'),
    generateOrderObject('TSLA', 50, 'call', 'buy_to_close', 'open'),
    generateOrderObject('FB', 50, 'put', 'sell_to_open', 'canceled'),
    generateOrderObject('MSFT', 50, 'call', 'sell_to_open', 'open'),
    generateOrderObject('SFIX', 50, 'put', 'sell_to_open', 'pending'),
    generateOrderObject('WMT', 50, 'put', 'sell_to_open', 'open'),
    generateOrderObject('IBKR', 50, 'put', 'buy_to_close', 'open'),
  ]

  it('filterForCoveredCallOrders', () => {
    const actual = filterForCoveredCallOrders(orders)
    expect(actual).toEqual([
      generateOrderObject('AXON', 7, 'call', 'sell_to_open', 'pending'),
      generateOrderObject('MSFT', 50, 'call', 'sell_to_open', 'open'),
    ])
  })

  it('filterForCashSecuredPutOrders', () => {
    const actual = filterForCashSecuredPutOrders(orders)
    expect(actual).toEqual([
      generateOrderObject('SFIX', 50, 'put', 'sell_to_open', 'pending'),
      generateOrderObject('WMT', 50, 'put', 'sell_to_open', 'open'),
    ])
  })

  it('filterForOptionBuyToCloseOrders', () => {
    const actual = filterForOptionBuyToCloseOrders(orders)
    expect(actual).toEqual([
      generateOrderObject('TSLA', 50, 'call', 'buy_to_close', 'open'),
      generateOrderObject('IBKR', 50, 'put', 'buy_to_close', 'open'),
    ])
  })
})


describe('getOrder', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })

  it('Creates the URL using the account number env and orderID', async () => {
    process.env.ACCOUNTNUM = 'somethingsomthing'
    network.get.mockReturnValue({
      orders: 'null'
    })
    await getOrder(1234)
    expect(network.get).toHaveBeenCalledWith('accounts/somethingsomthing/orders/1234')
  })

  it('Returns null if Tradier returns null', async () => {
    network.get.mockReturnValue({
      orders: 'null'
    })
    const orders = await getOrder(1234)
    expect(orders).toEqual(null)
  })

  it('Returns order', async () => {
    const response = {
      orders: {
        order: generateOrderObject('AAPL', 50, 'stock', 'buy', 'open', 228175)
      }
    }
    network.get.mockReturnValue(response)

    const orders = await getOrder(1234)
    expect(orders).toEqual(response.orders.order)
  })
})


describe('getOrders', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })

  it('Creates the URL using the account number env', async () => {
    process.env.ACCOUNTNUM = 'somethingsomthing'
    network.get.mockReturnValue({
      orders: 'null'
    })
    await getOrders()
    expect(network.get).toHaveBeenCalledWith('accounts/somethingsomthing/orders')
  })

  it('Returns empty array if Tradier returns null', async () => {
    network.get.mockReturnValue({
      orders: 'null'
    })
    const orders = await getOrders()
    expect(orders).toEqual([])
  })

  it('Returns list of orders, single order', async () => {
    const response = {
      orders: {
        order: generateOrderObject('AAPL', 50, 'stock', 'buy', 'open', 228175)
      }
    }
    network.get.mockReturnValue(response)

    const orders = await getOrders()
    expect(orders).toEqual([ response.orders.order ])
  })

  it('Returns list of orders, multiple orders', async () => {
    const response = {
      orders: {
        order: [
          generateOrderObject('AAPL', 50, 'stock', 'buy', 'open', 228175),
          generateOrderObject('SPY', 1, 'stock', 'sell_to_close', 'canceled', 229065),
        ]
      }
    }
    network.get.mockReturnValue(response)

    const orders = await getOrders()
    expect(orders).toEqual(response.orders.order)
  })
})