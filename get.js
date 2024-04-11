import * as cheerio from 'cheerio'
import got from 'got'

const url = 'https://en.m.wikipedia.org/wiki/Antwerp_International_Airport'

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

      // First column
      const $airlineLink = $('a[title]', $airlineCol)

      const airline = {
        name: $airlineLink.text() || $('span.nowrap', $airlineCol).text(),
        link: $airlineLink.attr('href')?.replace('/wiki/', '') || null
      }

      // Second column
      const destinations = $destinationsCol.html()
        .split(/,|<br>/)
        .map((html) => {
          console.log(`${html.trim()}\n`)
          return $(`<div>${html.trim()}</div>`)
        })
        .map(($destinationEntry) => {
          const $destinationLink = $('a[title]', $destinationEntry)

          const destination = {
            name: $destinationLink.text(),
            link: $destinationLink.attr('href')?.replace('/wiki/', '') || null
          }

          return {
            airline,
            destination
          }
        })

      return destinations
    }).toArray()
  })

console.log(data)
