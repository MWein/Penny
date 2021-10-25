const network = require('../utils/network')

const getBalances = async () => {
  const url = `accounts/${process.env.ACCOUNTNUM}/balances`
  const response = await network.get(url)
  const balancesObj = response.balances

  return {
    equity: balancesObj.total_equity,
    totalCash: balancesObj.total_cash,
    optionBuyingPower: balancesObj.margin.option_buying_power,
  }
}

module.exports = {
  getBalances
}