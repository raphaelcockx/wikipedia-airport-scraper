import process from './process.js'

import Bottleneck from 'bottleneck'
import got from 'got'
import write from 'write'

// Throttle our calls
const limiter = new Bottleneck({
  minTime: 2000,
  maxConcurrent: 1
})

const letters = String.fromCharCode(...[...Array(26)].map((d, i) => i + 65))
const data = []

for (const letter of letters) {
  console.log('Getting airports for IATA codes starting with', letter)
  const url = 'https://en.m.wikipedia.org/wiki/List_of_airports_by_IATA_airport_code:_' + letter
  const letterData = await limiter.schedule(() => got(url).then((response) => process.listOfAirports(response.body)))

  data.push(...letterData)
}

const outputPath = new URL('./data/airports.json', import.meta.url).pathname
await write(outputPath, JSON.stringify(data, null, 2))
