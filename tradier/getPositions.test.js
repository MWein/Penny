const network = require('../utils/network')
const { getPositions } = require('./getPositions')

describe('getPositions', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })

  it('Creates the URL using the account number env', async () => {
    process.env.ACCOUNTNUM = 'somethingsomthing'
    network.get.mockReturnValue({
      positions: 'null'
    })
    await getPositions()
    expect(network.get).toHaveBeenCalledWith('accounts/somethingsomthing/positions')
  })

  it('Returns empty array if Tradier returns null', async () => {
    network.get.mockReturnValue({
      positions: 'null'
    })
    const positions = await getPositions()
    expect(positions).toEqual([])
  })

  it('Returns list of positions, single position', async () => {
    const response = {
      positions: {
        position: {
          cost_basis: 207.01,
          date_acquired: '2018-08-08T14:41:11.405Z',
          id: 130089,
          quantity: 1.00000000,
          symbol: 'AAPL'
        },
      }
    }
    network.get.mockReturnValue(response)

    const positions = await getPositions()
    expect(positions).toEqual([ response.positions.position ])
  })

  it('Returns list of positions, multiple positions', async () => {
    const response = {
      positions: {
        position: [
          {
            cost_basis: 207.01,
            date_acquired: '2018-08-08T14:41:11.405Z',
            id: 130089,
            quantity: 1.00000000,
            symbol: 'AAPL'
          },
          {
            cost_basis: 173.04,
            date_acquired: '2019-03-11T16:51:51.987Z',
            id: 134134,
            quantity: 1.00000000,
            symbol: 'FB'
          },
        ]
      }
    }
    network.get.mockReturnValue(response)

    const positions = await getPositions()
    expect(positions).toEqual(response.positions.position)
  })
})