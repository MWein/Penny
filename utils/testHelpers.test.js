const {
  _generateSymbol,
  generateOrderObject,
  generatePositionObject,
} = require('./testHelpers')

const {
  getExpiration,
  getStrike,
} = require('./determineOptionType')


describe('_generateSymbol', () => {
  it('Returns the symbol if type is stock', () => {
    expect(_generateSymbol('AAPL', 'stock')).toEqual('AAPL')
  })

  it('Returns call symbol', () => {
    expect(_generateSymbol('TSLA', 'call')).toEqual('TSLA1234C3214')
  })

  it('Returns put symbol', () => {
    expect(_generateSymbol('FB', 'put')).toEqual('FB1234P3214')
  })

  it('Returns call symbol with custom strike and expiration', () => {
    const symbol = _generateSymbol('AAPL', 'call', '2022-01-07', 1290)
    expect(symbol).toEqual('AAPL220107C01290000')
    // Make sure it works the other way around too
    expect(getExpiration(symbol)).toEqual('2022-01-07')
    expect(getStrike(symbol)).toEqual(1290)
  })

  it('Returns put symbol with custom strike and expiration, ', () => {
    const symbol = _generateSymbol('GME', 'put', '2021-04-18', 15.5)
    expect(symbol).toEqual('GME210418P00015500')
    // Make sure it works the other way around too
    expect(getExpiration(symbol)).toEqual('2021-04-18')
    expect(getStrike(symbol)).toEqual(15.5)
  })
})


describe('generateOrderObject', () => {
  it('Generates a order object if only given symbol param', () => {
    const order = generateOrderObject('AAPL')
    expect(order).toEqual({
      id: 123456,
      type: 'market',
      symbol: 'AAPL',
      side: 'sell_to_open',
      quantity: 1,
      status: 'pending',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'equity',
    })
  })

  it('Generates a order object with correct quantity', () => {
    const order = generateOrderObject('AAPL', 4)
    expect(order).toEqual({
      id: 123456,
      type: 'market',
      symbol: 'AAPL',
      side: 'sell_to_open',
      quantity: 4,
      status: 'pending',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'equity',
    })
  })

  it('Generates a order object with type stock', () => {
    const order = generateOrderObject('TSLA', 7, 'stock')
    expect(order).toEqual({
      id: 123456,
      type: 'market',
      symbol: 'TSLA',
      side: 'sell_to_open',
      quantity: 7,
      status: 'pending',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'equity',
    })
  })

  it('Generates a order object with type call', () => {
    const order = generateOrderObject('TSLA', 7, 'call')
    expect(order).toEqual({
      id: 123456,
      type: 'market',
      symbol: 'TSLA',
      side: 'sell_to_open',
      quantity: 7,
      status: 'pending',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'option',
      option_symbol: 'TSLA1234C3214'
    })
  })

  it('Generates a order object with type put', () => {
    const order = generateOrderObject('FB', -2, 'put')
    expect(order).toEqual({
      id: 123456,
      type: 'market',
      symbol: 'FB',
      side: 'sell_to_open',
      quantity: -2,
      status: 'pending',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'option',
      option_symbol: 'FB1234P3214'
    })
  })

  it('Generates a order object with correct side', () => {
    const order = generateOrderObject('FB', 2, 'stock', 'buy_to_close')
    expect(order).toEqual({
      id: 123456,
      type: 'market',
      symbol: 'FB',
      side: 'buy_to_close',
      quantity: 2,
      status: 'pending',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'equity',
    })
  })

  it('Generates a order object with correct status', () => {
    const order = generateOrderObject('FB', 2, 'stock', 'buy_to_close', 'open')
    expect(order).toEqual({
      id: 123456,
      type: 'market',
      symbol: 'FB',
      side: 'buy_to_close',
      quantity: 2,
      status: 'open',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'equity',
    })
  })

  it('Generates a order object with correct id', () => {
    const order = generateOrderObject('FB', 2, 'stock', 'buy_to_close', 'open', 654321)
    expect(order).toEqual({
      id: 654321,
      type: 'market',
      symbol: 'FB',
      side: 'buy_to_close',
      quantity: 2,
      status: 'open',
      duration: 'pre',
      avg_fill_price: 0.00000000,
      exec_quantity: 0.00000000,
      last_fill_price: 0.00000000,
      last_fill_quantity: 0.00000000,
      remaining_quantity: 0.00000000,
      create_date: '2018-06-06T20:16:17.342Z',
      transaction_date: '2018-06-06T20:16:17.357Z',
      class: 'equity',
    })
  })
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