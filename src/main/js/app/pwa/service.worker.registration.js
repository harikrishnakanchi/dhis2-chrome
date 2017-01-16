(function (global) {
    var addCss = function (href) {
        var link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        document.head.appendChild(link);
    };

    var addRequireJsTag = function () {
        var script = document.createElement('script');
        script.src = 'js/lib/requirejs/require.js';
        script.dataset.main = 'js/app/pwa/pwa.app.bootstrap.js';
        script.onload = function () {
        };
        document.head.appendChild(script);
        document.getElementById('loadingPraxis').style.display = 'none';
    };

    var loadApp = function () {
        addRequireJsTag();
        addCss('css/main.css');
        addCss('js/lib/nvd3/nv.d3.min.css');
    };

    var showPraxisDownloadError = function () {
        global.document.getElementById('loadingPraxisMsg').style.display = 'none';
        global.document.getElementById('loadingPraxisError').style.display = 'block';
    };

    var registerServiceWorker = function () {
        var retryServiceWorkerDownload = function () {
            var failCount = window.sessionStorage.getItem("serviceWorkerFailCount") || 0;
            if (failCount < 3 && global.navigator.onLine) {
                failCount = parseInt(failCount) + 1;
                window.sessionStorage.setItem("serviceWorkerFailCount", failCount);
                console.log("Retrying serviceWorker install for ", failCount);
                registerServiceWorker();
            }
            else {
                showPraxisDownloadError();
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service.worker.js')
                .then(function (registration) {
                    if (registration.active) {
                        loadApp();
                    }
                    registration.onupdatefound = function () {
                        var installingWorker = registration.installing;

                        installingWorker.onstatechange = function () {
                            switch (installingWorker.state) {
                                case 'installed':
                                    if (navigator.serviceWorker.controller) {
                                        console.log('New or updated content is available.');
                                    } else {
                                        console.log('Content is now available offline!');
                                        loadApp();
                                    }
                                    break;

                                case 'redundant':
                                    if (!navigator.serviceWorker.controller) {
                                        retryServiceWorkerDownload();
                                    }
                                    break;
                            }
                        };
                    };
                }).catch(function (e) {
                console.error('Error during service worker registration:', e);
                retryServiceWorkerDownload();
            });
        }
        else {
            console.log("serviceWorker is not supported in this browser.");
        }
    };

    var reload = function () {
        global.sessionStorage.setItem("serviceWorkerFailCount", 0);
        global.document.getElementById('loadingPraxisMsg').style.display = 'block';
        global.document.getElementById('loadingPraxisError').style.display = 'none';
        global.location.reload();
    };

    global.Praxis = {
        reload: reload,
        initialize: registerServiceWorker
    };
})(window);

Praxis.initialize();
