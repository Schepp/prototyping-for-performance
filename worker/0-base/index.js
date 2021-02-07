



async function handleRequest(request) {
  const url = new URL(request.url);
  const originUrl = 'https://www.duesseldorf.de' + url.pathname + url.search;
  const proxiedRequest = new Request(originUrl, request);
  const response = await fetch(proxiedRequest);

  return response;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
