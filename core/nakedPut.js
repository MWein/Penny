const watchlistUtil = require('../tradier/watchlist')
const nakedPutHelpers = require('./nakedPutCycle')

// Broke into its own file so I can stub the cycle function
const sellNakedPuts = async () => {
  const watchlist = await watchlistUtil.getWatchlistSymbols()

  // Cycle until cycle function returns something other than 'success'
  const _sellNakedPutsHelper = async () => {
    const result = await nakedPutHelpers.sellNakedPutsCycle(watchlist)
    if (result === 'success') {
      await _sellNakedPutsHelper()
    }
  }
  await _sellNakedPutsHelper()
}


module.exports = {
  sellNakedPuts,
}