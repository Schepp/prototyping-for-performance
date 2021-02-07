# Script

## Vorbereitung:

### Einmal installieren:

* Critical CSS Bookmarklet im Browser ablegen
* Andere Bookmarks aus diesem Script im Browser ablegen
* SSH
* Git
* Node installieren
* Wrangler installieren
  - `npm install -g @cloudflare/wrangler`
  - Wrangler per `wrangler login` konfigurieren
* IDE installieren

### Vor jedem Talk zurücksetzen:

* IDE -> alte Overrides löschen
* IDE -> alle Tabs schließen
* IDE -> `overrides`-Ordner zuklappen
* IDE -> `worker`-Ordner zuklappen
* IDE -> Terminal schließen 
* Devtools -> Sources -> Overrides -> entfernen
* Devtools -> Sources -> Close all
* Devtools -> Performance -> Panel leeren
* Devtools -> Lighthouse -> Panel leeren
* Devtools -> Network Request Blocking -> leeren
* Devtools -> alle Tab unten schließen
* Devtools -> Network -> Einstellungsrädchen -> "use large request rows" ausstellen
* Auf [www.duesseldorf.de](https://www.duesseldorf.de) gehen und Slider abschalten
* Initialen Worker per `wrangler publish` publizieren

## Intro

Manchmal möchte man seine Ideen gerne prototypen, ohne dafür an den eigentlichen Code ranzugehen:

* weil man im Rahmen einer Kundenakquise Schätzungen über zukünftige Performance-Zugewinne machen möchte,
* weil man noch keinen Zugang zum Server hat, man aber dennoch schon losforschen möchte,
* weil der Kunde über kein separates oder nur ein unzureichendes Testsystem verfügt,
* weil die Deployment-Zyklen für schnelles Iterieren zu langsam sind
* und manchmal auch, weil es schlicht und ergreifend Spaß macht. 

Im Vorlauf des Talk zeige ich Euch 2 Arten, wie man an bestehenden Seiten herum-prototypen kann:

* Einmal direkt in den Chrome Devtools
* Einmal in der Cloud mit Hilfe der sogenannten "CloudFlare Workers"

Außerdem zeige ich auch einige weitere, bei der Performance-Optmierung sehr hilfreich Chrome Devtools Werkzeuge.

Alles, was wir machen, alle Tools und alle Link sind in [einem Script notiert](https://github.com/Schepp/prototyping-for-performance/blob/master/SCRIPT.md), das ich hinterher mit Euch teile.

IHR MÜSST ALSO NICHTS NOTIEREN !!!

## Erster Eindruck der Webseite + Analyse

* [https://www.duesseldorf.de/](https://www.duesseldorf.de/)
* Devtools -> Lighthouse-Test durchführen -> 25-40
* Ein tolles Werkzeug: [Webpagetest](https://webpagetest.org) 
  - "Test Location": "Frankfurt"
  - "Advanced Settings" ausklappen
  - Tab "Test Settings" -> "Connection" auf "3G Fast"
  - Tab "Chromium" -> "Capture Lighthouse Report" anhaken + "Emulate Mobile Browser" auf "Motorola G"
* [Webpagetest Ergebnis](https://webpagetest.org/result/210123_DiJ7_de61d49178f82fafce917d1cf98797ed/)
* Erkenntnisse:
  - Nur HTTP/1.1, kein HTTP/2, erkennbar an mehreren TCP-Connects zu www.duesseldorf.de
  - Riesen CSS (grün)
  - Viele JavaScript Ressourcen (weiter unten, gelb)
  - Katastrophales Rating oben für "Compress Transfer", nämlich "F"
* Devtools -> Network -> Einstellungsrädchen -> "use large request rows" anhaken
  - Erkenntnis: Keine Dateikompression

## Chrome Devtools Source Overrides vorstellen

* Devtools -> Sources -> Overrides -> "+ Select folder for overrides"
* Ordner "overrides" als Zielordner auswählen
* Sicherheitsnachfrage bestätigen
* Devtools -> Sources -> Page -> rechter Mausklick -> "Save for Overrides" 
* In das HTML ein `alert()` editieren -> Speichern per `Strg` + `S`
* Seite neu laden und zeigen, dass jetzt ein Alert erscheint
* Das `alert()` wieder entfernen
  
## First Contentful Paint (FCP) angehen

* [Webpagetest Ergebnis](https://webpagetest.org/result/210123_DiJ7_de61d49178f82fafce917d1cf98797ed/)
  - Erkennntnis: Start Render beginnt, wenn CSS da ist
* Devtools -> rechts oben auf ⁝ -> More Tools -> Coverage -> nach `css` filtern -> Seite neu laden -> `CSS` ist zu 90% ungenutzt
* Wenn CSS kleiner wäre und schneller geladen, dann profitiert auch FCP
* Wir wenden die Technik des ["Critical CSS"](https://web.dev/extract-critical-css/) an
* In die Console wechseln  
* [Critical CSS Boomarklet](https://github.com/DirkPersky/criticalcss) benutzen
* Kritisches CSS aus der Konsole kopieren und ins HTML per `<style>`-Element inlinen
* Bisheriges CSS lazy ladend machen, und zwar wie von der [Filament Group](https://www.filamentgroup.com/lab/load-css-simpler/) beschrieben
* Bisheriges CSS per [`<link rel="preload">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content) preloaden
* Neuer Lighthouse Test -> FCP und LCP gehen runter, Gesamtscore geht hoch

## Nachteil der Chrome Devtools

* Optimierungen bestehen nur für die aktuelle bearbeitete Seite.  
  Klickt man sich zur nächsten Seite weiter, verliert man die HTML-Optimierungen.
* Man kann seine Optimierungen nur herzeigen, indem man den eigenen Bildschirm teilt.
* Man kann keine externen Tools, z.B. Webpagetest zur Messung heranziehen
* Und schließlich: Lokal hat man keine Datei-Kompression

## Enter CloudFlare Workers

* [https://workers.cloudflare.com/](https://workers.cloudflare.com/)
* Eine Art "Service Worker", aber nicht im Browser, sondern in der Cloud
* Wie ein Service Worker nichts anderes als ein intelligenter Proxy
* API lässt auch ähnlich [wie ein Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent) programmieren (Verweis auf vorherigen Vortrag)
* PLUS: Man kann Inhalte "on-the-fly" umschreiben (dazu gleich mehr)

### Was brauche ich?

* Einen CloudFlare Account
* Das CloudFlare Workers Paket für $5 pro Monat
* Node
* Wrangler
  - `npm install -g @cloudflare/wrangler`
  - Wrangler per `wrangler login` konfigurieren

### Boilerplate

* Ordner [`worker/0-base`](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/0-base) aufklappen
* Minimale Bestandteile eines CloudFlare Workers:
  - [wrangler.toml](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/0-base/wrangler.toml) (zeigen)
  - [package.json](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/0-base/package.json) (zeigen)
  - [index.js](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/0-base/index.js) (zeigen)
* Generieren dieser Dateien auch möglich per `wrangler generate --type webpack my-worker` (das `my-worker` kann frei gewählt werden)
* In die `wrangler.toml` muss die Account ID eingetragen werden, zu finden im [CloudFlare Dashboard](https://dash.cloudflare.com/) unter "Worker" (rechts)
* Terminal öffnen und ebenfalls in den Ordner `worker/0-base` wechseln
* Lokales Entwickeln und Testen per `wrangler dev` (mit Log)
* [http://127.0.0.1:8787/](http://127.0.0.1:8787/) öffnen
* Publizieren per `wrangler publish`
* [https://duesseldorf.schepp.workers.dev/](https://duesseldorf.schepp.workers.dev/) öffnen

**Vorteile:**

* Extern vorzeigbar
* Extern Messbar
* Seite kann gesurft werden
* Von Haus aus [HTTP/2](https://schepp.github.io/HTTP-2/) 
* Von Haus aus [Brotli-Kompression](https://de.wikipedia.org/wiki/Brotli) (CSS: 477KB -> 59KB, JS: 1.1MB -> 425KB)
* Lighthouse Test -> HTTP/2 und Brotli-Kompression bringen schon für sich alleine viel!

## CloudFlare's HTMLRewriter

* [HTMLRewriter](https://blog.cloudflare.com/introducing-htmlrewriter/)
* Ordner [`worker/1-fcp`](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/1-fcp) aufklappen
* [index.js](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/1-fcp/index.js) zeigen
* [Schreibt HTML Streams on-the-fly um](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter)
* Durchforstet das HTML per [CSS-Selektoren](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter#selectors) (allerdings nicht alle Selektoren von CSS nutzbar)
* Das Umschreiben passiert in einer Klasse, in deren `element()`- Methode
* Elemente können darin ähnlich wie das DOM manipuliert werden (z.B. `el.setAttribute()`)
* Im Terminal in den Ordner `worker/1-fcp` wechseln
* Publizieren per `wrangler publish`
* Geänderten Quelltext per `view-source://` zeigen
* Neuer Lighthouse Test -> FCP und LCP gehen runter, Gesamtscore geht hoch

## Chrome Devtools Overrides: Layout Shift (LS) des Sliders reparieren

* Devtools -> rechts oben auf ⁝ -> More Tools -> Rendering -> "Layout Shift Regions" aktivieren
* Nur erstes Bild anzeigen, bis der Slider initialisiert ist:

```
.slider_header_start ~ .slider_header_start {
  display: none;
}
.bx-wrapper .slider_header_start ~ .slider_header_start {
  display: block;
}
```

* Slider-Höhe korrigieren:

```
#stage-innerwrap {
  height: auto !important;
}
```

* Bild-Dimensionen voreinstellen:

```
.slider-item-img {
  width: 100%;
  height: auto;
  aspect-ratio: 98 / 46;
  object-fit: cover;
}
```

* Neuer Lighthouse Test -> CLS geht runter

## Layout Shift Reparatur im CloudFlare HTMLRewriter

* Ordner [`worker/2-cls`](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/2-cls) aufklappen
* [index.js](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/2-cls/index.js) zeigen
* Minimalen Änderungen zeigen 
* Im Terminal in den Ordner `worker/2-cls` wechseln
* Publizieren per `wrangler publish`
* Neuer Lighthouse Test -> FCP und LCP gehen runter, Gesamtscore geht hoch

## Chrome Devtools Overrides: Scripte optimieren

* Devtools -> Network -> Js -> `vis.js` und `moment.js` sind riesig
* Devtools -> rechts oben auf ⁝ -> More Tools -> Coverage -> nach `js` filtern -> Seite neu laden -> `vis.js` ist zu 85% ungenutzt
* Devtools -> rechts oben auf ⁝ -> More Tools -> Network Request Blocking -> `vis.js` blockieren -> kein Fehler
* Zum Testen `moment.js`-URL blockieren -> Fehler bei `clndr.js` und `calendar.js`
* Script-Sammler in die Console packen:

```
Promise.all(
  Array.from(document.querySelectorAll('script[src^="/typo3conf/ext"]'))
    .filter(el =>
      !el.src.includes('vis.min')
    )
    .map(el =>
      fetch(el.src).then(response => response.text())
    )
).then(contents => {
  console.log(
    contents.join('\r\n')
  );
});
```

* Holt sich die Inhalte aller JavaScripts, außer der `vis.min.js`
* Ergebnis in eine `scripts.js` speichern
* Alle bisherigen Scripte entfernen
* Stattdessen `scripts.js` mit `defer`einbinden
  - `defer` -> JavaScript kann in separatem CPU-Thread geparsed werden

* Neuer Lighthouse Test -> Total Blocking Time (TBT) macht einen riesen Sprung, TTI auch

## Scripte zusammenfassen im CloudFlare HTMLRewriter

* Ordner [`worker/3-tbt`](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/3-tbt) aufklappen
* [index.js](https://github.com/Schepp/prototyping-for-performance/blob/master/worker/3-tbt/index.js) zeigen
* Minimalen Änderungen zeigen
* Im Terminal in den Ordner `worker/3-tbt` wechseln
* Publizieren per `wrangler publish`
* Neuer Lighthouse Test -> TBT geht runter, Gesamtscore geht hoch

## Finales Ergebnis:

[Webpagetest Bulk-Testing](https://webpagetest.org/?bulk=1) durchführen für...
[Pagespeed.compare](https://pagespeed.compare/) durchführen für... 

* https://www.duesseldorf.de/ 
* https://duesseldorf.schepp.workers.dev/

[Das Ergebnis für Webpagetest](https://webpagetest.org/video/compare.php?tests=210207_DiAS_c559aba8cedd5f7711606ddda46e7b02,210207_DiS5_6744528b4ce18b5f672041e8404e6a0a)
[Videovergleich](https://webpagetest.org/video/view.php?end=full&tests=210207_DiAS_c559aba8cedd5f7711606ddda46e7b02%2C210207_DiS5_6744528b4ce18b5f672041e8404e6a0a&bg=000000&text=ffffff&loc=Frankfurt%2C+Germany+-+EC2+-+Chrome+-+Emulated+Motorola+G+%28gen+4%29+-+3GFast)

Abschließend will ich noch darauf hinweisen, dass die CloudFlare Worker sich auch als dauerhafte Schicht vor eine Webseite 
ziehen lassen, was dann sehr praktisch ist, wenn man es mit einem eher "schwierigen" CMS zu tun hat, welches wenig Anpassungen
in seinem HTML zulässt.