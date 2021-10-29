const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const bestOption = require('../tradier/selectBestOption')
const sendOrders = require('../tradier/sendOrders')
const settings = require('../utils/settings')
const market = require('../tradier/market')
const { getUnderlying } = require('../utils/determineOptionType')
const logUtil = require('../utils/log')


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


const sellCoveredCalls = async () => {
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
  }

  // In a for-loop so each request isn't sent up all at once
  for (let x = 0; x < coverableTickers.length; x++) {
    const currentTicker = coverableTickers[x]
    const best = await bestOption.selectBestOption(currentTicker.symbol, 'call', currentTicker.costPerShare)
    if (best) {
      await sendOrders.sellToOpen(currentTicker.symbol, best.symbol, currentTicker.quantity)
    }
  }

  logUtil.log('Done')
}

module.exports = {
  _generatePermittedPositionsArray,
  _determineCoverableTickers,
  sellCoveredCalls,
}