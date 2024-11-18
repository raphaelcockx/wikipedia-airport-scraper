import scrape from './source/index.js'

import { readFile } from 'node:fs/promises'
import test from 'ava'

test('ANR', async (t) => {
  // Missing link for one of the airlines
  const htmlPath = new URL('./testfiles/ANR.html', import.meta.url).pathname
  const htmlData = await readFile(htmlPath, 'utf-8')

  const jsonPath = new URL('./testfiles/ANR.json', import.meta.url).pathname
  const jsonData = await readFile(jsonPath, 'utf-8').then(JSON.parse)

  t.deepEqual(scrape(htmlData), jsonData)
})

test('MJI', async (t) => {
  // Hajj & Umrah flights
  const htmlPath = new URL('./testfiles/MJI.html', import.meta.url).pathname
  const htmlData = await readFile(htmlPath, 'utf-8')

  const jsonPath = new URL('./testfiles/MJI.json', import.meta.url).pathname
  const jsonData = await readFile(jsonPath, 'utf-8').then(JSON.parse)

  t.deepEqual(scrape(htmlData), jsonData)
})

test('TLV', async (t) => {
  // Many (and complex suspended destinations)
  const htmlPath = new URL('./testfiles/TLV.html', import.meta.url).pathname
  const htmlData = await readFile(htmlPath, 'utf-8')

  const jsonPath = new URL('./testfiles/TLV.json', import.meta.url).pathname
  const jsonData = await readFile(jsonPath, 'utf-8').then(JSON.parse)

  t.deepEqual(scrape(htmlData), jsonData)
})

test('WAW', async (t) => {
  // Complex airport
  const htmlPath = new URL('./testfiles/WAW.html', import.meta.url).pathname
  const htmlData = await readFile(htmlPath, 'utf-8')

  const jsonPath = new URL('./testfiles/WAW.json', import.meta.url).pathname
  const jsonData = await readFile(jsonPath, 'utf-8').then(JSON.parse)

  t.deepEqual(scrape(htmlData), jsonData)
})