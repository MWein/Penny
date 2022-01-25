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
  const watchlistItem = (symbol, maxPositions, putEnabled, volatility) => ({
    symbol,
    maxPositions,
    volatility,
    put: {
      enabled: putEnabled
    }
  })

  it('Nothing in watchlist - returns empty', () => {
    const watchlist = []
    const positions = [
      generatePositionObject('UAL', 7, 'stock', 329)
    ]
    const orders = [
      generateOrderObject('AAPL', 1, 'put', 'sell_to_open')
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([])
  })

  it('Watchlist has only non-put-enabled or 0-max-position items - returns empty', () => {
    const watchlist = [
      watchlistItem('AAPL', 0, false),
      watchlistItem('MSFT', 0, true),
      watchlistItem('TSLA', 27, false),
    ]
    const positions = [
      generatePositionObject('UAL', 7, 'stock', 329)
    ]
    const orders = [
      generateOrderObject('AAPL', 1, 'put', 'sell_to_open')
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([])
  })


  it('Item in watchlist has a stock position less than 100 - returns empty', () => {
    const watchlist = [ watchlistItem('MSFT', 10, true), ]
    const positions = [
      generatePositionObject('MSFT', 98, 'stock', 329)
    ]
    const orders = []
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([])
  })

  it('Item in watchlist has a stock position of more than 100, less than 200 - returns as having 1 optionable position', () => {
    const watchlist = [ watchlistItem('MSFT', 10, true), ]
    const positions = [
      generatePositionObject('MSFT', 157, 'stock', 329)
    ]
    const orders = []
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ])
  })

  it('Item in watchlist has stock positions greater than maxPositions - returns maxPositions value', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = [
      generatePositionObject('MSFT', 650, 'stock', 329)
    ]
    const orders = []
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 5
      },
    ])
  })

  it('Item in watchlist has a put position - returns as having 1 optionable', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put')
    ]
    const orders = []
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ])
  })

  it('Item in watchlist has 3 different put positions, 1 of them long (protective put) - returns as having 2 optionable', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put'),
      generatePositionObject('MSFT', -1, 'put'),
      generatePositionObject('MSFT', 3, 'put'),
    ]
    const orders = []
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 2
      },
    ])
  })

  it('item in watchlist has put positions greater than maxPositions - returns maxPositions value', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = [
      generatePositionObject('MSFT', -18, 'put'),
      generatePositionObject('MSFT', -1, 'put'),
      generatePositionObject('MSFT', 3, 'put'),
    ]
    const orders = []
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 5
      },
    ])
  })

  it('Item in watchlist has a put order (sell to open) - returns as having 1 optionable', () => {
    const watchlist = [ watchlistItem('MSFT', 2, true), ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', -1, 'put', 'sell_to_open', 'pending')
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ])
  })

  it('Item in watchlist has multiple put orders (sell to open) - returns sum of quantity', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', -1, 'put'),
      generateOrderObject('MSFT', -2, 'put'),
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 3
      },
    ])
  })

  it('Item in watchlist has a put order (buy to close) - returns as having 0 optionable', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', 2, 'put', 'buy_to_close'),
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([])
  })

  it('Item in watchlist has a put order (sell to open, rejected) - returns as having 0 optionable', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', 2, 'put', 'sell_to_open', 'rejected'),
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([])
  })

  it('Item in watchlist has put orders greater than maxPositions - returns maxPositions value', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', -7, 'put'),
    ]
    const optionsToSell = []
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 5
      },
    ])
  })

  it('Item in watchlist has optionToSell - returns whatever that optionsToSell value is', () => {

  })

  it('Item in watchlist has optionToSell greater than maxPositions - returns max positions', () => {

  })

  it('Item in watchlist has a position, an order, a buy-to-close order, and optionToSell - adds all values together', () => {

  })

  it('Item in watchlist has a position, an order, a buy-to-close order, and optionToSell - sum is greater than max positions - returns max positions', () => {

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