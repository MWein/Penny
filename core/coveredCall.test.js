const positions = require('../tradier/getPositions')
const orders = require('../tradier/getOrders')

const {
  _generatePermittedPositionsMap,
  sellCoveredCalls,
} = require('./coveredCall')



describe.only('_generatePermittedPositionsMap', () => {
  it('Returns empty object if there are no optionable stocks', () => {
    const optionableStocks = []
    const currentOptions = []
    const pendingOptions = []
    const map = _generatePermittedPositionsMap(optionableStocks, currentOptions, pendingOptions)
    expect(map).toEqual({})
  })

  it('Returns map of stocks with their permitted call number; no current or pending options', () => {
    const optionableStocks = [
      {
        cost_basis: 207.01,
        date_acquired: '2018-08-08T14:41:11.405Z',
        id: 130089,
        quantity: 100.00000000,
        symbol: 'AAPL'
      },
      {
        cost_basis: 1870.70,
        date_acquired: '2018-08-08T14:42:00.774Z',
        id: 130090,
        quantity: 120.00000000,
        symbol: 'AMZN'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 203.00000000,
        symbol: 'CAH'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 20.00000000,
        symbol: 'FB'
      },
    ]
    const currentOptions = []
    const pendingOptions = []
    const map = _generatePermittedPositionsMap(optionableStocks, currentOptions, pendingOptions)
    expect(map).toEqual({
      AAPL: 1,
      AMZN: 1,
      CAH: 2,
      FB: 0
    })
  })

  it('Returns map of stocks with their permitted call number; no pending options', () => {
    const optionableStocks = [
      {
        cost_basis: 207.01,
        date_acquired: '2018-08-08T14:41:11.405Z',
        id: 130089,
        quantity: 100.00000000,
        symbol: 'AAPL'
      },
      {
        cost_basis: 1870.70,
        date_acquired: '2018-08-08T14:42:00.774Z',
        id: 130090,
        quantity: 120.00000000,
        symbol: 'AMZN'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 203.00000000,
        symbol: 'CAH'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 20.00000000,
        symbol: 'FB'
      },
    ]
    const currentOptions = [
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: -1.00000000,
        symbol: 'CAH1234C3214'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: -1.00000000,
        symbol: 'AAPL1234C3214'
      }
    ]
    const pendingOptions = []
    const map = _generatePermittedPositionsMap(optionableStocks, currentOptions, pendingOptions)
    expect(map).toEqual({
      AAPL: 0,
      AMZN: 1,
      CAH: 1,
      FB: 0
    })
  })

  it('Returns map of stocks with permitted call number; no current options', () => {
    const optionableStocks = [
      {
        cost_basis: 207.01,
        date_acquired: '2018-08-08T14:41:11.405Z',
        id: 130089,
        quantity: 100.00000000,
        symbol: 'AAPL'
      },
      {
        cost_basis: 1870.70,
        date_acquired: '2018-08-08T14:42:00.774Z',
        id: 130090,
        quantity: 120.00000000,
        symbol: 'AMZN'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 203.00000000,
        symbol: 'CAH'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 20.00000000,
        symbol: 'FB'
      },
    ]
    const currentOptions = []
    const pendingOptions = [
      {
        id: 228749,
        type: 'market',
        symbol: 'AAPL',
        side: 'sell_to_open',
        quantity: 1.00000000,
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
        option_symbol: 'AAPL180720C00274000'
      },
      {
        id: 228749,
        type: 'market',
        symbol: 'CAH',
        side: 'sell_to_open',
        quantity: 2.00000000,
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
        option_symbol: 'CAH180720C00274000'
      },
    ]
    const map = _generatePermittedPositionsMap(optionableStocks, currentOptions, pendingOptions)
    expect(map).toEqual({
      AAPL: 0,
      AMZN: 1,
      CAH: 0,
      FB: 0
    })
  })

  it('Returns map of stocks with permitted call number', () => {
    const optionableStocks = [
      {
        cost_basis: 207.01,
        date_acquired: '2018-08-08T14:41:11.405Z',
        id: 130089,
        quantity: 100.00000000,
        symbol: 'AAPL'
      },
      {
        cost_basis: 1870.70,
        date_acquired: '2018-08-08T14:42:00.774Z',
        id: 130090,
        quantity: 120.00000000,
        symbol: 'AMZN'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 203.00000000,
        symbol: 'CAH'
      },
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: 20.00000000,
        symbol: 'FB'
      },
    ]
    const currentOptions = [
      {
        cost_basis: 50.41,
        date_acquired: '2019-01-31T17:05:44.674Z',
        id: 133590,
        quantity: -1.00000000,
        symbol: 'AMZN1234C3214'
      },
    ]
    const pendingOptions = [
      {
        id: 228749,
        type: 'market',
        symbol: 'AAPL',
        side: 'sell_to_open',
        quantity: 1.00000000,
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
        option_symbol: 'AAPL180720C00274000'
      },
      {
        id: 228749,
        type: 'market',
        symbol: 'CAH',
        side: 'sell_to_open',
        quantity: 2.00000000,
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
        option_symbol: 'CAH180720C00274000'
      },
    ]
    const map = _generatePermittedPositionsMap(optionableStocks, currentOptions, pendingOptions)
    expect(map).toEqual({
      AAPL: 0,
      AMZN: 0,
      CAH: 0,
      FB: 0
    })
  })
})



describe('sellCoveredCalls', () => {
  beforeEach(() => {
    positions.getPositions = jest.fn()
    orders.getOrders = jest.fn()
  })

  it('Returns \'no available positions\' if there are no optionable positions', async () => {
    positions.getPositions.mockReturnValue([
      {
        cost_basis: 207.01,
        date_acquired: '2018-08-08T14:41:11.405Z',
        id: 130089,
        quantity: 99.00000000,
        symbol: 'AAPL'
      },
      {
        cost_basis: 1870.70,
        date_acquired: '2018-08-08T14:42:00.774Z',
        id: 130090,
        quantity: 5.00000000,
        symbol: 'TSLA',
      }
    ])
    const status = await sellCoveredCalls()
    expect(status).toEqual('no available positions')
  })


})