// These functions generate mock orders and position objects for use in automated tests

// TSLA220114C01290000
// GME210418P00015500
const _generateSymbol = (symbol, type, customExp = null, customStrike = null) => {
  const expText = customExp ? customExp.replace(/-/g, '').slice(2) : '1234'

  let strikeText = '3214'
  if (customStrike) {
    const beforeDecimalDigits = `${customStrike}`.split('.')[0].split('')
    const afterDecimalDigits = `${customStrike}`.split('.')[1]?.split('') || []

    while (beforeDecimalDigits.length !== 5) {
      beforeDecimalDigits.unshift('0')
    }

    while (afterDecimalDigits.length !== 3) {
      afterDecimalDigits.push('0')
    }

    strikeText = beforeDecimalDigits.join('') + afterDecimalDigits.join('')
  }

  switch (type) {
  case 'stock':
    return symbol
  case 'call':
    return `${symbol}${expText}C${strikeText}`
  case 'put':
    return `${symbol}${expText}P${strikeText}`
  }
}


const generateOrderObject = (symbol, quantity=1, type='stock', side='sell_to_open', status='pending', id=123456) => {
  const ordClass = type === 'call' || type === 'put' ? 'option' : 'equity'

  const orderObj = {
    id,
    type: 'market',
    symbol,
    side,
    quantity,
    status,
    duration: 'pre',
    avg_fill_price: 0.00000000,
    exec_quantity: 0.00000000,
    last_fill_price: 0.00000000,
    last_fill_quantity: 0.00000000,
    remaining_quantity: 0.00000000,
    create_date: '2018-06-06T20:16:17.342Z',
    transaction_date: '2018-06-06T20:16:17.357Z',
    class: ordClass,
    //option_symbol: 'AAPL180720C00274000'
  }

  if (ordClass === 'option') {
    return {
      ...orderObj,
      option_symbol: _generateSymbol(symbol, type)
    }
  }

  return orderObj
}


const generatePositionObject = (symbol, quantity=1, type='stock', cost_basis=100, date_acquired='2019-01-31T17:05', id=123456) =>
  ({
    cost_basis,
    date_acquired,
    id,
    quantity,
    symbol: _generateSymbol(symbol, type)
  })

module.exports = {
  _generateSymbol,
  generateOrderObject,
  generatePositionObject,
}