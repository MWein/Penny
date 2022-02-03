const daysSince = date => (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24)

const daysUntil = date => (new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)

const dateDiff = date => Math.abs((new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))

module.exports = {
  daysSince,
  daysUntil,
  dateDiff,
}