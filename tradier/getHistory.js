const networkUtil = require('../utils/network')


const getTradeHistoryForSymbol = async symbol => {
  const url = `accounts/${process.env.ACCOUNTNUM}/history?limit=100000&type=trade&symbol=${symbol}`
  const response = await networkUtil.get(url)
  const historyObj = response?.history?.event

  return historyObj
}

module.exports = {
  getTradeHistoryForSymbol
}