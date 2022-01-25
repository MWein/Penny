const cashSecuredPutUtil = require('./cashSecuredPut')
const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const purchaseGoalSchema = require('../db_models/purchaseGoalSchema')
const priceUtil = require('../tradier/getPrices')
const costBasisUtil = require('../utils/determineCostBasis')

const {
  _idealPositions,
  _getBuffer,
  _determinePositionsToBuy,
  allocateUnutilizedCash
} = require('./allocateUnutilizedCash')

const {
  generateSymbol,
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
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = []
    const orders = []
    const optionsToSell = [
      {
        optionSymbol: generateSymbol('MSFT', 'put'),
        positions: 2,
      },
    ]
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 2
      },
    ])
  })

  it('Item in watchlist has multiple optionToSell (impossible edge case but still worth covering) - returns the sum', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = []
    const orders = []
    const optionsToSell = [
      {
        optionSymbol: generateSymbol('MSFT', 'put'),
        positions: 2,
      },
      {
        optionSymbol: generateSymbol('MSFT', 'put'),
        positions: 2,
      },
    ]
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 4
      },
    ])
  })

  it('Item in watchlist has optionToSell greater than maxPositions - returns max positions', () => {
    const watchlist = [ watchlistItem('MSFT', 5, true), ]
    const positions = []
    const orders = []
    const optionsToSell = [
      {
        optionSymbol: generateSymbol('MSFT', 'put'),
        positions: 7,
      },
    ]
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 5
      },
    ])
  })

  it('Item in watchlist has a position, an order, a buy-to-close order, and optionToSell - adds all values together', () => {
    const watchlist = [ watchlistItem('MSFT', 10, true), ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put'), // 1
      generatePositionObject('MSFT', 127, 'stock'), // 1
      generatePositionObject('MSFT', 1, 'put'), // 0 because its a protective put
    ]
    const orders = [
      generateOrderObject('MSFT', -1, 'put'), // 1
      generateOrderObject('MSFT', -1, 'put', 'buy_to_close'), // 0
    ]
    const optionsToSell = [
      {
        optionSymbol: generateSymbol('MSFT', 'put'),
        positions: 2,
      },
    ]
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 5
      },
    ])
  })

  it('Item in watchlist has a position, an order, a buy-to-close order, and optionToSell - sum is greater than max positions - returns max positions', () => {
    const watchlist = [ watchlistItem('MSFT', 4, true), ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put'), // 1
      generatePositionObject('MSFT', 127, 'stock'), // 1
      generatePositionObject('MSFT', 1, 'put'), // 0 because its a protective put
    ]
    const orders = [
      generateOrderObject('MSFT', -1, 'put'), // 1
      generateOrderObject('MSFT', -1, 'put', 'buy_to_close'), // 0
    ]
    const optionsToSell = [
      {
        optionSymbol: generateSymbol('MSFT', 'put'),
        positions: 2,
      },
    ]
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 4
      },
    ])
  })

  it('Multiple watchlist items, random cases', () => {
    const watchlist = [
      watchlistItem('MSFT', 4, true),
      watchlistItem('AAPL', 0, true),
      watchlistItem('TSLA', 5, false),
      watchlistItem('ASAN', 5, true), // Will not be in result because no positions, orders, or opts to sell
      watchlistItem('IBM', 5, true),
      watchlistItem('WMT', 2, true),
    ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put'), // 1
      generatePositionObject('MSFT', 127, 'stock'), // 1
      generatePositionObject('MSFT', 1, 'put'), // 0 because its a protective put
      generatePositionObject('AAPL', -1, 'put'), // 0 because max positions is 0
      generatePositionObject('WMT', -3, 'put'), // 2, because of max positions
    ]
    const orders = [
      generateOrderObject('MSFT', -1, 'put'), // 1
      generateOrderObject('MSFT', -1, 'put', 'buy_to_close'), // 0
      generateOrderObject('TSLA', -1, 'put'), // 0 because puts arent enabled
      generateOrderObject('IBM', -2, 'put'), // 1
      generateOrderObject('WMT', -7, 'put'), // 0 because this might be a manual order, above max
    ]
    const optionsToSell = [
      {
        optionSymbol: generateSymbol('MSFT', 'put'),
        positions: 2,
      },
    ]
    const result = _idealPositions(watchlist, positions, orders, optionsToSell, 0.2)
    expect(result).toEqual([
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 4
      },
      {
        symbol: 'IBM',
        volatility: 0.2,
        positions: 2
      },
      {
        symbol: 'WMT',
        volatility: 0.2,
        positions: 2
      },
    ])
  })

  it('Two items that pass filters to return - One has an assigned volatility, the other does not', () => {
    const watchlist = [
      watchlistItem('MSFT', 5, true),
      watchlistItem('AAPL', 5, true, 0.5),
    ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put'),
      generatePositionObject('AAPL', -1, 'put')
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
      {
        symbol: 'AAPL',
        volatility: 0.5,
        positions: 1
      },
    ])
  })
})



describe('_getBuffer', () => {
  beforeEach(() => {
    priceUtil.getPrices = jest.fn()
    costBasisUtil.determineCostBasisPerShare = jest.fn()
  })

  it('Returns 0 if given empty idealPositions, does not call priceUtil', async () => {
    const result = await _getBuffer([], [], [])
    expect(result).toEqual(0)
    expect(priceUtil.getPrices).not.toHaveBeenCalled()
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })


  // For these tests, when I say "return the strike" I mean "strike * 100 * volatility * numPositions"
  it('Ideal that has no positions or orders, price fails, returns null since everything failed', async () => {
    priceUtil.getPrices.mockReturnValue([])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = []
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(null)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Multiple ideals, but one ideal has no positions or orders, price fails, returns null since everything failed', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 250,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
      {
        symbol: 'AAPL',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', -1, 'put')
    ]
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(null)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT', 'AAPL' ])
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Ideal that has no positions or orders, return the price', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 250,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = []
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(5000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Ideal that has a long position (position has cost basis), return the cost basis', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 200,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', 100, 'stock', 23000)
    ]
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(4600)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Ideal that has a long position (position has cost basis) but price is higher, return the price', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 250,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', 100, 'stock', 23000)
    ]
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(5000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Ideal that has a long position (cost basis = 0), call costBasis function and return the cost basis', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 200,
      }
    ])
    costBasisUtil.determineCostBasisPerShare.mockReturnValue(260)
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', 100, 'stock', 0)
    ]
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(5200)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
    expect(costBasisUtil.determineCostBasisPerShare).toHaveBeenCalledWith('MSFT')
  })
  
  it('Ideal that has 1 put position, return the strike if higher than price', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 250,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 300)
    ]
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(6000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal that has 1 put position, return the price if higher than strike', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 250,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 200)
    ]
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(5000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal that has 2 put positions, return the higher strike', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 100,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 200),
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 300)
    ]
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(6000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal that has 2 put positions but price is higher, return the price', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 320,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 200),
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 300)
    ]
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(6400)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal that has 1 put order, return the strike', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 200,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open', 'pending', 1234, '2021-01-01', 250)
    ]
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(5000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal that has 2 put orders, return the higher strike', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 200,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open', 'pending', 1234, '2021-01-01', 250),
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open', 'pending', 1234, '2021-01-01', 300)
    ]
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(6000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal that has 2 put orders but price is higher, return the price', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 350,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 1
      },
    ]
    const positions = []
    const orders = [
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open', 'pending', 1234, '2021-01-01', 250),
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open', 'pending', 1234, '2021-01-01', 300)
    ]
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(7000)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal has multiple ideal positions, returns price multiplied by number of positions', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 320,
      }
    ])
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 3
      },
    ]
    const positions = []
    const orders = []
    const result = await _getBuffer(idealPositions, positions, orders)
    expect(result).toEqual(19200)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT' ])
  })

  it('Ideal has positions, puts, and orders - return the highest of them all', async () => {
    priceUtil.getPrices.mockReturnValue([
      {
        symbol: 'MSFT',
        price: 150,
      },
      {
        symbol: 'AAPL',
        price: 100,
      },
    ])
    costBasisUtil.determineCostBasisPerShare.mockReturnValue(150)
    const idealPositions = [
      {
        symbol: 'MSFT',
        volatility: 0.2,
        positions: 3
      },
      {
        symbol: 'AAPL',
        volatility: 0.3,
        positions: 1
      },
    ]
    const positions = [
      generatePositionObject('MSFT', 100, 'stock', 0),
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 200),
      generatePositionObject('MSFT', -1, 'put', -230, '2021-12-01', 1234, '2022-01-01', 300)
    ]
    const orders = [
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open', 'pending', 1234, '2021-01-01', 250),
      generateOrderObject('MSFT', -2, 'put', 'sell_to_open', 'pending', 1234, '2021-01-01', 310)
    ]
    const result = await _getBuffer(idealPositions, positions, orders)

    // AAPL should be 3000
    // MSFT should be 18,600
    expect(result).toEqual(21600)
    expect(priceUtil.getPrices).toHaveBeenCalledWith([ 'MSFT', 'AAPL' ])
    expect(costBasisUtil.determineCostBasisPerShare).toHaveBeenCalledWith('MSFT')
  })
})



describe('_determinePositionsToBuy', () => {
  beforeEach(() => {
    logUtil.log = jest.fn()
  })

  it('Logs and returns empty if prices is empty', () => {
    const positionGoals = [
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
    ]
    const prices = []
    const result = _determinePositionsToBuy(4000, positionGoals, prices)
    expect(result).toEqual([])
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Price util failed for _determinePositionsToBuy'
    })
  })

  it('Logs and returns empty if prices failed for the highest priority', () => {
    const positionGoals = [
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 0,
      },
    ]
    const prices = [
      {
        symbol: 'MSFT',
        price: 20,
      }
    ]
    const result = _determinePositionsToBuy(4000, positionGoals, prices)
    expect(result).toEqual([])
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Price util failed for _determinePositionsToBuy'
    })
  })

  it('Logs but returns highest priority if prices failed for the second highest priority, assuming enough cash to close out the first', () => {
    const positionGoals = [
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 0,
      },
    ]
    const prices = [
      {
        symbol: 'AAPL',
        price: 40,
      }
    ]
    const result = _determinePositionsToBuy(4000, positionGoals, prices)
    expect(result).toEqual([
      {
        symbol: 'AAPL',
        quantity: 50,
      }
    ])
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Price util failed for _determinePositionsToBuy'
    })
  })

  it('Returns empty if there isnt enough to buy a single share of the highest priority stock', () => {
    const positionGoals = [
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 0,
      },
    ]
    const prices = [
      {
        symbol: 'AAPL',
        price: 400,
      }
    ]
    const result = _determinePositionsToBuy(50, positionGoals, prices)
    expect(result).toEqual([])
    expect(logUtil.log).not.toHaveBeenCalled()
  })

  it('Returns highest priority stock and number of shares it can afford', () => {
    const positionGoals = [
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 0,
      },
    ]
    const prices = [
      {
        symbol: 'AAPL',
        price: 40,
      }
    ]
    const result = _determinePositionsToBuy(1500, positionGoals, prices)
    expect(result).toEqual([
      {
        symbol: 'AAPL',
        quantity: 37
      }
    ])
    expect(logUtil.log).not.toHaveBeenCalled()
  })

  it('Returns highest priority stock and number of shares it can afford, with some already having been fulfilled', () => {
    const positionGoals = [
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 24,
      },
    ]
    const prices = [
      {
        symbol: 'AAPL',
        price: 40,
      },
      {
        symbol: 'MSFT',
        price: 40,
      }
    ]
    const result = _determinePositionsToBuy(4000, positionGoals, prices)
    expect(result).toEqual([
      {
        symbol: 'AAPL',
        quantity: 26
      },
      {
        symbol: 'MSFT',
        quantity: 50
      },
    ])
    expect(logUtil.log).not.toHaveBeenCalled()
  })

  it('Returns highest and next highest priority if theres enough cash to complete a goal', () => {
    const positionGoals = [
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 0,
      },
    ]
    const prices = [
      {
        symbol: 'AAPL',
        price: 40,
      },
      {
        symbol: 'MSFT',
        price: 50,
      },
    ]
    const result = _determinePositionsToBuy(2500, positionGoals, prices)
    expect(result).toEqual([
      {
        symbol: 'AAPL',
        quantity: 50
      },
      {
        symbol: 'MSFT',
        quantity: 10,
      }
    ])
    expect(logUtil.log).not.toHaveBeenCalled()
  })

  it('Returns all if theres enough cash to fulfill all positions', () => {
    const positionGoals = [
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 20,
        goal: 50,
        fulfilled: 0,
      },
      {
        symbol: 'AAPL',
        enabled: true,
        priority: 60,
        goal: 50,
        fulfilled: 0,
      },
    ]
    const prices = [
      {
        symbol: 'AAPL',
        price: 40,
      },
      {
        symbol: 'MSFT',
        price: 50,
      },
    ]
    const result = _determinePositionsToBuy(10000, positionGoals, prices)
    expect(result).toEqual([
      {
        symbol: 'AAPL',
        quantity: 50
      },
      {
        symbol: 'MSFT',
        quantity: 50,
      }
    ])
    expect(logUtil.log).not.toHaveBeenCalled()
  })
})




describe('allocateUnutilizedCash', () => {
  beforeEach(() => {
    cashSecuredPutUtil.getPositionsToSell = jest.fn()
    settingsUtil.getSettings = jest.fn()
    logUtil.log = jest.fn()
    positionUtil.getPositions = jest.fn()
    orderUtil.getOrders = jest.fn()
    priceUtil.getPrices = jest.fn()
    costBasisUtil.determineCostBasisPerShare = jest.fn()
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

  it('If _getBuffer function returns null, log and exit', async () => {
    purchaseGoalSchema.find.mockReturnValue([
      {
        symbol: 'MSFT',
        enabled: true,
        priority: 0,
        goal: 100,
        fulfilled: 37,
      },
    ])
    settingsUtil.getSettings.mockReturnValue({
      allocateUnutilizedCash: true,
      reserve: 100,
      defaultVolatility: 0.05,
    })
    positionUtil.getPositions.mockReturnValue([])
    orderUtil.getOrders.mockReturnValue([])
    priceUtil.getPrices.mockReturnValue([])
    costBasisUtil.determineCostBasisPerShare.mockReturnValue(0)
    cashSecuredPutUtil.getPositionsToSell.mockReturnValue({
      //balances, // Dont need for this test
      watchlist: [
        {
          symbol: 'MSFT',
          maxPositions: 1,
          put: {
            enabled: true
          }
        }
      ],
      optionsToSell: [
        {
          optionSymbol: generateSymbol('MSFT', 'put'),
          positions: 1
        }
      ],
    })
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'AllocateUnutilized function: Buffer failed for some reason'
    })
  })

})