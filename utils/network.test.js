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