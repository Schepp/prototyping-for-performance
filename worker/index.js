
async function handleRequest(request) {
  const url = new URL(request.url);
  const originUrl = url.protocol + '//www.duesseldorf.de' + url.pathname + url.search;
  const proxiedRequest = new Request(originUrl, request);

  return await fetch(proxiedRequest);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});
