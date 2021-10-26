const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const sendOrders = require('../tradier/sendOrders')

const {
  _getOldOptionsPositions,
  createGTCOrders,
} = require('./gtcOrders')


const {
  generateOrderObject,
  generatePositionObject,
} = require('../utils/testHelpers')


describe('_getOldOptionsPositions', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('Filters out stonks', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    const positions = [
      generatePositionObject('AAPL', -1, 'call', 207.01),
      generatePositionObject('AMZN', 2, 'put', 1870.70),
      generatePositionObject('CAH', 203, 'stock', 50.41),
    ]
    const orders = []
    const results = _getOldOptionsPositions(positions, orders)
    expect(results).toEqual([
      {
        symbol: 'AAPL1234C3214',
        quantity: 1
      },
      {
        symbol: 'AMZN1234P3214',
        quantity: 2
      },
    ])
  })

  it('Filters out ones that were made in the same day', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    const positions = [
      generatePositionObject('AAPL', 1, 'call', 207.01, '2021-10-12T14:41:11.405Z'),
      generatePositionObject('AMZN', 2, 'call', 1870.70, '2018-08-08T14:42:00.774Z'),
      generatePositionObject('CAH', 3, 'call', 50.41, '2021-10-12T17:05:44.674Z'),
    ]
    const orders = []
    const results = _getOldOptionsPositions(positions, orders)
    expect(results).toEqual([
      {
        symbol: 'AMZN1234C3214',
        quantity: 2
      }
    ])
  })

  it('Filters out any that already have orders to close; ignores sell_to_open orders', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    const positions = [
      generatePositionObject('AAPL', 1, 'call', 207.01, '2021-10-11T14:41:11.405Z'),
      generatePositionObject('AMZN', 2, 'call', 1870.70, '2018-08-08T14:42:00.774Z'),
      generatePositionObject('CAH', 3, 'call', 50.41, '2021-10-09T17:05:44.674Z'),
    ]
    const orders = [
      {
        id: 228749,
        type: 'market',
        symbol: 'AAPL',
        side: 'buy_to_close',
        quantity: 1.00000000,
        status: 'pending',
        duration: 'pre',
        avg_fill_price: 0.00000000,
        exec_quantity: 0.00000000,
        last_fill_price: 0.00000000,
        last_fill_quantity: 0.00000000,
        remaining_quantity: 0.00000000,
        create_date: '2018-06-06T20:16:17.342Z',
        transaction_date: '2018-06-06T20:16:17.357Z',
        class: 'option',
        option_symbol: 'AAPL1234C3214'
      },
      {
        id: 228749,
        type: 'market',
        symbol: 'AAPL',
        side: 'sell_to_open',
        quantity: 1.00000000,
        status: 'pending',
        duration: 'pre',
        avg_fill_price: 0.00000000,
        exec_quantity: 0.00000000,
        last_fill_price: 0.00000000,
        last_fill_quantity: 0.00000000,
        remaining_quantity: 0.00000000,
        create_date: '2018-06-06T20:16:17.342Z',
        transaction_date: '2018-06-06T20:16:17.357Z',
        class: 'option',
        option_symbol: 'AMZN123C321'
      },
    ]
    const results = _getOldOptionsPositions(positions, orders)
    expect(results).toEqual([
      {
        symbol: 'AMZN1234C3214',
        quantity: 2
      },
      {
        symbol: 'CAH1234C3214',
        quantity: 3
      },
    ])
  })
})


describe('gtcOrders', () => {
  beforeEach(() => {
    position.getPositions = jest.fn()
    order.getOrders = jest.fn()
    sendOrders.buyToClose = jest.fn()
  })

  it('If there are no positions, do nothing', async () => {
    position.getPositions.mockReturnValue([])
    await createGTCOrders()
    expect(position.getPositions).toHaveBeenCalled()
    expect(order.getOrders).not.toHaveBeenCalled()
  })

  it('If there are positions and none have GTCs, send em all', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    position.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 1, 'call', 207.01, '2021-10-12T14:41:11.405Z'),
      generatePositionObject('AMZN', -2, 'call', 1870.70, '2018-08-08T14:42:00.774Z'),
      generatePositionObject('CAH', 3, 'call', 50.41, '2021-10-09T17:05:44.674Z'),
    ])
    order.getOrders.mockReturnValue([])
    await createGTCOrders()
    expect(position.getPositions).toHaveBeenCalled()
    expect(order.getOrders).toHaveBeenCalled()
    expect(sendOrders.buyToClose).toHaveBeenCalledTimes(2)
    expect(sendOrders.buyToClose).toHaveBeenCalledWith('AMZN', 'AMZN1234C3214', 2)
    expect(sendOrders.buyToClose).toHaveBeenCalledWith('CAH', 'CAH1234C3214', 3)
  })
})