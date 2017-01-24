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

self.addEventListener('message', function (event) {
    switch (event.data.type) {
        case 'checkForMultipleClients':
            self.clients.matchAll({type: 'window'}).then(function (clients) {
                clients.forEach(function (client) {
                    client.postMessage({
                        type: 'checkForMultipleClients',
                        data: clients.length > 1
                    });
                });
            });
            break;

        case 'focusActiveTab':
            self.clients.matchAll({type: 'window'}).then(function (clients) {
                clients.forEach(function (client) {
                    client.postMessage({ type: 'focusActiveTab' });
                });
            });
            break;
    }
});