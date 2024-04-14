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

      const destinationsNodes = $destinationsCol.contents()
        .map(function () {
          const tagName = $(this).prop('tagName') || null
          const link = $(this).attr('href')?.replace('/wiki/', '') || null
          const value = this.nodeValue ? this.nodeValue.trim() : $(this).text()

          return {
            tagName,
            link,
            value
          }
        })
        .get()
        .filter((d) => !['BR', 'SUP'].includes(d.tagName))
        .filter(({ tagName, value }) => !(tagName === null && ['', ','].includes(value)))
        .map((d, index) => ({ index, ...d }))

      const markers = destinationsNodes.filter((node) => node.tagName === 'B')
      const airportEntries = destinationsNodes.filter((node) => node.tagName === 'A')

      const destinations = airportEntries.map((airport, i) => {
        const { index, value: name, link } = airport

        const seasonalFrom = markers.find((marker) => marker.value === 'Seasonal:')?.index || null
        const seasonalCharterFrom = markers.find((marker) => marker.value === 'Seasonal charter:')?.index || null

        const isSeasonal = seasonalFrom ? index > seasonalFrom : false
        const isCharter = seasonalCharterFrom ? index > seasonalCharterFrom : false

        const extraTextEntry = destinationsNodes.slice(index + 1, airportEntries[i + 1]?.index).filter((node) => node.tagName !== 'B')[0] || null
        const startDateMatch = extraTextEntry?.value.match(/\((begins|resumes) (.+)\)/) || null
        const startDate = startDateMatch ? dayjs(startDateMatch[2]).format('YYYY-MM-DD') : null

        const destination = {
          name,
          link,
          isCharter,
          isSeasonal,
          startDate
        }

        return {
          airline,
          destination
        }
      })

      return destinations
    }).toArray()
  })

const outputPath = new URL('./data/ANR.json', import.meta.url).pathname
await write(outputPath, JSON.stringify(data, null, 2))
