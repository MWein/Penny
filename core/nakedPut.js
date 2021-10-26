const bestOption = require('../tradier/selectBestOption')
const watchlistUtil = require('../tradier/watchlist')
const nakedPutHelpers = require('./nakedPutCycle')


// Broke into its own file so I can stub the cycle function
const sellNakedPuts = async () => {
  const watchlist = await watchlistUtil.getWatchlistSymbols()
  if (watchlist.length === 0) {
    return
  }

  // for-loop so it doesn't call all at once
  const bestOptions = []
  for (let x = 0; x < watchlist.length; x++) {
    const symbol = watchlist[x]
    const best = await bestOption.selectBestOption(symbol, 'put')
    if (best && best.strike * 100 < process.env.MAXALLOCATION) {
      bestOptions.push(best)
    }
  }
  if (bestOptions.length === 0) {
    return
  }

  // Cycle until cycle function returns something other than 'success'
  const _sellNakedPutsHelper = async () => {
    console.log('Selling Puts')
    const result = await nakedPutHelpers.sellNakedPutsCycle(watchlist, bestOptions)
    console.log(result)
    if (result === 'success') {
      await _sellNakedPutsHelper()
    }
  }
  await _sellNakedPutsHelper()
}


module.exports = {
  sellNakedPuts,
}