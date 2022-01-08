const {
  determineOptionTypeFromSymbol,
  isOption,
  getUnderlying,
  getExpiration,
  getStrike,
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

  it('Returns neither if not an option', () => {
    expect(determineOptionTypeFromSymbol('TSLAC')).toEqual('neither')
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


describe('getExpiration', () => {
  it('Returns null if given non-option symbol', () => {
    expect(getExpiration('AAPL')).toEqual(null)
  })
  it('NVTA211217P00015000', () => {
    expect(getExpiration('NVTA211217P00015000')).toEqual('2021-12-17')
  })
  it('BB211203C00010500', () => {
    expect(getExpiration('BB211203C00010500')).toEqual('2021-12-03')
  })
  it('SFIX220107C00019000', () => {
    expect(getExpiration('SFIX220107C00019000')).toEqual('2022-01-07')
  })
  it('SOFI220107P00015500', () => {
    expect(getExpiration('SOFI220107P00015500')).toEqual('2022-01-07')
  })
  it('TSLA220114C01260000', () => {
    expect(getExpiration('TSLA220114C01260000')).toEqual('2022-01-14')
  })
})


describe('getStrike', () => {
  it('Returns null if given non-option symbol', () => {
    expect(getStrike('AAPL')).toEqual(null)
  })
  it('NVTA211217P00015000', () => {
    expect(getStrike('NVTA211217P00015000')).toEqual(15)
  })
  it('BB211203C00010500', () => {
    expect(getStrike('BB211203C00010500')).toEqual(10.5)
  })
  it('SFIX220107C00019000', () => {
    expect(getStrike('SFIX220107C00019000')).toEqual(19)
  })
  it('SOFI220107P00015500', () => {
    expect(getStrike('SOFI220107P00015500')).toEqual(15.5)
  })
  it('TSLA220114C00550000', () => {
    expect(getStrike('TSLA220114C01260000')).toEqual(1260)
  })
})