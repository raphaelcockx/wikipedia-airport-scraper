# Wikipedia Airport Scraper

A small Node.js script to scrape info about airports and their destinations from Wikipedia pages. When provided with the full HTML of any airport page on the **English** language Wikipedia, it will extract:

- IATA and ICAO codes for this airport
- Coordinates
- A list of all passenger flights listed with info on the destination airport, airline and any start and end dates. Also includes flags to indicate if a destination has been suspended and whether it's seasonal and/or operated as a charter flight. Basically anything from the 'Airlines and destinations' table as a consistent and formatted output.

It is left to any script that uses this to:

- Set up requests to the `en.wikipedia.org` pages, grab responses and rate limit those requests where necessary
- Store and process any output from the scraper
- Make further requests to lookup destination airports or link airline names to IATA/ICAO codes.

Right now, this script doesn't provide any way to look up basic data found on airline pages and as such can't help you to link names to codes. Sunch functionality might be added in the future.

## How to use

Here's a very simple example that gets data for Brussels Airport from the wikipedia url:

```js
import got from 'got' // Or any other package that requests a HTML page
import write from 'write' // Or any other package that writes data to a local file

import scrape from 'wikipedia-airport-scraper'

// Get the HTML from the page and pass it to the script
const data = await got('https://en.wikipedia.org/wiki/Brussels_Airport').then((response) => scrape(response.body))

// Write out the scraped data
const outputPath = new URL('./data.json', import.meta.url).pathname
await write(outputPath, JSON.stringify(data, null, 2))
```

The data (simplified to show only one airline and one destination) then looks like this:

```json
{
  "name": "Brussels Airport",
  "iataCode": "BRU",
  "icaoCode": "EBBR",
    "coordinates": {
    "latitude": 50.901389,
    "longitude": 4.484444
  },
  "flights": [
    {
      "airline": {
        "name": "Aegean Airlines",
        "link": "Aegean_Airlines"
      },
      "destination": {
        "shortName": "Athens",
        "fullName": "Athens International Airport",
        "link": "Athens_International_Airport",
        "isCharter": false,
        "isSeasonal": false,
        "suspended": false,
        "startDate": null,
        "endDate": null
      }
    }
  ]
}
```

## Caveats

- It's obvious but probably deserves to be said: the output of this script can only be as good as the Wikipedia page that it uses as input. YMMV.

- Two different but related airlines might be mapped to the same link (and ultimately IATA code) by Wikipedia. Here's part of the output from [Kansai International Airport](https://en.wikipedia.org/wiki/Kansai_International_Airport) that shows All Nippon Airways and ANA Wings with a different name but the same link, in this case serving the same route. For now, the script will not recognise this as a duplicate.

```json
{
  "flights": [
    {
      "airline": {
        "name": "All Nippon Airways",
        "link": "All_Nippon_Airways"
      },
      "destination": {
        "shortName": "Naha",
        "fullName": "Naha Airport",
        "link": "Naha_Airport",
        "isCharter": false,
        "isSeasonal": false,
        "suspended": false,
        "startDate": null,
        "endDate": null
      }
    },
    {
      "airline": {
        "name": "ANA Wings",
        "link": "All_Nippon_Airways"
      },
      "destination": {
        "shortName": "Naha",
        "fullName": "Naha Airport",
        "link": "Naha_Airport",
        "isCharter": false,
        "isSeasonal": false,
        "suspended": false,
        "startDate": null,
        "endDate": null
      }
    }
  ]
}
```

- Not every destination airport that the script picks up on airport pages will have an actual link. If the link leads to a Wikipedia edit page, it will appear in the JSON as `null` as will the `fullName` field. Here's part of the output from [Ignatyevo Airport](https://en.wikipedia.org/wiki/Ignatyevo_Airport) that shows Zeya as a destination airport with no Wikipedia page to link to:

```json
{
  "flights": [
    {
      "airline": {
        "name": "Angara Airlines",
        "link": "Angara_Airlines"
      },
      "destination": {
        "shortName": "Zeya",
        "fullName": null,
        "link": null,
        "isCharter": false,
        "isSeasonal": true,
        "suspended": false,
        "startDate": null,
        "endDate": null
      }
    }
  ]
}
```
