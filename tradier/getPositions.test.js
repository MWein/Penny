const network = require('../utils/network')
const { getPositions } = require('./getPositions')
const { generatePositionObject } = require('../utils/testHelpers')


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
        position: generatePositionObject('AAPL', 1, 'stock', 207.01)
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
          generatePositionObject('AAPL', 1, 'stock', 207.01),
          generatePositionObject('FB', 1, 'stock', 173.04),
        ]
      }
    }
    network.get.mockReturnValue(response)

    const positions = await getPositions()
    expect(positions).toEqual(response.positions.position)
  })
})