const superagent = require('superagent')
const {
  _throttle,
  _createFormString,
  get,
  post,
} = require('./network')
const sleepUtil = require('./sleep')


describe('_throttle tests', () => {
  beforeEach(() => sleepUtil.sleep = jest.fn())

  it('Does nothing throttle is false', async () => {
    await _throttle(false)
    expect(sleepUtil.sleep).not.toHaveBeenCalled()
  })

  it('Sleeps for 1.2 seconds if in paper trading environment', async () => {
    process.env.BASEPATH = 'https://sandbox.example.com'
    await _throttle(true)
    expect(sleepUtil.sleep).toHaveBeenCalledWith(1.2)
  })

  it('Sleeps for 0.7 seconds if in production environment', async () => {
    process.env.BASEPATH = 'https://api.example.com'
    await _throttle(true)
    expect(sleepUtil.sleep).toHaveBeenCalledWith(0.7)
  })
})


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
  let timeout
  let retry

  beforeEach(() => {
    sleepUtil.sleep = jest.fn()

    process.env.BASEPATH = 'https://sandbox.example.com/'
    process.env.APIKEY = 'somekey'

    // Retry
    retry = jest.fn().mockReturnValue({
      body: 'someresponse'
    })

    // Timeout
    timeout = jest.fn().mockReturnValue({
      retry,
    })

    // Last set thats called
    set2 = jest.fn().mockReturnValue({
      timeout,
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

  it('By default, throttles', async () => {
    await get('somepath')
    expect(sleepUtil.sleep).toHaveBeenCalled()
  })

  it('Skips throttle if throttle param is false', async () => {
    await get('somepath', false)
    expect(sleepUtil.sleep).not.toHaveBeenCalled()
  })

  it('Creates url out of BASEPATH and path', async () => {
    await get('somepath')
    expect(superagent.get).toHaveBeenCalledWith('https://sandbox.example.com/somepath')
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
  let retry
  let timeout

  beforeEach(() => {
    sleepUtil.sleep = jest.fn()

    process.env.BASEPATH = 'https://sandbox.example.com/'
    process.env.APIKEY = 'somekey'

    // Retry
    retry = jest.fn().mockReturnValue({
      body: 'someresponse'
    })

    // Timeout
    timeout = jest.fn().mockReturnValue({
      retry,
    })

    // Send
    send1 = jest.fn().mockReturnValue({
      timeout,
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

  it('By default, throttles', async () => {
    await post('somepath', { some: 'body' })
    expect(sleepUtil.sleep).toHaveBeenCalled()
  })

  it('Skips throttle if throttle param is false', async () => {
    await post('somepath', { some: 'body' }, false)
    expect(sleepUtil.sleep).not.toHaveBeenCalled()
  })

  it('Creates url out of BASEPATH and path', async () => {
    await post('somepath', { some: 'body' })
    expect(superagent.post).toHaveBeenCalledWith('https://sandbox.example.com/somepath')
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