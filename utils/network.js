const superagent = require('superagent')
const sleepUtil = require('./sleep')


// Throttle
const _throttle = async throttle => {
  if (throttle) {
    const throttleTime = process.env.BASEPATH.includes('sandbox') ? 1.2 : 0.7
    await sleepUtil.sleep(throttleTime)
  }
}


// Generate form string from object
// Superagent doesn't handle this without multiple sends
const _createFormString = body => Object.keys(body).map(key => {
  const value = body[key]
  const formattedValue = Array.isArray(value) ? value.join(',') : value
  return `${key}=${formattedValue}`
}).join('&')


const get = async (path, throttle=true) => {
  await _throttle(throttle)

  const url = `${process.env.BASEPATH}${path}`

  const response = await superagent.get(url)
    .set('Authorization', `Bearer ${process.env.APIKEY}`)
    .set('Accept', 'application/json')
    .timeout({
      response: 5000
    })
    .retry(5)

  return response.body
}


const post = async (path, body, throttle=true) => {
  await _throttle(throttle)

  const url = `${process.env.BASEPATH}${path}`
  const formString = _createFormString(body)

  const response = await superagent.post(url)
    .set('Authorization', `Bearer ${process.env.APIKEY}`)
    .set('Accept', 'application/json')
    .send(formString)
    .timeout({
      response: 10000
    })
    .retry(5)

  return response.body
}


const put = async (path, body, throttle=true) => {
  await _throttle(throttle)

  const url = `${process.env.BASEPATH}${path}`
  const formString = _createFormString(body)

  const response = await superagent.put(url)
    .set('Authorization', `Bearer ${process.env.APIKEY}`)
    .set('Accept', 'application/json')
    .send(formString)
    .timeout({
      response: 10000
    })
    .retry(5)

  return response.body
}

module.exports = {
  _throttle,
  _createFormString,
  get,
  post,
  put,
}