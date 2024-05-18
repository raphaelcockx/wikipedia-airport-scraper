import process from './process.js'

import Bottleneck from 'bottleneck'
import chalk from 'chalk'
import got from 'got'
import logUpdate from 'log-update'
import write from 'write'

// Throttle our calls
const limiter = new Bottleneck({
  minTime: 2000,
  maxConcurrent: 1
})

const letters = String.fromCharCode(...[...Array(26)].map((d, i) => i + 65))
const data = []

for (const letter of letters) {
  logUpdate(`● Getting airports for IATA codes starting with ${chalk.white.bold(letter)}`)

  const url = 'https://en.m.wikipedia.org/wiki/List_of_airports_by_IATA_airport_code:_' + letter
  const letterData = await limiter.schedule(() => got(url).then((response) => process.listOfAirports(response.body)))

  logUpdate(`● Getting airports for IATA codes starting with ${chalk.white.bold(letter)} (${chalk.yellow.bold(letterData.length + ' entries found')})`)

  data.push(...letterData)
  logUpdate.done()
}

const outputPath = new URL('./data/airports.json', import.meta.url).pathname
await write(outputPath, JSON.stringify(data, null, 2))
