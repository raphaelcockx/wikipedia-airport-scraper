import * as cheerio from 'cheerio'
import dayjs from 'dayjs'

const dateRegex = /([0-9]{1,2} )?(January|February|March|April|May|June|July|August|September|October|November|December) ([0-9]{1,2}, )?[0-9]{4}/i

const airportPage = function (body) {
  const $ = cheerio.load(body)

  const $adSection = $('span.mw-headline#Airlines_and_destinations, span.mw-headline#Airline_and_destination').parent().next()
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
    const rawAirlineLink = $airlineLink.attr('href') || null
    const hasNoPage = /action=edit/.test(rawAirlineLink)
    const airlineLink = hasNoPage || rawAirlineLink === null ? null : rawAirlineLink.replace('/wiki/', '')

    const airline = {
      name: $airlineLink.text() || $('span.nowrap', $airlineCol).text() || $airlineCol.text().replace(/\[[0-9a-z]{1,}\]/, '').trim(),
      link: airlineLink
    }

    console.log(airline.name)

    const destinationsNodes = $destinationsCol.contents()
      .map(function () {
        let tagName = $(this).prop('tagName') || null
        const link = $(this).attr('href')?.replace('/wiki/', '') || null
        let value = this.nodeValue ? this.nodeValue.trim() : $(this).text()

        // Some airports will be listed with no link. We should try to detect those cases
        if (tagName === null && /^,\s?[a-zA-Z]+/.test(value)) {
          tagName = 'A'
          value = value.replace(',', '').trim()
        }

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
      .filter(({ tagName, value }) => !(tagName === null && ['', ',', ', '].includes(value)))
      .map((d, index) => ({ index, ...d }))
      .reduce((acc, curr, i, arr) => {
        if (i === 0 || curr.tagName === 'B') acc.push([])
        acc[acc.length - 1].push(curr)

        return acc
      }, [])
      .flatMap((nodes, blockIndex) => nodes.map((node) => ({ ...node, blockIndex })))

    console.table(destinationsNodes)

    // Get markers and modifiers
    const markers = destinationsNodes.filter((node) => node.tagName === 'B')
    const modifiers = destinationsNodes
      .filter((node) => node.tagName === null)
      .map((modifier) => {
        return {
          ...modifier,
          formattedDate: dayjs(modifier.value.match(dateRegex)[0]).format('YYYY-MM-DD')
        }
      })

    // Get airports
    const airportEntries = destinationsNodes.filter((node) => node.tagName === 'A')

    const destinations = airportEntries.map((airport) => {
      const { index, blockIndex, value: name, link } = airport

      // Process markers
      const isCharter = markers.find((marker) => marker.value === 'Charter:' && marker.blockIndex === blockIndex) !== undefined ||
        markers.find((marker) => marker.value === 'Seasonal charter:' && marker.blockIndex === blockIndex) !== undefined

      const isSeasonal = markers.find((marker) => marker.value === 'Seasonal:' && marker.blockIndex === blockIndex) !== undefined ||
        markers.find((marker) => marker.value === 'Seasonal charter:' && marker.blockIndex === blockIndex) !== undefined

      // Process modifiers
      const suspended = modifiers.find((modifier) => /\((temporarily )?suspended/.test(modifier.value) && modifier.index === index + 1) !== undefined
      const startDate = (modifiers.find((modifier) => /\((begins|resumes)/.test(modifier.value) && modifier.index === index + 1)?.formattedDate || null) ||
        (modifiers.find((modifier) => /\((both begin|both resume)/.test(modifier.value) && modifier.blockIndex === blockIndex)?.formattedDate || null)

      const endDate = modifiers.find((modifier) => /\((ends)/.test(modifier.value) && modifier.index === index + 1)?.formattedDate || null

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

  return $('tbody tr:has(td)')
    .map(function () {
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
    })
    .get()
    .filter((d) => d.link)
}

export const scrape = {
  airportPage,
  listOfAirports
}
