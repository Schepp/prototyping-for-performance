# Script

## Vorbereitung:

### Einmal installieren:

* Critical CSS Bookmarklet im Browser ablegen
* Andere Bookmarks aus diesem Script im Browser ablegen
* SSH
* Git
* Node 14 per nvm
* Wrangler
  - `npm install -g @cloudflare/wrangler`
  - Wrangler per `wrangler login` konfigurieren
* PHPStorm

### Vor jedem Talk zurücksetzen:

* PHPStorm Tabs oben anordnen
* Devtools -> Device Emulation abschalten
* Devtools -> Sources -> Overrides -> aktivieren und den "overrides" Folder wählen
* Devtools -> Sources -> Overrides -> entfernen
* Devtools -> Sources -> Close all
* Devtools -> Performance -> Panel leeren
* Devtools -> Network Request Blocking -> leeren
* Browser-Download in Override-Verzeichnis durchführen
* Auf duesseldorf.de gehen und Slider abschalten
* Initialen Worker per `wrangler publish` publizieren

## Intro

* Manchmal möchte man seine Ideen trotzdem gerne prototypen
* Denn grau ist alle Theorie

## 1. Erster Eindruck der Webseite + Analyse

* [https://www.duesseldorf.de/](https://www.duesseldorf.de/)
* Auf Motorola Moto G4 stellen + "Mid-tier mobile"
* Neu Laden
* Devtools -> Lighthouse-Test durchführen -> 30-40
* [Pagespeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fwww.duesseldorf.de%2F)
* [Webpagetest Ergebnis](https://webpagetest.org/result/210123_DiJ7_de61d49178f82fafce917d1cf98797ed/)
* Erkenntnisse:
  - Kein HTTP/2
  - Viele JavaScript Ressourcen
  - Riesen CSS
* Video angucken
* Performance Profiler laufen lassen -> Screenshots + Web Core Vitals aktivieren
  - FCP (First Contentful Paint) beginnt wenn CSS da ist
  - Viele LS (Layout Shifts), wenn Bilder geladen werden
  - Massive LS und LCP (Largest Contentful Paint) bei L (Load)
  - Long Tasks vorwiegend bei DCL (DOM Content Loaded) und L (Load)

## 2. CSS Laden optimieren

* Chrome Devtools Source Overrides vorstellen
* Devtools -> Sources -> Overrides -> "+ Select folder for overrides"
* Ordner "overrides" auswählen
* Requester bestätigen
* Devtools -> Sources -> Page -> HTML mit alert editieren -> Strg + S
* Seite laden und zeigen, dass Sie noch geht
* alert wieder entfernen
* [Critical CSS Boomarklet](https://github.com/DirkPersky/criticalcss) benutzen
* Kritisches CSS ins HTML inlinen
* Bisheriges CSS lazy ladend machen
* Das kleine JavaScript inlinen, weil es blockierend eingebunden ist

```
git reset --hard && git checkout step-2
```

* Neuer Lighthouse Test -> FCP geht runter

### 3. Layout Shift (LS) des Sliders reparieren

* Devtools -> Console Drawer -> Rendering -> "Layout Shift Regions" aktivieren
* Nur erstes Bild anzeigen, bis der Slider initialisiert ist:

```
  .lhd-carousel-inner .slider_header_start ~ .slider_header_start {
    display: none;
  }
  .bx-wrapper .slider_header_start ~ .slider_header_start {
    display: block;
  }
```

* Slider-Höhe automatisch:

```
  #stage-innerwrap#stage-innerwrap {
    height: auto;
  }
```

* Bild-Dimensionen einstellen:

```
  .slider-item-img {
    width: 100%;
    height: auto;
    aspect-ratio: 98 / 46;
    object-fit: cover;
  }
```

* Blauer Corona-Header reparieren:

```
  .corona-xss-header {
    background: #009fdf;
    font-family: "DinProBold",sans-serif;
    font-weight: normal;
    padding: 15px;
    text-align: left;
  }

  @media (max-width: 767px) {
    .visible-xs {
      display: block !important;
    }
  }
```

```
git reset --hard && git checkout step-3
```

* Neuer Lighthouse Test -> CLS geht runter

## 4. Schriften optimieren

* Devtools -> Network -> fonts -> 2 Schriften
* URL zu Schriftkopieren -> TTF herunterladen
* URL zu Schriftkopieren -> TTF herunterladen
* Zu [Font-Squirrel](https://www.fontsquirrel.com/tools/webfont-generator) gehen und die Schriften optimieren und im Overrides-Verzeichnis speichern
* Die Woff2 entpacken und umbenennen
* Styles lokal wegspeichern
* `@font-face`-Deklaration in der styles.css suchen und ausschneiden
* In die Index einfügen
* Nur das CSS markieren und mit Strg + Alt + L formatieren
* WOFF2 hinzufügen
* `font-display: swap` und @font-face descriptors hinzufügen:

```
font-display: swap;
ascent-override: 80%;
descent-override: 20%;
line-gap-override: 0%;
```

* `<link rel="preload">` hinzufügen:

```
<link rel="preload" href="dinpro-bold-webfont.woff2" as="font" crossorigin="anonymous">
<link rel="preload" href="dinpro-regular-webfont.woff2" as="font" crossorigin="anonymous">
```

```
git reset --hard && git checkout step-4
```

* Neuer Lighthouse Test -> bringt in den Messwerten nicht viel

## 5. Bilder optimieren

* Bilder im Devtools Element Inspector zeigen -> `kein Lazy Loading
* Devtools -> Network -> Img -> `.jpg` -> viele Bilder
* Bei allen Bildern ein `loading="lazy" decoding="async"` dranhängen (extra Thread).
* Devtools -> Network -> Img -> `.jpg` -> nun wenige Bilder
* `window.onload` wird schneller ausgeführt

### Bilder Preload

* Bilder im Devtools Element Inspector zeigen -> `<picture>` mit `srcset`
* Spezielles [Preload für responsive Bilder](https://html.spec.whatwg.org/multipage/semantics.html#attr-link-imagesrcset) zeigen
* `<link rel="preload">` für Rathaus-Bild hinzufügen für Largest Contentful Paint LCP:

```
  <link rel=preload" as="image"
    imagesrcset="/fileadmin/_processed_/7/e/csm_start_rathaus_2880_bf9ed9334c.jpg, /fileadmin/_processed_/7/e/csm_start_rathaus_2880_f20abfa21d.jpg 2x"
    media="(max-width: 460px)">
  <link rel="preload" as="image"
    imagesrcset="/fileadmin/_processed_/7/e/csm_start_rathaus_2880_000e0cf0a0.jpg, /fileadmin/_processed_/7/e/csm_start_rathaus_2880_557e78d4c7.jpg2x"
    media="(min-width: 461px) and (max-width: 960px)">
  <link rel="preload" as="image"
    imagesrcset="/fileadmin/_processed_/7/e/csm_start_rathaus_2880_87b34c34f9.jpg, /fileadmin/_processed_/7/e/csm_start_rathaus_2880_30471c0f4f.jpg 2x"
    media="(min-width: 961px)">
```

* `<link rel="preload">` für Coronavirus-Bild hinzufügen für Largest Contentful Paint LCP:

```
  <link rel="preload" as="image"
    imagesrcset="/fileadmin/_processed_/8/8/csm_teaser_web_f8c4fc92dc.jpg, /fileadmin/_processed_/8/8/csm_teaser_web_9d2cdd6d2d.jpg 2x"
    media="(max-width: 959px)">
  <link rel="preload" as="image"
    imagesrcset="/fileadmin/_processed_/8/8/csm_teaser_web_429a624e73.jpg, /fileadmin/_processed_/8/8/csm_teaser_web_4fa46a4a94.jpg 2x"
    media="(min-width: 960px)">
```

### Bildformate optimieren

* Bilder mit [Squoosh](https://squoosh.app) optimieren
* Bilder sehen sogar besser aus
* Reveal in Source Panel
* Right Click: "Save for Overrides"
* Drag & Drop

```
git reset --hard && git checkout step-5
```

* Neuer Lighthouse Test -> Largest Contentful Paint (LCP) macht einen riesen Sprung

## 6. Scripte

* Devtools -> Performance Profile -> frisst nicht viel
* Devtools -> Network -> Js -> `moment.js` und `vis.js` sind riesig
* Zum Testen `vis.js`-URL blockieren -> kein Fehler
* Zum Testen `moment.js`-URL blockieren -> Fehler bei `clndr.js` und `calendar.js`
* Fehler bei `lhd.calendar.init()`
* Beide werden initial gar nicht benötigt
* Script-Sammler in die Console packen und erklären, was er tut:

```
Promise.all(
  Array.from(document.querySelectorAll('script[src^="/typo3conf/ext"]'))
    .filter(el =>
      !el.src.includes('vis.') &&
      !el.src.includes('moment.js') &&
      !el.src.includes('clndr.js') &&
      !el.src.includes('calendar.js')
    )
    .map(el =>
      fetch(el.src)
        .then(response => response.text())
    )
).then(contents => {
  console.log(
    contents
      .join('\r\n')
      .replace('lhd.calendar.init()','')
      .replace('lhd.bxsliderHeaderteaser.init()','')
  );
});
```

* Erklären dass er die Initialisierung für Slider und Kalender entfernt
* Mit dem Resultat zu [https://jscompress.com/](https://jscompress.com/) gehen
* In eine `scripts.js` speichern
* Alle bisherigen Scripte entfernen
* Nach `<!--TYPO3SEARCH_end-->` suchen
* Darüber `<script src="scripts.js" async onload="lhd.bxsliderHeaderteaser.init()"></script>` einfügen
* `async` bedeutet JS-Parsing in separatem CPU-Thread
* `async` bedeutet, dass das `onload` schneller zum Zuge kommt -> Slider
* An dem `window.onload` ändert sich nichts, außer dass dort kein Slider und Kalender mehr initialisiert werden

```
git reset --hard && git checkout step-6
```

* Neuer Lighthouse Test -> Total Blocking Time (TBT) macht einen riesen Sprung, TTI auch

## 6b. CloudFlare Workers

* [https://workers.cloudflare.com/](https://workers.cloudflare.com/) öffnen
* Im Prinzip Serverless Functions, aber ohne "Cold Starts"
* Unterstüzung für JavaScript und WASM
* Durch Compile-Schritt Unterstützung für TypeScript und Rust
* Ebenfalls durch Compile-Schritt: CommonJS und ES Modules
* Keine Node Bibliotheken, weil kein Node! Eher wie ein Worker: Web Worker, Service Worker
* API lässt sich ähnlich wie ein Service Worker programmieren
* Intelligenter Proxy als ein Use-Case

### Vorteile

* Extern vorzeigbar
* Extern Messbar
* Seite kann gesurft werden
* HTTP/2 von Haus aus
* Brotli-Kompression von Haus aus (CSS: 477KB -> 59KB, JS: 1.1MB -> 425KB)

### Boilerplate

* Man benötigt npm & Wrangler
* `wrangler init duesseldorf --type=javascript`
* wrangler.toml (zeigen)
* index.js
* package.json
* Testen per `wrangler dev`
* Publizieren per `wrangler publish`

```
wrangler publish
```

* Neuer Lighthouse Test -> Alles ziemlich gut, ohne Code-Anpassungen

## 7. HTML Rewriter

```
git reset --hard && git checkout step-7 && wrangler publish
```

* Schreibt den HTML Stream on-the-fly um
* Arbeitet mit CSS-Selektoren (nicht ganz so mächtig)
* Umwandlung in einer Klasse mit der `element()`- Methode
* Elemente können darin ähnlich wie das DOM manipuliert werden
* `<img>`-Element mit `loading="lazy"` und `decoding="async"` ausgestattet

## 8. Cloudinary

```
git reset --hard && git checkout step-8 && wrangler publish
```

* JPGs werden umgelenkt zu Cloudinary
* [Cloudinary](https://cloudinary.com/documentation/image_optimization) öffnen
* [Cloudinary Pricing](https://cloudinary.com/pricing) zeigen
* [WebP-Beispiel](https://res.cloudinary.com/schepp/image/fetch/w_auto/f_auto/q_auto:low/https://www.duesseldorf.de/fileadmin/_processed_/7/e/csm_start_rathaus_2880_f20abfa21d.jpg) zeigen
* [AVIF-Beta-Beispiel](https://res.cloudinary.com/schepp/image/fetch/w_auto/f_avif/q_auto:low/https://www.duesseldorf.de/fileadmin/_processed_/7/e/csm_start_rathaus_2880_f20abfa21d.jpg) zeigen

## 9. CSS Laden optimieren

## 10. CLS & Scripte zusammenfassen


```
Promise.all(
  Array.from(document.querySelectorAll('script[src^="/typo3conf/ext"]'))
    .filter(el =>
      !el.src.includes('vis.') &&
      !el.src.includes('moment.js') &&
      !el.src.includes('clndr.js') &&
      !el.src.includes('calendar.js')
    )
    .map(el =>
      fetch(el.src)
        .then(response => response.text())
    )
).then(contents => {
  console.log(
    contents
      .join('\r\n')
      .replace('lhd.calendar.init()','')
      .replace('lhd.bxsliderHeaderteaser.init()','')
  );
});
```


## 11. Finales Ergebnis:

[Webpagetest](https://www.webpagetest.org/video/compare.php?tests=210129_DiJK_6aa13f760d493212ffe51144fdc92a11%2C210129_DiPM_be7b56a98c82a7c63194d25b39376f19&thumbSize=200&ival=500&end=full)

[Video](https://www.webpagetest.org/video/view.php?end=full&tests=210129_DiJK_6aa13f760d493212ffe51144fdc92a11%2C210129_DiPM_be7b56a98c82a7c63194d25b39376f19&bg=000000&text=ffffff&loc=Frankfurt%2C+Germany+-+EC2+-+Chrome+-+Emulated+Motorola+G+%28gen+4%29+-+3GFast)

## Addendum

Dateien liegen alle auf [schepp.github.io/prototyping-for-performance/assets/](https://schepp.github.io/prototyping-for-performance/assets)

