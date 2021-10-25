const { determineOptionTypeFromSymbol } = require('./determineOptionType')

describe('determineOptionTypeFromSymbol', () => {
  it('Properly identifies AAPL211029C00146000 as call', () => {
    expect(determineOptionTypeFromSymbol('AAPL211029C00146000')).toEqual('call')
  })
  it('Properly identified PINS211029C00062000 as call', () => {
    expect(determineOptionTypeFromSymbol('PINS211029C00062000')).toEqual('call')
  })
  it('Properly identified TSLA211029C00935000 as call', () => {
    expect(determineOptionTypeFromSymbol('TSLA211029C00935000')).toEqual('call')
  })

  it('Properly identifies AAPL211029P00146000 as put', () => {
    expect(determineOptionTypeFromSymbol('AAPL211029P00146000')).toEqual('put')
  })
  it('Properly identifies PINS211029P00055000 as put', () => {
    expect(determineOptionTypeFromSymbol('PINS211029P00055000')).toEqual('put')
  })
  it('Properly identifies TSLA211029P00885000 as put', () => {
    expect(determineOptionTypeFromSymbol('TSLA211029P00885000')).toEqual('put')
  })
})