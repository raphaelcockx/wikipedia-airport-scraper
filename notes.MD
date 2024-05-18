## Good to know

- Two different but related airlines might be mapped to the same link (and ultimately IATA code) by Wikipedia. Here's part of the output from [Kansai Internatiional Airport](https://en.m.wikipedia.org/wiki/Kansai_International_Airport) that shows All Nippon Airways and ANA Wings with a different name but the same link, in this case serving the same route. For now, the script will not recognise this as a duplicate.

```json
[
  {
    "airline": {
      "name": "All Nippon Airways",
      "link": "All_Nippon_Airways"
    },
    "destination": {
      "name": "Naha",
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
      "name": "Naha",
      "link": "Naha_Airport",
      "isCharter": false,
      "isSeasonal": false,
      "suspended": false,
      "startDate": null,
      "endDate": null
    }
  }
]
```
