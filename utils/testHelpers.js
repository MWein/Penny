// These functions generate mock orders and position objects for use in automated tests

const generateOrderObject = () => {

}

const generatePositionObject = (symbol, quantity=1, type='stock', cost_basis=100, date_acquired='2019-01-31T17:05', id=123456) => {
  const generateSymbol = (symbol, type) => {
    switch (type) {
    case 'stock':
      return symbol
    case 'call':
      return `${symbol}1234C3214`
    case 'put':
      return `${symbol}1234P3214`
    }
  }

  return {
    cost_basis,
    date_acquired,
    id,
    quantity,
    symbol: generateSymbol(symbol, type)
  }
}

module.exports = {
  generateOrderObject,
  generatePositionObject,
}