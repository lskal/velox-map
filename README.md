# Velox Map

A free web map of **official** speed-camera open data in six European countries: 🇮🇹 Italy, 🇫🇷 France, 🇳🇴 Norway, 🇸🇪 Sweden, 🇵🇱 Poland and 🇪🇸 Spain.

> **Status:** work in progress - no public version yet.

## What it is

Velox Map is a personal, non-commercial learning project. It shows the speed-enforcement devices that public administrations publish themselves, fetched from the official sources and displayed on a map, one country at a time.

It uses **official data only**. Italy is the one exception: the official registry has no positions, so the map also shows community-mapped points from OpenStreetMap, always marked as **not official**.

## Disclaimer

- **Information only. Do not use while driving.**
- Velox Map has no user location, no navigation and no alerts of any kind, and never will.
- Data may be incomplete or out of date. Each country shows the date of its data; the official source is always the reference.
- A point on the map does not necessarily mean an active device. Depending on the country, a record can be a registered device, an installation site or a cabin that may be empty.

## Data sources

| Country | Source | Licence |
|---|---|---|
| 🇮🇹 Italy | Ministero delle Infrastrutture e dei Trasporti - national registry of speed-enforcement devices ([velox.mit.gov.it](https://velox.mit.gov.it)) | No licence stated - reuse confirmation requested |
| 🇫🇷 France | Ministère de l'Intérieur - fixed speed cameras ([data.gouv.fr](https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/)) | Licence Ouverte 2.0 |
| 🇳🇴 Norway | Statens vegvesen - NVDB (Nasjonal vegdatabank) | NLOD |
| 🇸🇪 Sweden | Trafikverket - Open API | CC0 1.0 |
| 🇵🇱 Poland | GITD - CANARD device map ([canard.gitd.gov.pl](https://www.canard.gitd.gov.pl/cms/o-nas/mapa-urzadzen)) | No licence stated - reuse confirmation requested |
| 🇪🇸 Spain | DGT - National Access Point ([nap.dgt.es](https://nap.dgt.es/en/dataset/radares-fijos-dgt)) | CC BY |
| 🇮🇹 Italy (community layer) | © OpenStreetMap contributors | ODbL 1.0 |
| Base map | [OpenFreeMap](https://openfreemap.org), © OpenStreetMap contributors | ODbL 1.0 |
| Italian municipalities (reference) | ISTAT - administrative boundaries | CC BY |

Norway: *Inneholder data under norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Statens vegvesen.*

Spain and Catalonia / Basque Country: the DGT feed does not cover these two regions, which have their own traffic authorities.

## Licence

The **code** in this repository is licensed under the [GNU Affero General Public License v3.0](LICENSE).

The licence covers the code only. The **data** shown by the app belongs to its publishers and keeps its own licence (see the table above). This repository does not redistribute the datasets: the app fetches them from the official sources.

## Privacy

- No cookies, no analytics, no third-party scripts, no login.
- Your country is estimated from the request's IP address only to suggest a country and a language. Nothing is stored.
- Your choices (country, language) are saved in your own browser (`localStorage`).
- Like any hosting service, Vercel keeps short-lived request logs that include IP addresses.

## Contact

Questions, corrections or requests from data publishers: please open an [issue](https://github.com/lskal/velox-map/issues).