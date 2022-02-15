const sendOrderUtil = require('../tradier/sendOrders')
const nextExpUtil = require('../tradier/nextStrikeExpirations')
const selectBest = require('../tradier/selectBestOptionForDay')
const logUtil = require('../utils/log')

// Check if SPY bull put exists or not
// Sell if not

const sellBullPutSpreadDemo = async () => {
  try {
    // If market is closed, exit

    const exps = await nextExpUtil.nextStrikeExpirations('SPY')
    const expiration = exps[0]

    console.log('Expiration', expiration)

    const shortPut = await selectBest.selectBestStrikeForDay('SPY', 'put', expiration, null, 0.2)
    const longPut = await selectBest.selectBestStrikeForDay('SPY', 'put', expiration, null, 0.15)

    const legs = [
      {
        symbol: shortPut.symbol,
        side: 'sell_to_open',
        quantity: 1,
      },
      {
        symbol: longPut.symbol,
        side: 'buy_to_open',
        quantity: 1,
      },
    ]


    console.log(legs)

    return
    const order = await sendOrderUtil.multilegOptionOrder('SPY', 'credit', legs)
    console.log(order)
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: e.toString()
    })
  }
}

module.exports = {
  sellBullPutSpreadDemo
}