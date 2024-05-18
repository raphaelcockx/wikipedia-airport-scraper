import { process } from './index.js'

import got from 'got'
import write from 'write'

const url = 'https://en.m.wikipedia.org/wiki/Warsaw_Chopin_Airport'

const data = await got(url).then((response) => process.airportPage(response.body))

const outputPath = new URL('./data/output.json', import.meta.url).pathname
await write(outputPath, JSON.stringify(data, null, 2))
