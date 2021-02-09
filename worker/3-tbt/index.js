import criticalcss from './critical.css';

class StylesheetHandler {
  element(el) {
    const href = el.getAttribute('href');

    el.before(`<style>${criticalcss}</style>`, { html: true });
    el.before(`<style>
      .slider_header_start ~ .slider_header_start {
        display: none;
      }
      .bx-wrapper .slider_header_start ~ .slider_header_start {
        display: block;
      }
      #stage-innerwrap {
        height: auto !important;
      }
      .slider-item-img {
        width: 100%;
        height: auto;
        aspect-ratio: 98 / 46;
        object-fit: cover;
      }
    </style>`, { html: true });
    el.before(`<link rel="preload" as="style" href="${href}">`, { html: true });

    el.setAttribute('media', 'print');
    el.setAttribute('onload', `this.media='all'`);

    el.after(`<script src="scripts.js" defer></script>`, { html: true });
  }
}

class ImageHandler {
  element(el) {
    el.setAttribute('loading','lazy');
    el.setAttribute('decoding','async');
  }
}

class ScriptHandler {
  element(el) {
    el.remove();
  }
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const originUrl = 'https://www.duesseldorf.de' + url.pathname + url.search;
  const proxiedRequest = new Request(originUrl, request);
  const response = await fetch(proxiedRequest);

  if (request.url.includes('scripts.js')) {
    const originUrl = 'https://schepp.github.io/prototyping-for-performance/worker/3-tbt/scripts.js';
    const proxiedRequest = new Request(originUrl, request);
    return await fetch(proxiedRequest);
  }

  if (request.headers.get('accept').includes('text/html')) {
    return new HTMLRewriter()
      .on('link[rel="stylesheet"]', new StylesheetHandler())
      .on('script[src^="/typo3conf/ext/"]', new ScriptHandler())
      .on('img', new ImageHandler())
      .transform(response);
  }

  return response;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
