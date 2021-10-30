const network = require('../utils/network')
const {
  getGainLoss
} = require('./getGainLoss')


describe('getGainLoss', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })

  it('Creates the URL using the account number env; page number is 1 if not provided', async () => {
    process.env.ACCOUNTNUM = 'somethingsomthing'
    network.get.mockReturnValue({
      gainloss: 'null'
    })
    await getGainLoss()
    expect(network.get).toHaveBeenCalledWith('accounts/somethingsomthing/gainloss?page=1')
  })

  it('Creates the URL using the account number env and page number if provided', async () => {
    process.env.ACCOUNTNUM = 'somethingsomthing'
    network.get.mockReturnValue({
      gainloss: 'null'
    })
    await getGainLoss(3)
    expect(network.get).toHaveBeenCalledWith('accounts/somethingsomthing/gainloss?page=3')
  })

  it('Returns empty array if Tradier returns null', async () => {
    network.get.mockReturnValue({
      gainloss: 'null'
    })
    const gainloss = await getGainLoss()
    expect(gainloss).toEqual([])
  })

  it('Returns list of gainLoss objects, single object', async () => {
    const response = {
      gainloss: {
        closed_position: { hello: 'someposition' }
      }
    }
    network.get.mockReturnValue(response)

    const gainloss = await getGainLoss()
    expect(gainloss).toEqual([ response.gainloss.closed_position ])
  })

  it('Returns list of gainloss objects, multiple objects', async () => {
    const response = {
      gainloss: {
        closed_position: [
          { hello: 'someposition' },
          { hello: 'someotherposition' }
        ]
      }
    }
    network.get.mockReturnValue(response)

    const gainloss = await getGainLoss()
    expect(gainloss).toEqual(response.gainloss.closed_position)
  })
})