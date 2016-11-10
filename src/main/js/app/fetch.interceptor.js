self.addEventListener('fetch', function (event) {
    if (event.request.method === 'HEAD') {
        console.log("from fetch::", event.request.url);
        event.respondWith(fetch(event.request.url, {
            mode: 'no-cors'
        }));
    }
});