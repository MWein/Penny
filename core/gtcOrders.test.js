const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const sendOrders = require('../tradier/sendOrders')
const logUtil = require('../utils/log')

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
      generateOrderObject('AAPL', 1, 'call', 'buy_to_close', 'pending'),
      generateOrderObject('AMZN', 1, 'call', 'sell_to_open', 'pending'),
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
    logUtil.log = jest.fn()
  })

  it('If there are no positions, do nothing', async () => {
    position.getPositions.mockReturnValue([])
    await createGTCOrders()
    expect(logUtil.log).toHaveBeenCalledWith('No Positions to Close')
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