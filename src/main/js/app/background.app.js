define(["angular", "Q", "hustleInit", "angular-indexedDB"],
    function(angular, Q, hustleInit) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB"]);
            // services.init(app);
            // hustleInit.init();

            app.config(['$indexedDBProvider',
                function($indexedDBProvider) {
                    $indexedDBProvider.connection('msf');
                }
            ]);
            return app;
        };

        var bootstrap = function(app) {
            var deferred = Q.defer();
            var injector = angular.bootstrap(angular.element(document.querySelector('#dhis2')), ['DHIS2']);
            deferred.resolve([injector, app]);
            console.debug("bootstrapping background app");
            return deferred.promise;
        };

        return {
            init: init,
            bootstrap: bootstrap
        };
    });