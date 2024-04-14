import * as cheerio from 'cheerio'
import dayjs from 'dayjs'
import got from 'got'
import write from 'write'

const url = 'https://en.wikipedia.org/wiki/Brussels_Airport'

const data = await got(url)
  .then((response) => response.body)
  .then((body) => cheerio.load(body))
  .then(($) => {
    const $adSection = $('span.mw-headline#Airlines_and_destinations').parent().next()
    const $passengerHeading = $('h3 span.mw-headline#Passenger', $adSection)

    const $passengerTable = $passengerHeading.length > 0
      ? $passengerHeading.parent().nextUntil('h3').filter('table')
      : $('table', $adSection)

    const $rows = $('tbody tr:not(:has(th))', $passengerTable)

    return $rows.map(function () {
      const $cols = $('td', $(this))
      const $airlineCol = $cols.eq(0)
      const $destinationsCol = $cols.eq(1)

      // Get airline data
      const $airlineLink = $('a[title]', $airlineCol)
      const airline = {
        name: $airlineLink.text() || $('span.nowrap', $airlineCol).text(),
        link: $airlineLink.attr('href')?.replace('/wiki/', '') || null
      }

      // Parse destinations
      const $destinationEntries = $destinationsCol.html()
        .split(/,|<br>/)
        .map((html) => {
          return $(`<div>${html.trim()}</div>`)
        })

      const seasonalFrom = $destinationEntries.findIndex(($destinationEntry) => $('b', $destinationEntry).text() === 'Seasonal:')
      const destinations = $destinationEntries
        .map(($destinationEntry, i) => {
          const $destinationLink = $('a[title]', $destinationEntry)

          const destination = {
            name: $destinationLink.length > 0 ? $destinationLink.text() : null, // Return null when the destinations end in a comma and a reference note
            link: $destinationLink.attr('href')?.replace('/wiki/', '') || null,
            isSeasonal: seasonalFrom !== -1 && i >= seasonalFrom
          }

          const extraText = $destinationEntry.contents()
            .filter(function () {
              return this.nodeType === 3
            })
            .map(function () {
              const trimmedText = this.nodeValue.trim()

              return trimmedText !== '' ? trimmedText : null
            })
            .get() // We'll keep this as an array for now, to detect multiple text nodes

          const startDate = extraText.length > 0
            ? (() => {
                const matched = extraText[0].match(/\(begins (.+)\)/)
                return matched ? dayjs(matched[1]).format('YYYY-MM-DD') : null
              })()
            : null

          return {
            airline,
            destination,
            startDate
          }
        })

      return destinations.filter((d) => d.destination.name !== null)
    }).toArray()
  })

const outputPath = new URL('./data/ANR.json', import.meta.url).pathname
await write(outputPath, JSON.stringify(data, null, 2))
