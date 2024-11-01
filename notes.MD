## Good to know

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