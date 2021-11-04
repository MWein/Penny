const network = require('../utils/network')
const settings = require('../utils/settings')
const logUtil = require('../utils/log')
const {
  sellToOpen,
  buyToClose,
} = require('./sendOrders')


describe('sellToOpen', () => {
  beforeEach(() => {
    network.post = jest.fn()
    logUtil.log = jest.fn()
  })

  it('Calls with the correct url and body; skips throttle', async () => {
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
    expect(network.post.mock.calls[0][2]).toEqual(false)
  })

  it('Returns failed status object if network call throws', async () => {
    network.post.mockImplementation(() => {
      throw new Error('Ope')
    })
    const result = await sellToOpen('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'not ok' })
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith({ type: 'error', message: 'Sell-to-open 1 AAAAAPL Failed' })
  })

  it('On success, returns whatever the endpoint returned', async () => {
    network.post.mockReturnValue({ status: 'ok', orderId: 'something' })
    const result = await sellToOpen('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'ok', orderId: 'something' })
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Sell-to-open 1 AAAAAPL')
  })
})


describe('buyToClose', () => {
  beforeEach(() => {
    network.post = jest.fn()
    settings.getSetting = jest.fn().mockReturnValue(1) // buyToCloseAmount
    logUtil.log = jest.fn()
  })

  it('Calls with the correct url and body; skips throttle', async () => {
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
    expect(network.post.mock.calls[0][2]).toEqual(false)
    expect(settings.getSetting).toHaveBeenCalledWith('buyToCloseAmount')
  })

  it('Calls with the correct price based on the setting', async () => {
    settings.getSetting.mockReturnValue(5) // buyToCloseAmount
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
      price: 5,
      duration: 'gtc',
    })
    expect(network.post.mock.calls[0][2]).toEqual(false)
    expect(settings.getSetting).toHaveBeenCalledWith('buyToCloseAmount')
  })

  it('Returns failed status object if network call throws', async () => {
    network.post.mockImplementation(() => {
      throw new Error('Ope')
    })
    const result = await buyToClose('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'not ok' })
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith({ type: 'error', message: 'Buy-to-close 1 AAAAAPL Failed' })
  })

  it('On success, returns whatever the endpoint returned', async () => {
    network.post.mockReturnValue({ status: 'ok', orderId: 'something' })
    const result = await buyToClose('AAPL', 'AAAAAPL', 1)
    expect(result).toEqual({ status: 'ok', orderId: 'something' })
    expect(logUtil.log).toHaveBeenCalledTimes(1)
    expect(logUtil.log).toHaveBeenCalledWith('Buy-to-close 1 AAAAAPL')
  })
})