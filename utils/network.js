const superagent = require('superagent')

const get = async (path) => {
  const url = `${process.env.BASEPATH}${path}`

  const response = await superagent.get(url)
    .set('Authorization', `Bearer ${process.env.APIKEY}`)
    .set('Accept', 'application/json')

  return response.body
}

const post = async (path, body) => {
  const url = `${process.env.BASEPATH}${path}`

  // Generate form string from object
  // Superagent doesn't handle this without multiple sends
  const formString = Object.keys(body).map(key => {
    const value = body[key]
    const formattedValue = typeof value !== String ? value : value.join(',')
    return `${key}=${formattedValue}`
  }).join('&')

  const response = await superagent.post(url)
    .set('Authorization', `Bearer ${process.env.APIKEY}`)
    .set('Accept', 'application/json')
    .send(formString)
    //.type('application/x-www-form-urlencoded')

  return response.body
}

module.exports = {
  get,
  post,
}