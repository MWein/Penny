// These functions generate mock orders and position objects for use in automated tests


const _generateSymbol = (symbol, type) => {
  switch (type) {
  case 'stock':
    return symbol
  case 'call':
    return `${symbol}1234C3214`
  case 'put':
    return `${symbol}1234P3214`
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