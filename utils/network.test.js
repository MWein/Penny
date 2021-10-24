const superagent = require('superagent')
const { _createFormString, get, post } = require('./network')

describe('_createFormString', () => {
  it('Creates form string with a single value', () => {
    const body = {
      hello: 'goodbye'
    }
    const formString = _createFormString(body)
    expect(formString).toEqual('hello=goodbye')
  })

  it('Creates form string with multiple values', () => {
    const body = {
      hello: 'goodbye',
      what: 'who?'
    }
    const formString = _createFormString(body)
    expect(formString).toEqual('hello=goodbye&what=who?')
  })

  it('Creates form string, array to comma delineated', () => {
    const body = {
      hello: 'goodbye',
      what: [ 'something', 'somethingelse' ]
    }
    const formString = _createFormString(body)
    expect(formString).toEqual('hello=goodbye&what=something,somethingelse')
  })
})


describe('get', () => {
  let set1
  let set2

  beforeEach(() => {
    process.env.BASEPATH = 'hello/'
    process.env.APIKEY = 'somekey'

    // Last set thats called
    set2 = jest.fn().mockReturnValue({
      body: 'someresponse'
    })

    // First set thats called. Authorization
    set1 = jest.fn().mockReturnValue({
      set: set2
    })

    superagent.get = jest.fn().mockReturnValue({
      set: set1
    })
  })

  it('Returns the response body', async () => {
    const response = await get('somepath')
    expect(response).toEqual('someresponse')
  })

  it('Creates url out of BASEPATH and path', async () => {
    await get('somepath')
    expect(superagent.get).toHaveBeenCalledWith('hello/somepath')
  })

  it('Sets authorization header using APIKEY in the proper format', async () => {
    await get('somepath')
    expect(set1).toHaveBeenCalledWith('Authorization', 'Bearer somekey')
  })

  it('Sets accept header', async () => {
    await get('somepath')
    expect(set2).toHaveBeenCalledWith('Accept', 'application/json')
  })

  it('On failure, throws', async () => {
    superagent.get.mockImplementation(() => {
      throw new Error('Ope')
    })

    try {
      await get('somepath')
      expect(1).toEqual(2) // Force failure if nothing is thrown
    } catch (e) {
      expect(e).toEqual(new Error('Ope'))
    }
  })
})


describe('post', () => {
  let set1
  let set2
  let send1

  beforeEach(() => {
    process.env.BASEPATH = 'hello/'
    process.env.APIKEY = 'somekey'

    // Send
    send1 = jest.fn().mockReturnValue({
      body: 'someresponse'
    })

    // Last set thats called
    set2 = jest.fn().mockReturnValue({
      send: send1
    })

    // First set thats called. Authorization
    set1 = jest.fn().mockReturnValue({
      set: set2
    })

    superagent.post = jest.fn().mockReturnValue({
      set: set1
    })
  })

  it('Returns the response body', async () => {
    const response = await post('somepath', { some: 'body' })
    expect(response).toEqual('someresponse')
  })

  it('Creates url out of BASEPATH and path', async () => {
    await post('somepath', { some: 'body' })
    expect(superagent.post).toHaveBeenCalledWith('hello/somepath')
  })

  it('Sets authorization header using APIKEY in the proper format', async () => {
    await post('somepath', { some: 'body' })
    expect(set1).toHaveBeenCalledWith('Authorization', 'Bearer somekey')
  })

  it('Sets accept header', async () => {
    await post('somepath', { some: 'body' })
    expect(set2).toHaveBeenCalledWith('Accept', 'application/json')
  })

  it('Sends formstring', async () => {
    await post('somepath', { some: 'body' })
    expect(send1).toHaveBeenCalledWith('some=body')
  })

  it('On failure, throws', async () => {
    superagent.post.mockImplementation(() => {
      throw new Error('Ope')
    })

    try {
      await post('somepath', { some: 'body' })
      expect(1).toEqual(2) // Force failure if nothing is thrown
    } catch (e) {
      expect(e).toEqual(new Error('Ope'))
    }
  })
})