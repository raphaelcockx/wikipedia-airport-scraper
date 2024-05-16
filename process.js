import * as cheerio from 'cheerio'
import dayjs from 'dayjs'

const airportPage = function (body) {
  const $ = cheerio.load(body)

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

        if (tagName === 'P') { // Content shouldn't be wrapped in a paragraph tag, but if it is...
          return $(this).contents().map(function () {
            const tagName = $(this).prop('tagName') || null
            const link = $(this).attr('href')?.replace('/wiki/', '') || null
            const value = this.nodeValue ? this.nodeValue.trim() : $(this).text()

            return {
              tagName,
              link,
              value
            }
          }).get()
        } else {
          return {
            tagName,
            link,
            value
          }
        }
      })
      .get()
      .filter((d) => !['BR', 'SUP'].includes(d.tagName))
      .filter(({ tagName, value }) => !(tagName === null && ['', ','].includes(value)))
      .map((d, index) => ({ index, ...d }))

    const markers = destinationsNodes
      .filter((node) => node.tagName === 'B')
      .map((marker, i, arr) => {
        return {
          ...marker,
          nextIndex: [arr.find((d) => d.index > marker.index)][0]?.index || Infinity
        }
      })

    const seasonalMarker = markers.find((marker) => marker.value === 'Seasonal:')
    const seasonalFromTo = seasonalMarker ? [seasonalMarker.index, seasonalMarker.nextIndex] : [Infinity, Infinity]

    const charterMarker = markers.find((marker) => marker.value === 'Charter:')
    const charterFromTo = charterMarker ? [charterMarker.index, charterMarker.nextIndex] : [Infinity, Infinity]

    const seasonalCharterMarker = markers.find((marker) => marker.value === 'Seasonal charter:')
    const seasonalCharterFromTo = seasonalCharterMarker ? [seasonalCharterMarker.index, seasonalCharterMarker.nextIndex] : [Infinity, Infinity]

    const airportEntries = destinationsNodes.filter((node) => node.tagName === 'A')

    const destinations = airportEntries.map((airport, i) => {
      const { index, value: name, link } = airport
      const extraTextEntry = destinationsNodes.slice(index + 1, airportEntries[i + 1]?.index).filter((node) => node.tagName !== 'B')[0] || null

      // Determine charter/seasonal
      const isSeasonal = (index > seasonalFromTo[0] && index < seasonalFromTo[1]) || (index > seasonalCharterFromTo[0] && index < seasonalCharterFromTo[1])
      const isCharter = (index > charterFromTo[0] && index < charterFromTo[1]) || (index > seasonalCharterFromTo[0] && index < seasonalCharterFromTo[1])

      // Determine start date (if any)
      const startDateMatch = extraTextEntry?.value.match(/\((begins|resumes) (.+)\)/) || null
      const startDate = startDateMatch ? dayjs(startDateMatch[2]).format('YYYY-MM-DD') : null

      // Determine end date (if any)
      const endDateMatch = extraTextEntry?.value.match(/\(ends (.+)\)/) || null
      const endDate = endDateMatch ? dayjs(endDateMatch[1]).format('YYYY-MM-DD') : null

      // Check if destination is suspended
      const suspended = /\(suspended/.test(extraTextEntry?.value)

      const destination = {
        name,
        link,
        isCharter,
        isSeasonal,
        suspended,
        startDate,
        endDate
      }

      return {
        airline,
        destination
      }
    })

    return destinations
  }).toArray()
}

const listOfAirports = function (body) {
  const $ = cheerio.load(body)

  return $('tbody tr:has(td)').map(function () {
    const $cols = $('td', $(this))
    
    const code = $cols.eq(0).text().replace('\n', '').replace(/\[[0-9a-z]{1,2}\]/g, '')
    
    const $name = $cols.eq(2)
    const name = $name.text().trim().replace('\n', '').replace(/\[[0-9a-z]{1,2}\]/g, '')
    
    const rawLink = $('a', $name).attr('href') || null
    const hasNoPage = /action=edit/.test(rawLink)
    const link = hasNoPage || rawLink === null ? null : rawLink.replace('/wiki/', '')

    return {
      code,
      name,
      link
    }
  }).get()
}

export default {
  airportPage,
  listOfAirports
}
