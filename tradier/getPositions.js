const { isOption, determineOptionTypeFromSymbol } = require('../utils/determineOptionType')
const network = require('../utils/network')


const filterForOptionableStockPositions = positions =>
  positions.filter(pos => !isOption(pos.symbol) && pos.quantity >= 100)

const filterForPutPositions = positions =>
  positions.filter(pos => determineOptionTypeFromSymbol(pos.symbol) === 'put')

const filterForCallPositions = positions =>
  positions.filter(pos => determineOptionTypeFromSymbol(pos.symbol) === 'call')


const getPositions = async () => {
  const url = `accounts/${process.env.ACCOUNTNUM}/positions`
  const response = await network.get(url)
  if (response.positions === 'null') {
    return []
  }
  if (Array.isArray(response.positions.position)) {
    return response.positions.position
  } else {
    return [ response.positions.position ]
  }
}

module.exports = {
  filterForOptionableStockPositions,
  filterForPutPositions,
  filterForCallPositions,
  getPositions
}