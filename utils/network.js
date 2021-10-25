const superagent = require('superagent')

// Generate form string from object
// Superagent doesn't handle this without multiple sends
const _createFormString = body => Object.keys(body).map(key => {
  const value = body[key]
  const formattedValue = Array.isArray(value) ? value.join(',') : value
  return `${key}=${formattedValue}`
}).join('&')

const get = async (path) => {
  const url = `${process.env.BASEPATH}${path}`

  const response = await superagent.get(url)
    .set('Authorization', `Bearer ${process.env.APIKEY}`)
    .set('Accept', 'application/json')

  return response.body
}

const post = async (path, body) => {
  const url = `${process.env.BASEPATH}${path}`
  const formString = _createFormString(body)

  const response = await superagent.post(url)
    .set('Authorization', `Bearer ${process.env.APIKEY}`)
    .set('Accept', 'application/json')
    .send(formString)

  return response.body
}

module.exports = {
  _createFormString,
  get,
  post,
}