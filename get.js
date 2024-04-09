import * as cheerio from 'cheerio'
import got from 'got'

// const url = 'https://en.m.wikipedia.org/wiki/Amsterdam_Schiphol_Airport'
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

      const $airline = $cols.eq(0)
      const $destinations = $cols.eq(1)

      const airlineName = $('span, a', $airline).text()
      const airlineLink = $('a', $airline).attr('href') || null

      return {
        airline: {
          name: airlineName,
          link: airlineLink ? airlineLink.split('/')[2] : null
        },
        destinations: $destinations.text()
      }
    }).toArray()
  })

console.log(data)
