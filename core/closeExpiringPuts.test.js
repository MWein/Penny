const positionsUtil = require('../tradier/getPositions')
const pricesUtil = require('../tradier/getPrices')
const quotesUtil = require('../tradier/getQuotes')
const ordersUtil = require('../tradier/getOrders')
const sendOrdersUtil = require('../tradier/sendOrders')
const { getUnderlying } = require('../utils/determineOptionType')

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


// describe('_getPutsExpiringToday', () => {

// })


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


// describe('closeExpiringPuts', () => {
  
// })