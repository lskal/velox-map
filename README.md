# Velox Map

A free web map of **official** speed-camera open data in six European countries: 🇮🇹 Italy, 🇫🇷 France, 🇳🇴 Norway, 🇸🇪 Sweden, 🇵🇱 Poland and 🇪🇸 Spain.

> **Status:** work in progress - no public version yet.

## What it is

Velox Map is a personal, non-commercial learning project. It shows the speed-enforcement devices that public administrations publish themselves, fetched from the official sources by scheduled jobs and displayed on a map, one country at a time. Official data is refreshed daily; the OpenStreetMap data twice a week.

It uses **official data first**. Community data from OpenStreetMap is optional, off by default and always marked as **not official**:

- **Italy:** the official registry has no positions, so the map can also show OpenStreetMap camera points where no official device matches (planned).
- **France - "OSM extras":** directions and average-speed section paths mapped by OpenStreetMap volunteers, added to official cameras only. OpenStreetMap never adds cameras of its own in France, and never changes an official value.

## Disclaimer

- **Information only. Do not use while driving.**
- Velox Map has no user location, no navigation and no alerts of any kind, and never will.
- Data may be incomplete or out of date. Each country shows the date of its data; the official source is always the reference.
- A point on the map does not necessarily mean an active device. Depending on the country, a record can be a registered device, an installation site or a cabin that may be empty.

## Data sources

| Country                            | Source                                                                                                                                                                                | Licence                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 🇮🇹 Italy                           | Ministero delle Infrastrutture e dei Trasporti - national registry of speed-enforcement devices ([velox.mit.gov.it](https://velox.mit.gov.it/dispositivi))                            | CC BY 3.0 IT                    |
| 🇫🇷 France                          | Ministère de l'Intérieur - fixed speed cameras ([data.gouv.fr](https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/))                                                  | Licence Ouverte 2.0             |
| 🇳🇴 Norway                          | Statens vegvesen - NVDB (Nasjonal vegdatabank)                                                                                                                                        | NLOD                            |
| 🇸🇪 Sweden                          | Trafikverket - Open API                                                                                                                                                               | CC0 1.0                         |
| 🇵🇱 Poland                          | GITD - CANARD device map ([canard.gitd.gov.pl](https://www.canard.gitd.gov.pl/cms/o-nas/mapa-urzadzen)); fallback: GITD dataset on [dane.gov.pl](https://dane.gov.pl/pl/dataset/4364) | CC BY 4.0; dane.gov.pl: CC0 1.0 |
| 🇪🇸 Spain                           | DGT - National Access Point ([nap.dgt.es](https://nap.dgt.es/en/dataset/radares-fijos-dgt))                                                                                           | CC BY                           |
| 🇮🇹 Italy (community layer)         | © OpenStreetMap contributors                                                                                                                                                          | ODbL 1.0                        |
| 🇫🇷 France (OSM extras)             | © OpenStreetMap contributors                                                                                                                                                          | ODbL 1.0                        |
| Base map                           | [OpenFreeMap](https://openfreemap.org), © OpenStreetMap contributors                                                                                                                  | ODbL 1.0                        |
| Italian municipalities (reference) | ISTAT - administrative boundaries                                                                                                                                                     | CC BY                           |

Norway: _Inneholder data under norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Statens vegvesen._

Italy: positions are derived from the municipality of each registered device (the registry has no coordinates) - _dati elaborati_.

Spain: the DGT feed does not cover Catalonia and the Basque Country, which have their own traffic authorities.

## Licence

The **code** in this repository is licensed under the [GNU Affero General Public License v3.0](LICENSE).

The licence covers the code only. The **data** shown by the app belongs to its publishers and keeps its own licence (see the table above). This repository contains no datasets: scheduled jobs fetch them from the official sources, and the site serves that copy with each publisher's attribution and licence. OpenStreetMap data is always kept in its own file, never merged with official data.

## Privacy

- No cookies, no analytics, no third-party scripts, no login.
- Your country will be estimated from the request's IP address only to suggest a country and a language (planned). Nothing is stored.
- Your choices (theme, language, country, and whether you've seen the OpenStreetMap explanation) are saved in your own browser (`localStorage`).
- Like any hosting service, Vercel keeps short-lived request logs that include IP addresses.

## Run it locally

Node 24 (see `.nvmrc`).

```
npm install
npm run dev
```

The data files (`/data/fr.json`, `/data/osm-fr.json`) are written by scheduled jobs on Vercel and kept in a private Vercel Blob store; the dev server forwards `/data/…` to the deployed site, so a fresh clone shows the same data without any setup. `npm run build` runs the linter and the type check first.

## Contact

Questions, corrections or requests from data publishers: please open an [issue](https://github.com/lskal/velox-map/issues).
