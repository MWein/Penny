const network = require('../utils/network')
const {
  getQuotes,
} = require('./getQuotes')


describe('getQuotes', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })

  it('Returns empty array if given empty array', async () => {
    const result = await getQuotes([])
    expect(result).toEqual([])
    expect(network.get).not.toHaveBeenCalled()
  })

  it('Creates the URL using the account number env', async () => {
    process.env.ACCOUNTNUM = 'somethingsomthing'
    network.get.mockReturnValue({
      quotes: 'null'
    })
    await getQuotes([ 'AAPL', 'TSLA' ])
    expect(network.get).toHaveBeenCalledWith('markets/quotes?symbols=AAPL,TSLA')
  })

  it('Returns empty array if Tradier returns null', async () => {
    network.get.mockReturnValue({
      quotes: 'null'
    })
    const quotes = await getQuotes([ 'AAPL' ])
    expect(quotes).toEqual([])
  })

  it('Returns list of quotes, single quote', async () => {
    const response = {
      quotes: {
        quote: { some: 'quote' }
      }
    }
    network.get.mockReturnValue(response)

    const positions = await getQuotes([ 'AAPL' ])
    expect(positions).toEqual([ response.quotes.quote ])
  })

  it('Returns list of quotes, multiple quotes', async () => {
    const response = {
      quotes: {
        quote: [
          'somequote',
          'someotherquote'
        ]
      }
    }
    network.get.mockReturnValue(response)

    const positions = await getQuotes([ 'AAPL' ])
    expect(positions).toEqual(response.quotes.quote)
  })
})