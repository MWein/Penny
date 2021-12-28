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


// describe('_closeExistingBTCOrders', () => {
  
// })


// describe('closeExpiringPuts', () => {
  
// })