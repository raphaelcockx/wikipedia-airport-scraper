import * as cheerio from 'cheerio'
import dayjs from 'dayjs'
import round from 'lodash.round'

const dateRegex = /([0-9]{1,2} )?(January|February|March|April|May|June|July|August|September|October|November|December) ([0-9]{1,2}, )?[0-9]{4}/i

const scrape = (body) => {
  const $ = cheerio.load(body)

  // Get name and IATA/ICAO codes
  const name = $('span.mw-page-title-main').text().trim()
  const iataCode = /[A-Z]{3}/.exec($('span.nickname', $('li a[title="IATA airport code"]').parent()).text())[0]
  const icaoCode = /[A-Z]{4}/.exec($('span.nickname', $('li a[title="ICAO airport code"]').parent()).text())[0]

  // Get coordinates
  const $coordinates = $('span.geo-dms')

  const coordsRegex = /([0-9]{1,3})°([0-9]{1,2}\.?[0-9]{0,2}′)?([0-9]{1,2}\.?[0-9]{0,2}″)?([ENSW])/

  const latitude = convertDegrees(...coordsRegex.exec($('span.latitude', $coordinates).text().trim()).slice(1))
  const longitude = convertDegrees(...coordsRegex.exec($('span.longitude', $coordinates).text().trim()).slice(1))

  const coordinates = {
    latitude,
    longitude
  }

  // Get flights
  const $passengerTable = getPassengerTable($)

  // Check headings to make sure we have the right table
  const isCorrectTable = $('th', $passengerTable).eq(0).text() === 'Airlines' && $('th', $passengerTable).eq(1).text() === 'Destinations'

  const flights = isCorrectTable ? getFlights($passengerTable, $) : []

  return {
    name,
    iataCode,
    icaoCode,
    coordinates,
    flights
  }
}

const convertDegrees = (degrees, minutes, seconds, direction) => {
  const degreesDecimal = round((parseInt(degrees) + ((parseInt(minutes) || 0) / 60) + ((parseInt(seconds) || 0) / 3600)), 6)
  return ['S', 'W'].includes(direction) ? degreesDecimal * -1 : degreesDecimal
}

const getPassengerTable = ($) => {
  const adSelectors = [
    'span.mw-headline#Airlines_and_destinations',
    'span.mw-headline#Airlines_and_Destinations',
    'span.mw-headline#Airline_and_destination',
    'span.mw-headline#Airline_and_Destination',
    'span.mw-headline#Airline_and_destinations',
    'span.mw-headline#Airline_and_Destinations',
    'h2#Airlines_and_destinations',
    'h2#Airlines_and_Destinations',
    'h2#Airline_and_destination',
    'h2#Airline_and_Destination',
    'h2#Airline_and_destinations',
    'h2#Airline_and_Destinations',
    'h2#Charters_and_destinations',
    'h2#Charters_and_Destinations'
  ]

  const $adSection = $(adSelectors.join(', ')).parent().next()
  const $passengerHeading = $('h3 span.mw-headline#Passenger', $adSection)

  return $passengerHeading.length > 0
    ? $passengerHeading.parent().nextUntil('h3').filter('table.wikitable')
    : $('table.wikitable', $adSection).eq(0)
}

const getFlights = ($passengerTable, $) => {
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

    const destinationsNodes = $destinationsCol.contents()
      .map(function () {
        let tagName = $(this).prop('tagName') || null
        const airportLink = $(this).attr('href') || null
        let value = this.nodeValue ? this.nodeValue.trim() : $(this).text()

        // Some airports will be listed with no link. We should try to detect those cases
        if (tagName === null && value !== ',' && value.includes(',') && !value.startsWith('(')) {
          tagName = 'A'
          value = value.split(',').filter((d) => d !== '').map((d) => d.trim()) // value.replaceAll(',', '').trim()
        }

        return {
          tagName,
          link: airportLink,
          value
        }
      })
      .get()
      .filter((d) => !['BR', 'SUP'].includes(d.tagName))
      .filter(({ tagName, value }) => !(tagName === null && ['', ',', ', '].includes(value)))
      .map((d, index) => ({ index, ...d }))
      .reduce((acc, curr, i) => {
        if (i === 0 || curr.tagName === 'B') acc.push([])
        acc[acc.length - 1].push(curr)

        return acc
      }, [])
      .flatMap((nodes, blockIndex) => nodes.map((node) => ({ ...node, blockIndex })))

    // Get markers and modifiers
    const markers = destinationsNodes.filter((node) => node.tagName === 'B')
    const modifiers = destinationsNodes
      .filter((node) => node.tagName === null)
      .map((modifier) => {
        return {
          ...modifier,
          formattedDate: dateRegex.test(modifier.value) ? dayjs(modifier.value.match(dateRegex)[0]).format('YYYY-MM-DD') : null
        }
      })

    // Get airports
    const airportEntries = destinationsNodes.filter((node) => node.tagName === 'A')

    const destinations = airportEntries.flatMap((airport) => {
      const { index, blockIndex, value: shortName, link } = airport

      // Process markers
      const isCharter = markers.find((marker) => (/^([A-Za-z\s]+)?[c|C]harter/.test(marker.value) || /^Hajj\s?&\s?Umrah/.test(marker.value)) && marker.blockIndex === blockIndex) !== undefined
      const isSeasonal = markers.find((marker) => (/^Seasonal/.test(marker.value) || /^Hajj\s?&\s?Umrah/.test(marker.value)) && marker.blockIndex === blockIndex) !== undefined

      // Process modifiers
      const suspended = modifiers.find((modifier) => /\((temporarily )?suspended/.test(modifier.value) && modifier.index === index + 1) !== undefined ||
        modifiers.find((modifier) => /\((both suspended|all suspended)/.test(modifier.value) && modifier.blockIndex === blockIndex) !== undefined

      const startDate = (modifiers.find((modifier) => /\((begins|resumes)/.test(modifier.value) && modifier.index === index + 1)?.formattedDate || null) ||
        (modifiers.find((modifier) => /\((both begin|both resume)/.test(modifier.value) && modifier.blockIndex === blockIndex)?.formattedDate || null)
      const endDate = modifiers.find((modifier) => /\((ends)/.test(modifier.value) && modifier.index === index + 1)?.formattedDate || null

      const destination = {
        shortName,
        ...getFullNameAndLink(link),
        isCharter,
        isSeasonal,
        suspended,
        startDate,
        endDate
      }

      return Array.isArray(destination.shortName)
        ? destination.shortName.map((sn) => {
          const { shortName, ...rest } = destination

          return {
            airline,
            destination: {
              shortName: sn,
              ...rest
            }
          }
        })
        : {
            airline,
            destination
          }
    })

    return destinations
  }).toArray()
}

const getFullNameAndLink = (link) => {
  if (!link) {
    return {
      fullName: null,
      link: null
    }
  } else {
    const searchParams = new URL(link, 'https://en.m.wikipedia.org/').searchParams

    return searchParams.size > 0
      ? {
          fullName: searchParams.get('title').replaceAll('_', ' '),
          link: null
        }
      : {
          fullName: decodeURI(link.replace('/wiki/', '').replaceAll('_', ' ')),
          link: link.replace('/wiki/', '')
        }
  }
}

export default scrape
