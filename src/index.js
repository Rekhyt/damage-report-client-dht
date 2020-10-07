#!/usr/bin/env node

const bunyan = require('bunyan')
const request = require('request-promise-native')
const sensor = require('node-dht-sensor').promises
const { CronJob } = require('cron')
const { Gpio } = require('onoff')

const logger = bunyan.createLogger({
  name: 'damage-report-client-dht',
  streams: [{ stream: process.stdout }],
  dhtType: process.env.TYPE || null,
  apiUrl: process.env.API_URL || null,
  locationId: process.env.LOCATION_ID || null,
  locationName: process.env.LOCATION_NAME || null
})

const dotenvResult = require('dotenv').config({ path: process.env.CONFIG_PATH })
if (dotenvResult.error) {
  switch (dotenvResult.error.code) {
    case 'ENOENT':
      logger.info(`.env file not found at ${dotenvResult.error.path}`)
      break
    default:
      logger.error(dotenvResult.error)
      process.exit(1)
  }
}

if (!process.env.TYPE || !process.env.PIN || !process.env.API_URL || !process.env.LOCATION_ID) {
  console.error('Environment variables TYPE, PIN, LOCATION_ID and API_URL must be set.\n')
  console.log('Available environment variables:')
  console.log('TYPE             - required - One of 11 or 22 for the DHT11 or DHT22/AM2302 respectively.')
  console.log('PIN              - required - The GPIO pin that the sensor is connected to.')
  console.log('API_URL          - required - The URL to the damage-report API.')
  console.log('LOCATION_ID      - required - ID of the location of the sensor.')
  console.log('RELAY_PIN        - optional - The GPIO pin of a relay used to shortly turn of the sensors when reading fails. Defaults to null.')
  console.log('RELAY_TIME       - optional - The time (ms) that the sensor should be turned off when reading fails. Defaults to 2500.')
  console.log('LOCATION_NAME    - optional - Name of the location of the sensor. Defaults to the location ID.')
  console.log('TIMEOUT          - optional - The time (ms) to wait for a signal until starting a new try. Defaults to 5000.')
  console.log('CRON_PATTERN     - optional - A cron pattern (1) describing when to update. Defaults to "* * * * *" (every minute).')
  console.log('SIMULATE         - optional - Set to "true" to skip reading sensors and send random data instead. Defaults to false.')
  console.log('LOGGLY_SUBDOMAIN - optional - The loggly.com sub domain to log to. If falsy logs go to stdout only.')
  console.log('LOGGLY_TOKEN     - optional - A loggly.com access token. If falsy logs go to stdout only.')
  console.log('CONFIG_PATH      - optional - Path to a .env-style file to load environment variables from. Defaults to ".env".')
  console.log()
  console.log('(1) Prepend a column for seconds granularity, e.g. every 13th second: "13 * * * * *')
  process.exit(1)
}

if (process.env.LOGGLY_SUBDOMAIN && process.env.LOGGLY_TOKEN) {
  logger.addStream({
    type: 'raw',
    stream: new (require('bunyan-loggly'))({
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      token: process.env.LOGGLY_TOKEN
    })
  })
}

let simulationInterval
if (process.env.SIMULATE) {
  updateSimulation()
  simulationInterval = setInterval(updateSimulation, 5000)
}

let job
let relay
function setUp () {
  job = new CronJob(process.env.CRON_PATTERN || '* * * * *', processor)

  const relayPin = parseInt(process.env.RELAY_PIN)
  if (relayPin && !relayPin.isNaN) relay = new Gpio(relayPin, 'out')

  process.on('SIGINT', () => {
    job.stop()
    clearInterval(simulationInterval)
    cleanUp()
    logger.info('Got SIGINT, terminating . . .')
    process.exit(0)
  })

  process.on('unhandledRejection', (reason, promise) => {
    cleanUp()
    logger.error({ reason, promise }, 'Unhandled promise rejection.')
    process.exit(1)
  })

  process.on('uncaughtException', error => {
    cleanUp()
    logger.error(error, 'Unhandled exception.')
    process.exit(1)
  })
}

function cleanUp () {
  if (job) job.stop()
  clearInterval(simulationInterval)
  if (relay) relay.unexport()
}

let errorCounter = 0
async function exec () {
  setUp()
  job.start()
}

exec().catch(err => {
  logger.error(err)
  process.exit(1)
})

async function processor () {
  try {
    logger.info('Fetching . . .')
    const data = await read(process.env.TYPE, process.env.PIN, process.env.TIMEOUT || 5000)
    logger.info('Got data', data)
    errorCounter = 0

    const command = {
      name: 'ClimateData.updateData',
      payload: {
        locationId: process.env.LOCATION_ID,
        locationName: process.env.LOCATION_NAME || process.env.LOCATION_ID,
        temperature: data.temperature.toFixed(1),
        humidity: data.humidity.toFixed(1)
      }
    }

    logger.info('Sending command to ' + process.env.API_URL + '/command', JSON.stringify(command, null, 2))
    await request({
      url: `${process.env.API_URL}/command`,
      method: 'post',
      json: true,
      body: command
    })
  } catch (err) {
    errorCounter++
    logger.error(err, { errorCounter })
    if (relay && errorCounter > 2) await resetSensor(relay, process.env.RELAY_TIME || 2500)
  }
}

async function read (type, pin, timeout) {
  return new Promise(async (resolve, reject) => {
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      reject('Error reading sensors.')
    }, timeout)

    try {
      const data = await sensor.read(type, pin)
      clearTimeout(timer)
      resolve(data)
    } catch (err) {
      clearTimeout(timer)
      return reject(err)
    }
  })
}

async function resetSensor (relay, time) {
  return new Promise(resolve => {
    logger.info(`Switching off sensor for ${time} ms . . .`)
    relay.writeSync(1)
    setTimeout(() => {
      logger.info('Switching on sensor . . .')
      relay.writeSync(0)
      errorCounter = 0
      resolve()
    }, time)
  })
}

function updateSimulation () {
  sensor.initialize({
    test: {
      fake: {
        temperature: Math.random() * 10,
        humidity: Math.random() * 10
      }
    }
  })
}
