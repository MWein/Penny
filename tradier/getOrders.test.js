const network = require('../utils/network')
const { getOrders } = require('./getOrders')
const { generateOrderObject } = require('../utils/testHelpers')


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

  generateOrderObject('AAPL', 50, 'stock', 'buy', 'open', 228175)

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