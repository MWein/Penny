const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const market = require('../tradier/market')
const watchlistUtil = require('../utils/watchlist')
const priceUtil = require('../tradier/getPrices')
const balanceUtil = require('../tradier/getBalances')
const bestOptionUtil = require('../tradier/selectBestOption')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const {
  isOption,
  getUnderlying,
  getStrike,
} = require('../utils/determineOptionType')


const _getWatchlistPriorityUnion = (priorityList, watchlist) =>
  priorityList.map(symbol => {
    const watchlistItem = watchlist.find(x => x.symbol === symbol)
    return !watchlistItem ?
      null : // Mark null if not found or the rules don't allow such things
      watchlistItem
  }).filter(x => x) // Filter out the nulls



const _preStartFilterWatchlistItems = async (watchlistItems, buyingPower) => {
  const firstPass = watchlistItems.filter(x => x.put.enabled && x.maxPositions > 0)
  if (firstPass.length === 0) {
    return []
  }

  const [
    prices,
    positions,
    orders,
  ] = await Promise.all([
    priceUtil.getPrices(firstPass.map(x => x.symbol)),
    positionUtil.getPositions(),
    orderUtil.getOrders(),
  ])

  const stockPositions = positionUtil.filterForOptionableStockPositions(positions)
  const putPositions = positionUtil.filterForPutPositions(positions)
  const relevantPositions = [ ...stockPositions, ...putPositions ]
  const putOptionOrders = orderUtil.filterForCashSecuredPutOrders(orders)

  const watchlistItemsWithUpdatedPositions = firstPass.map(watchlistItem => {
    const numPositions = relevantPositions.filter(pos => getUnderlying(pos.symbol) === getUnderlying(watchlistItem.symbol))
      .reduce((acc, x) => acc + (isOption(x.symbol) ? Math.abs(x.quantity) : Math.floor(x.quantity / 100)), 0)

    const numOrders = putOptionOrders.filter(ord => ord.symbol === getUnderlying(watchlistItem.symbol))
      .reduce((acc, x) => acc + Math.abs(x.quantity), 0)

    const existing = numPositions + numOrders

    return {
      ...watchlistItem,
      maxPositions: watchlistItem.maxPositions - existing
    }
  }).filter(x => x.maxPositions > 0)

  return watchlistItemsWithUpdatedPositions.filter(watchlistItem => {
    const price = prices.find(x => x.symbol === watchlistItem.symbol)?.price
    return price ? buyingPower > price * 100 : true // If price is not returned, just pass the filter anyway
  })
}


const _selectBestOptionsFromWatchlist = async watchlist => {
  const optionsToConsider = []
  for (let x = 0; x < watchlist.length; x++) {
    const currentItem = watchlist[x]
    const targetDelta = currentItem.put.targetDelta
    const bestOption = await bestOptionUtil.selectBestOption(currentItem.symbol, 'put', null, targetDelta)
    if (bestOption) {
      optionsToConsider.push({
        optionSymbol: bestOption.symbol,
        maxPositions: currentItem.maxPositions,
      })
    }
  }
  return optionsToConsider
}



const _selectOptionsToSell = (buyingPower, optionsToConsider) => {
  const { maxPositionsMap, symbols, symbolsToSellMap } = optionsToConsider.reduce((acc, opt) => ({
    maxPositionsMap: {
      ...acc.maxPositionsMap,
      [opt.optionSymbol]: opt.maxPositions
    },
    symbolsToSellMap: {
      ...acc.symbolsToSellMap,
      [opt.optionSymbol]: 0
    },
    symbols: [ ...acc.symbols, opt.optionSymbol ]
  }), {
    maxPositionsMap: {},
    symbolsToSellMap: {},
    symbols: [],
  })


  const _helper = (maxPositionsMap, symbols, index, skipCount, buyingPower, symbolsToSellMap) => {
    const symbol = symbols[index]
    const positionsAvailable = maxPositionsMap[symbol]

    if (positionsAvailable === 0) {
      // Check if the skip counter is greater than the number of unique symbols
      if (skipCount >= symbols.length) {
        return symbolsToSellMap
      }
      const newIndex = index === symbols.length - 1 ? 0 : index + 1
      return _helper(maxPositionsMap, symbols, newIndex, skipCount + 1, buyingPower, symbolsToSellMap)
    }

    const collateral = getStrike(symbol) * 100
    if (buyingPower < collateral) {
      // Check if the skip counter is greater than the number of unique symbols
      if (skipCount >= symbols.length) {
        return symbolsToSellMap
      }
      const newIndex = index === symbols.length - 1 ? 0 : index + 1
      return _helper(maxPositionsMap, symbols, newIndex, skipCount + 1, buyingPower, symbolsToSellMap)
    }

    // Add option to buy list!
    const newMaxPositionsMap = {
      ...maxPositionsMap,
      [symbol]: maxPositionsMap[symbol] - 1
    }
    const newSymbolsToSellMap = {
      ...symbolsToSellMap,
      [symbol]: symbolsToSellMap[symbol] + 1
    }
    return _helper(newMaxPositionsMap, symbols, index + 1, 0, buyingPower - collateral, newSymbolsToSellMap)
  }

  const mapResult = _helper(maxPositionsMap, symbols, 0, 0, buyingPower, symbolsToSellMap)
  return Object.keys(mapResult).reduce((acc, key) => {
    return mapResult[key] === 0 ? acc : [
      ...acc,
      {
        optionSymbol: key,
        positions: mapResult[key]
      }
    ]
  }, [])
}



const sellCashSecuredPuts = async () => {
  const settings = await settingsUtil.getSettings()

  const putsEnabled = settings.putsEnabled
  if (!putsEnabled) {
    logUtil.log('Puts Disabled')
    return
  }

  const open = await market.isMarketOpen()
  if (!open) {
    logUtil.log('Market Closed')
    return
  }


  const watchlist = await watchlistUtil.getWatchlist()
  const watchlistPriorityUnion = await _getWatchlistPriorityUnion(settings.priorityList, watchlist)

  if (!watchlistPriorityUnion.length) {
    logUtil.log('Priority List or Watchlist is Empty')
    return
  }

  // Get balance. Calc balance - reserve
  const balances = await balanceUtil.getBalances()
  const optionBuyingPower = balances.optionBuyingPower - settings.reserve

  // Get current positions and orders


  // Pre filter
  // TODO Also filter based on pre-existing positions
  const preFilteredWatchlistItems = await _preStartFilterWatchlistItems(watchlistPriorityUnion, optionBuyingPower)
  if (!preFilteredWatchlistItems.length) {
    logUtil.log('No stocks passed the pre-filter')
    return
  }


  const optionsToConsider = await _selectBestOptionsFromWatchlist(preFilteredWatchlistItems)

  console.log(optionsToConsider)

  // const optionsToSell = _selectOptionsToSell(optionBuyingPower, optionsToConsider)


  // console.log(optionsToSell)


  // Make the orders

}


module.exports = {
  _getWatchlistPriorityUnion,
  _preStartFilterWatchlistItems,
  _selectBestOptionsFromWatchlist,
  _selectOptionsToSell,
  sellCashSecuredPuts,
}