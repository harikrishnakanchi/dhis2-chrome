self.addEventListener('fetch', function (event) {
    if (event.request.method === 'HEAD') {
        //To catch favicon call
        var options = {
            mode: "no-cors",
            method: "HEAD"
        };
        var urlToFetch = event.request.url;
        var request = new Request(urlToFetch, options);
        event.respondWith(fetch(request).then(function () {
            return new Response();
        }));
    }
});