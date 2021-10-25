const {
  determineOptionTypeFromSymbol,
  isOption,
  getUnderlying,
} = require('./determineOptionType')

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


describe('determineIfOptionFromSymbol', () => {
  it('Properly identifies AAPL', () => {
    expect(isOption('AAPL')).toEqual(false)
  })
  it('Properly identified PINS', () => {
    expect(isOption('PINS')).toEqual(false)
  })
  it('Properly identified TSLA', () => {
    expect(isOption('TSLA')).toEqual(false)
  })
  it('Properly identifies AAPL211029P00146000', () => {
    expect(isOption('AAPL211029P00146000')).toEqual(true)
  })
  it('Properly identifies PINS211029P00055000', () => {
    expect(isOption('PINS211029P00055000')).toEqual(true)
  })
  it('Properly identifies TSLA211029P00885000', () => {
    expect(isOption('TSLA211029P00885000')).toEqual(true)
  })
})


describe('getUnderlying', () => {
  it('Doesnt shit the bed if given a stock symbol', () => {
    expect(getUnderlying('AAPL')).toEqual('AAPL')
  })
  it('Extracts AAPL', () => {
    expect(getUnderlying('AAPL211029P00146000')).toEqual('AAPL')
  })
  it('Extracts PINS', () => {
    expect(getUnderlying('PINS211029P00055000')).toEqual('PINS')
  })
  it('Extracts TSLA', () => {
    expect(getUnderlying('TSLA211029P00885000')).toEqual('TSLA')
  })
})