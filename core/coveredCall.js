const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const bestOption = require('../tradier/selectBestOption')
const sendOrders = require('../tradier/sendOrders')
const settings = require('../utils/settings')
const market = require('../tradier/market')
const { getUnderlying } = require('../utils/determineOptionType')
const logUtil = require('../utils/log')
const costBasisUtil = require('../utils/determineCostBasis')
const watchlistUtil = require('../utils/watchlist')


// Note: This function assumes that positions were split between stocks and options properly
//       and that put options were filtered out
const _generatePermittedPositionsArray = (optionableStocks, currentOptions, pendingOptions) =>
  optionableStocks.reduce((acc, stock) => {
    const totalPossible = Math.floor(stock.quantity / 100)

    const options = currentOptions.filter(opt => getUnderlying(opt.symbol) === stock.symbol)
    const optionQuantity = options.reduce((acc, opt) => acc + Math.abs(opt.quantity), 0)

    const optionOrders = pendingOptions.filter(opt => opt.symbol === stock.symbol)
    const optionOrderQuantity = optionOrders.reduce((acc, ord) => acc + Math.abs(ord.quantity), 0)

    const quantity = totalPossible - optionQuantity - optionOrderQuantity

    return quantity > 0 ? [
      ...acc,
      {
        symbol: stock.symbol,
        quantity,
        costPerShare: Number((stock.cost_basis / stock.quantity).toFixed(2)),
      }
    ] : acc
  }, [])


const _determineCoverableTickers = async () => {
  const positions = await position.getPositions()
  const optionableStocks = position.filterForOptionableStockPositions(positions)
  if (optionableStocks.length === 0) {
    return []
  }
  const currentOptions = position.filterForCallPositions(positions)

  const orders = await order.getOrders()
  const callOrders = order.filterForCoveredCallOrders(orders)

  return _generatePermittedPositionsArray(optionableStocks, currentOptions, callOrders)
}


const _getMinimumStrike = async (position, stockSettings) => {
  if (stockSettings.call.minStrikeMode === 'auto') {
    if (position.costPerShare === 0) {
      const costPerShare = await costBasisUtil.determineCostBasisPerShare(stockSettings.symbol)
      return costPerShare
    }
    return position.costPerShare
  } else if (stockSettings.call.minStrikeMode === 'custom') {
    return stockSettings.call.minStrike
  }
  return null
}



const sellCoveredCalls = async () => {
  try {
    const callsEnabled = await settings.getSetting('callsEnabled')
    if (!callsEnabled) {
      logUtil.log('Calls Disabled')
      return
    }

    const open = await market.isMarketOpen()
    if (!open) {
      logUtil.log('Market Closed')
      return
    }

    const coverableTickers = await _determineCoverableTickers()
    if (coverableTickers.length === 0) {
      logUtil.log('No Covered Call Opportunities')
      return
    }

    const watchlist = await watchlistUtil.getWatchlist()

    // In a for-loop so each request isn't sent up all at once
    for (let x = 0; x < coverableTickers.length; x++) {
      const currentPosition = coverableTickers[x]

      // Skip if not in watchlist
      const stockSettings = watchlist.find(x => x.symbol === currentPosition.symbol)
      if (!stockSettings) {
        continue
      }

      // Skip if calls disabled
      if (!stockSettings.call.enabled) {
        continue
      }

      const minimumStrike = await _getMinimumStrike(currentPosition, stockSettings)

      const best = await bestOption.selectBestOption(currentPosition.symbol, 'call', minimumStrike, stockSettings.call.targetDelta)
      if (best) {
        await sendOrders.sellToOpen(currentPosition.symbol, best.symbol, currentPosition.quantity)
      }
    }

    logUtil.log('Done')
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: e.toString()
    })
  }
}

module.exports = {
  _generatePermittedPositionsArray,
  _determineCoverableTickers,
  _getMinimumStrike,
  sellCoveredCalls,
}