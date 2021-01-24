
async function handleRequest(request) {
  const host = 'www.duesseldorf.de';
  const url = new URL(request.url);
  let originUrl = url.protocol + '//' + host + url.pathname + url.search;
  let cacheTtl;

  switch (true) {
    default:
      break;

    case request.url.includes('/fileadmin/_processed_/'):
    case request.url.includes('.js?'):
    case request.url.includes('.woff2'):
    case request.url.includes('.woff'):
      cacheTtl = 31536000;
      break;
  }

  const proxiedRequest = new Request(originUrl, request);
  return await fetch(proxiedRequest, {
    cf: {
      cacheTtl,
      cacheEverything: true,
      cacheKey: request.url
    },
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});
