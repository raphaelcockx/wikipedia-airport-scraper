import { readFile } from 'node:fs/promises'
import scrape from './index.js'

import chalk from 'chalk'
import got from 'got'
import write from 'write'

// Read list of airports
const airportsPath = new URL('./data/airports.json', import.meta.url).pathname
const airports = await readFile(airportsPath, 'utf-8').then(JSON.parse)

// Get code from command line
const code = process.argv[2]

// Get the right airport
const airport = airports.find((airport) => airport.code === code)
const { name, link } = airport

const url = `https://en.m.wikipedia.org/wiki/${link}`
console.log(`Checking ${chalk.bold.white(name)} (${code}) at ${chalk.blue(url)}`)

const data = await got(url).then((response) => scrape(response.body))
const outputPath = new URL(`./data/${code}.json`, import.meta.url).pathname
await write(outputPath, JSON.stringify(data, null, 2))
