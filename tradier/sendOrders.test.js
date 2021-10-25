const network = require('../utils/network')
const {
  sellToOpen,
  buyToClose,
} = require('./sendOrders')


describe('sellToOpen', () => {
  beforeEach(() => {
    network.post = jest.fn()
  })

  it('Calls with the correct url and body', async () => {
    process.env.ACCOUNTNUM = 'thisisanaccountnumber'
    network.post.mockReturnValue({ status: 'ok' })
    await sellToOpen('AAPL', 'AAAAAAPL', 2)
    expect(network.post.mock.calls[0][0]).toEqual('accounts/thisisanaccountnumber/orders')
    expect(network.post.mock.calls[0][1]).toEqual({
      account_id: 'thisisanaccountnumber',
      class: 'option',
      symbol: 'AAPL',
      option_symbol: 'AAAAAAPL',
      side: 'sell_to_open',
      quantity: 2,
      type: 'market',
      duration: 'day',
    })
  })

  it('Returns failed status object if network call throws', async () => {
    network.post.mockImplementation(() => {
      throw new Error('Ope')
    })
    const result = await sellToOpen('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'not ok' })
  })

  it('On success, returns whatever the endpoint returned', async () => {
    network.post.mockReturnValue({ status: 'ok', orderId: 'something' })
    const result = await sellToOpen('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'ok', orderId: 'something' })
  })
})


describe('buyToClose', () => {
  beforeEach(() => {
    network.post = jest.fn()
  })

  it('Calls with the correct url and body', async () => {
    process.env.ACCOUNTNUM = 'thisisanaccountnumber'
    network.post.mockReturnValue({ status: 'ok' })
    await buyToClose('AAPL', 'AAAAAAPL', 2)
    expect(network.post.mock.calls[0][0]).toEqual('accounts/thisisanaccountnumber/orders')
    expect(network.post.mock.calls[0][1]).toEqual({
      account_id: 'thisisanaccountnumber',
      class: 'option',
      symbol: 'AAPL',
      option_symbol: 'AAAAAAPL',
      side: 'buy_to_close',
      quantity: 2,
      type: 'limit',
      price: 1,
      duration: 'gtc',
    })
  })

  it('Returns failed status object if network call throws', async () => {
    network.post.mockImplementation(() => {
      throw new Error('Ope')
    })
    const result = await buyToClose('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'not ok' })
  })

  it('On success, returns whatever the endpoint returned', async () => {
    network.post.mockReturnValue({ status: 'ok', orderId: 'something' })
    const result = await buyToClose('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'ok', orderId: 'something' })
  })
})