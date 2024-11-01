# Wikipedia Airport Scraper

A small script to 'scrape' info about airports and their destinations from Wikipedia pages. When provided with the full HTML of any airport page on the **mobile version** of the **English** language Wikipedia, it will extract:

- IATA and ICAO codes for this airport
- A list of all flights listed with info on the destination airport, airline and any start and end dates. Includes flags to indicate if a destination has been suspended and whther it's seasonal and/or operated as a charter flight. Basically anything from the 'Airlines and destinations' table as a consistent and formatted output.

It is left to any script that uses this to:

- Set up requests to the `en.m.wikipedia.org` pages, grab responses and rate limit those requests where necessary
- Store and process any output from the scraper
- Make further requests to lookup destination airports or link airline names to IATA/ICAO codes.

Right now, this script doesn't provide any way to look up basic data found on airline pages and as such can't help you to link names to codes. Sunch functionality might be added in the future.

## Caveats

- Two different but related airlines might be mapped to the same link (and ultimately IATA code) by Wikipedia. Here's part of the output from [Kansai Internatiional Airport](https://en.m.wikipedia.org/wiki/Kansai_International_Airport) that shows All Nippon Airways and ANA Wings with a different name but the same link, in this case serving the same route. For now, the script will not recognise this as a duplicate.

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

- Not every destination airport that the script picks up on airport pages will have an actual link. If the link leads to a Wikipedia edit page, it will appear in the JSON as `null`. Here's part of the output from [Ignatyevo Airport](https://en.m.wikipedia.org/wiki/Ignatyevo_Airport) that shows Zeya as a destination airport with no Wikipedia page to link to:

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
