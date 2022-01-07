const historyUtil = require('../tradier/getHistory')


const determineCostBasisPerShare = async symbol => {
  const equityHistory = await historyUtil.getTradeHistoryForSymbol(symbol)

  const lastEquityTrade = equityHistory.find(trade => trade.trade.trade_type === 'equity')
  if (!lastEquityTrade) {
    return 0
  }

  return lastEquityTrade.trade.price
}


module.exports = {
  determineCostBasisPerShare
}