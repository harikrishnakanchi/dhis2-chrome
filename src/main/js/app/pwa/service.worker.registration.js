(function (global) {
    var serviceWorkerRegistration;

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

    var setLoadingMessage = function (message) {
        document.getElementById('praxisMsg').innerHTML = message;
    };

    var showPraxisDownloadError = function () {
        global.document.getElementById('loadingPraxisMsg').style.display = 'none';
        global.document.getElementById('loadingPraxisError').style.display = 'block';
    };

    var showMultipleTabsOpenMessage = function () {
        global.document.getElementById('loadingPraxisMsg').style.display = 'none';
        global.document.getElementById('multipleTabsOpen').style.display = 'block';
    };

    var focusActiveTab = function () {
        global.document.getElementById('multipleTabsOpen').style.display = 'none';
        global.document.getElementById('focusActiveTab').style.display = 'none';
        global.document.getElementById('supportMessage').style.display = 'block';
        sendMessage('focusActiveTab');
    };

    var registerMessageCallback = function (messageType, callback) {
        return function (event) {
            if (event.data.type === messageType)
                callback(event.data.data);
        };
    };

    var addListener = function (type, callback) {
        navigator.serviceWorker.addEventListener('message', registerMessageCallback(type, callback));
    };

    var sendMessage = function (type, data) {
        serviceWorkerRegistration.active.postMessage({type: type, data: data});
    };

    var checkForMultipleClients = function (registration) {
        serviceWorkerRegistration = registration;
        if (serviceWorkerRegistration.active) {
            sendMessage('checkForMultipleClients');

            return new Promise(function (resolve, reject) {
                addListener('checkForMultipleClients', function (multipleTabsAreOpen) {
                    if (!multipleTabsAreOpen) {

                        loadApp();

                        addListener('focusActiveTab', function () {
                            var message, locale = angular.element(document.getElementById('praxis')).scope().locale;

                            message = (locale == 'en' || locale == 'ar') ?
                                'Praxis is active here. Please close any other open tabs/window' :
                                'Praxis est ouvert ici. Merci de fermer tout autre onglet/page.';

                            global.alert(message);
                        });

                        resolve(registration);
                    } else {
                        reject('multipleTabsAreOpen');
                    }
                });
            });
        } else {
            return registration;
        }
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

        var serviceWorkerStateObserver = function (serviceWorker) {
            if (serviceWorker && !serviceWorker.onstatechange) {
                serviceWorker.onstatechange = function () {
                    switch (serviceWorker.state) {
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
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service.worker.js')
                .then(checkForMultipleClients)
                .then(function (registration) {
                    serviceWorkerStateObserver(registration.installing);

                    registration.onupdatefound = function () {
                        serviceWorkerStateObserver(registration.installing);
                    };

                }).catch(function (e) {
                if (e == 'multipleTabsAreOpen') {
                    showMultipleTabsOpenMessage();
                } else {
                    console.error('Error during service worker registration:', e);
                    retryServiceWorkerDownload();
                }
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
        registerServiceWorker();
    };

    var updateServiceWorker = function () {
        serviceWorkerRegistration.update();
    };

    var initialize = function () {
        setTimeout(function () {
            if (navigator.serviceWorker.controller) {
                setLoadingMessage("Initializing Praxis");
            }
            registerServiceWorker();
        }, 0);
    };

    global.Praxis = {
        reload: reload,
        focusActiveTab: focusActiveTab,
        initialize: initialize,
        update: updateServiceWorker
    };
})(window);

Praxis.initialize();
