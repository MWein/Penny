// TODO Fix later
/* eslint-disable indent */

const cashSecuredPutUtil = require('./cashSecuredPut')
const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const purchaseGoalSchema = require('../db_models/purchaseGoalSchema')
const priceUtil = require('../tradier/getPrices')

const {
    getUnderlying
} = require('../utils/determineOptionType')

// TODO REQUIREMENT
// Need a function that can specifically return the amount available for purchasing
// That way Penny-Data could use it when this becomes a mono-repo


const _idealPositions = (watchlist, positions, orders, optionsToSell, defaultVolatility) => {
    const optionablePositions = positionUtil.filterForOptionableStockPositions(positions)
    const putPositions = positionUtil.filterForPutPositions(positions)
    const putOrders = orderUtil.filterForCashSecuredPutOrders(orders)

    return watchlist
      .filter(item => item.put.enabled && item.maxPositions > 0)
      .map(item => {
        const symbol = item.symbol
        const maxPositions = item.maxPositions
        const volatility = item.volatility || defaultVolatility

        const numStockOptUnits = Math.floor(optionablePositions.find(x => x.symbol === symbol)?.quantity / 100) || 0
        const numPutPositions = putPositions
            .filter(x => getUnderlying(x.symbol) === symbol && x.quantity < 0)
            .reduce((acc, x) => acc + Math.abs(x.quantity), 0)
        const numPutOrders = putOrders
            .filter(x => getUnderlying(x.symbol) === symbol && x.quantity < 0)
            .reduce((acc, x) => acc + Math.abs(x.quantity), 0)
        const numOptsToSell = optionsToSell
            .filter(x => getUnderlying(x.optionSymbol) === symbol)
            .reduce((acc, x) => acc + x.positions, 0)

        return {
            symbol,
            volatility,
            positions: Math.min(maxPositions, numStockOptUnits + numPutPositions + numPutOrders + numOptsToSell)
        }
    }).filter(x => x.positions > 0)
}


const _getBuffer = async idealPositions => {
    if (!idealPositions.length) {
        return 0
    }

    const symbols = idealPositions.map(x => x.symbol)
    const prices = await priceUtil.getPrices(symbols)

    return Number(idealPositions.reduce((acc, pos) => {
        const price = prices.find(x => x.symbol === pos.symbol)?.price
        const bufferForSymbol = price * pos.positions * 100 * pos.volatility
        return acc + bufferForSymbol
    }, 0).toFixed(2)) || null
}


const allocateUnutilizedCash = async () => {
    try {
        const settings = await settingsUtil.getSettings()
        if (!settings.allocateUnutilizedCash) {
            logUtil.log('Allocate Unutilized Funds Disabled')
            return
        }

        const allPositionGoals = await purchaseGoalSchema.find()
        const positionGoals = allPositionGoals.filter(goal => goal.enabled && goal.fulfilled < goal.goal)
        if (!positionGoals.length) {
            logUtil.log('No position goals to trade on')
            return
        }

        // TODO Check if anything is in the watchlist

        // const positions = await positionUtil.getPositions()
        // const orders = await orderUtil.getOrders()

        // const {
        //     balances,
        //     watchlist,
        //     optionsToSell
        // } = await cashSecuredPutUtil.getPositionsToSell(settings)


        // TODO Build current ideal positions object
        // _idealPositions

        // TODO Get current prices for each position + 10%
        /*
        Get prices for each position right now, add 10-15% (should be a setting).
        Buffer override of some kind should be added to the watchlist schema,
        so a particular symbol with high volatility can be accounted for
        without applying the same standard to less volatile stonks.

        This is to prevent a situation where a symbol increases in value,
        but still allow Penny to have enough free money to continue trading it.
        
        ALSO ALSO add the cost of buying buy_to_close orders for each put currently uncovered by one
        */


        // TODO Calc unutilized cash
        // Current buying power - reserve - buffer - wouldBePurchaseValue

        // TODO Figure out which stocks to load up on
        // Filter out anything thats fulfilled or unaffordable (based on current prices, obviously)
        // Sort by priority first, then percent complete, then lowest share price

        // TODO Determine how many of each can be purchased
        // Stock prices should have a 5% buffer so orders don't get rejected for lack of funds or something

        // Send purchase orders

    } catch (e) {
        logUtil.log({
            type: 'error',
            message: e.toString()
          })
    }
}

module.exports = {
  _idealPositions,
  _getBuffer,
  allocateUnutilizedCash,
}