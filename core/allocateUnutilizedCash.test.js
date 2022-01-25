const cashSecuredPutUtil = require('./cashSecuredPut')
const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const purchaseGoalSchema = require('../db_models/purchaseGoalSchema')


const {
  _idealPositions,
  allocateUnutilizedCash
} = require('./allocateUnutilizedCash')

const {
  generateOrderObject,
  generatePositionObject,
} = require('../utils/testHelpers')



describe('_idealPositions', () => {
  it('Nothing in watchlist - returns empty', () => {
    const watchlist = []
    const positions = [
      generatePositionObject('UAL', 7, 'stock', 329)
    ]
    const orders = [
      generateOrderObject('AAPL', 1, 'put', 'sell_to_open')
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell)
    expect(result).toEqual([])
  })

  it('Watchlist has only non-put-enabled or 0-max-position items - returns empty', () => {
    const watchlist = [
      {
        symbol: 'AAPL',
        maxPositions: 0,
        put: {
          enabled: false
        }
      },
      {
        symbol: 'MSFT',
        maxPositions: 0,
        put: {
          enabled: true
        }
      },
    ]
    const positions = [
      generatePositionObject('UAL', 7, 'stock', 329)
    ]
    const orders = [
      generateOrderObject('AAPL', 1, 'put', 'sell_to_open')
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell)
    expect(result).toEqual([])
  })


  const oneItemWatchlist = maxPositions => ([
    {
      symbol: 'MSFT',
      maxPositions,
      put: {
        enabled: true
      }
    },
  ])


  it('One item in watchlist has a stock position less than 100 - returns empty', () => {

  })

  it('One item in watchlist has a stock position of more than 100, less than 200 - returns as having 1 optionable position', () => {
    
  })

  it('One item in watchlist has stock positions greater than maxPositions - returns maxPositions value', () => {

  })

  it('One item in watchlist has a put position - returns as having 1 optionable', () => {

  })

  it('One item in watchlist has put positions greater than maxPositions - returns maxPositions value', () => {

  })

  it('One item in watchlist has a put order (sell to open) - returns as having 1 optionable', () => {
    
  })

  it('One item in watchlist has a put order (buy to close) - returns as having 0 optionable', () => {
    
  })

  it('One item in watchlist has a put order (sell to open, rejected) - returns as having 0 optionable', () => {
    
  })

  it('One item in watchlist has put orders greater than maxPositions - returns maxPositions value', () => {

  })

  it('One item in watchlist has optionToSell - returns whatever that optionsToSell value is', () => {

  })

  it('One item in watchlist has a position, an order, a buy-to-close order, and optionToSell - adds all values together', () => {

  })

})





describe('allocateUnutilizedCash', () => {
  beforeEach(() => {
    cashSecuredPutUtil.getPositionsToSell = jest.fn()
    settingsUtil.getSettings = jest.fn()
    logUtil.log = jest.fn()
    positionUtil.getPositions = jest.fn()
    orderUtil.getOrders = jest.fn()

    purchaseGoalSchema.find = jest.fn()
  })

  it('On exception, logs error', async () => {
    settingsUtil.getSettings.mockImplementation(() => {
      throw new Error('OH NOOOOOO')
    })
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error: OH NOOOOOO',
    })
  })

  it('Does nothing if allocateUnutilizedCash is false', async () => {
    settingsUtil.getSettings.mockReturnValue({
      allocateUnutilizedCash: false,
    })
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith('Allocate Unutilized Funds Disabled')
    expect(positionUtil.getPositions).not.toHaveBeenCalled()
    expect(orderUtil.getOrders).not.toHaveBeenCalled()
  })

  it('Does nothing if position goals is empty', async () => {
    settingsUtil.getSettings.mockReturnValue({
      allocateUnutilizedCash: true,
    })
    purchaseGoalSchema.find.mockReturnValue([])
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith('No position goals to trade on')
    expect(positionUtil.getPositions).not.toHaveBeenCalled()
    expect(orderUtil.getOrders).not.toHaveBeenCalled()
  })

  it('Does nothing if no position goals are enabled', async () => {
    settingsUtil.getSettings.mockReturnValue({
      allocateUnutilizedCash: true,
    })
    purchaseGoalSchema.find.mockReturnValue([
      {
        symbol: 'AAPL',
        enabled: false,
        priority: 0,
        goal: 100,
        fulfilled: 22,
      },
      {
        symbol: 'MSFT',
        enabled: false,
        priority: 0,
        goal: 100,
        fulfilled: 37,
      },
    ])
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith('No position goals to trade on')
    expect(positionUtil.getPositions).not.toHaveBeenCalled()
    expect(orderUtil.getOrders).not.toHaveBeenCalled()
  })

  it('Does nothing if position goals have all been fulfilled', async () => {
    settingsUtil.getSettings.mockReturnValue({
      allocateUnutilizedCash: true,
    })
    purchaseGoalSchema.find.mockReturnValue([
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 0,
        goal: 100,
        fulfilled: 100,
      },
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 0,
        goal: 100,
        fulfilled: 100,
      },
    ])
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith('No position goals to trade on')
    expect(positionUtil.getPositions).not.toHaveBeenCalled()
    expect(orderUtil.getOrders).not.toHaveBeenCalled()
  })


})