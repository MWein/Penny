const {
  generateOrderObject,
  generatePositionObject,
} = require('./testHelpers')


describe('generateOrderObject', () => {

})


describe('generatePositionObject', () => {
  it('Generates a position object if only given symbol param', () => {
    const position = generatePositionObject('AAPL')
    expect(position).toEqual({
      symbol: 'AAPL',
      id: 123456,
      quantity: 1,
      cost_basis: 100,
      date_acquired: '2019-01-31T17:05'
    })
  })

  it('Generates a position object with correct quantity', () => {
    const position = generatePositionObject('AAPL', 5)
    expect(position).toEqual({
      symbol: 'AAPL',
      id: 123456,
      quantity: 5,
      cost_basis: 100,
      date_acquired: '2019-01-31T17:05'
    })
  })

  it('Generates a position object with correct symbol if call', () => {
    const position = generatePositionObject('TSLA', 4, 'call')
    expect(position).toEqual({
      symbol: 'TSLA1234C3214',
      id: 123456,
      quantity: 4,
      cost_basis: 100,
      date_acquired: '2019-01-31T17:05'
    })
  })

  it('Generates a position object with correct symbol if put', () => {
    const position = generatePositionObject('TSLA', 4, 'put')
    expect(position).toEqual({
      symbol: 'TSLA1234P3214',
      id: 123456,
      quantity: 4,
      cost_basis: 100,
      date_acquired: '2019-01-31T17:05'
    })
  })

  it('Generates a position object with correct symbol if stock', () => {
    const position = generatePositionObject('FB', 7, 'stock')
    expect(position).toEqual({
      symbol: 'FB',
      id: 123456,
      quantity: 7,
      cost_basis: 100,
      date_acquired: '2019-01-31T17:05'
    })
  })

  it('Generates a position object with correct cost_basis', () => {
    const position = generatePositionObject('TSLA', 4, 'stock', 145.12)
    expect(position).toEqual({
      symbol: 'TSLA',
      id: 123456,
      quantity: 4,
      cost_basis: 145.12,
      date_acquired: '2019-01-31T17:05'
    })
  })

  it('Generates a position object with correct date_acquired', () => {
    const position = generatePositionObject('TSLA', 4, 'stock', 125.12, '2021-01-01')
    expect(position).toEqual({
      symbol: 'TSLA',
      id: 123456,
      quantity: 4,
      cost_basis: 125.12,
      date_acquired: '2021-01-01'
    })
  })

  it('Generates a position object with correct id', () => {
    const position = generatePositionObject('TSLA', 4, 'stock', 125.12, '2021-01-01', 654321)
    expect(position).toEqual({
      symbol: 'TSLA',
      id: 654321,
      quantity: 4,
      cost_basis: 125.12,
      date_acquired: '2021-01-01'
    })
  })
})