const network = require('../utils/network')
const { getOrders } = require('./getOrders')

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
        order: {
          id: 228175,
          type: 'limit',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 50.00000000,
          status: 'open',
          duration: 'pre',
          price: 22.0,
          avg_fill_price: 0.00000000,
          exec_quantity: 0.00000000,
          last_fill_price: 0.00000000,
          last_fill_quantity: 0.00000000,
          remaining_quantity: 0.00000000,
          create_date: '2018-06-01T12:02:29.682Z',
          transaction_date: '2018-06-01T12:30:02.385Z',
          class: 'equity'
        }
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
          {
            id: 228175,
            type: 'limit',
            symbol: 'AAPL',
            side: 'buy',
            quantity: 50.00000000,
            status: 'open',
            duration: 'pre',
            price: 22.0,
            avg_fill_price: 0.00000000,
            exec_quantity: 0.00000000,
            last_fill_price: 0.00000000,
            last_fill_quantity: 0.00000000,
            remaining_quantity: 0.00000000,
            create_date: '2018-06-01T12:02:29.682Z',
            transaction_date: '2018-06-01T12:30:02.385Z',
            class: 'equity'
          },
          {
            id: 229065,
            type: 'debit',
            symbol: 'SPY',
            side: 'sell_to_close',
            quantity: 1.00000000,
            status: 'canceled',
            duration: 'pre',
            price: 42.0,
            avg_fill_price: 0.00000000,
            exec_quantity: 0.00000000,
            last_fill_price: 0.00000000,
            last_fill_quantity: 0.00000000,
            remaining_quantity: 0.00000000,
            create_date: '2018-06-12T21:13:36.076Z',
            transaction_date: '2018-06-12T21:18:41.597Z',
            class: 'option',
            option_symbol: 'SPY180720C00274000'
          }
        ]
      }
    }
    network.get.mockReturnValue(response)

    const orders = await getOrders()
    expect(orders).toEqual(response.orders.order)
  })
})