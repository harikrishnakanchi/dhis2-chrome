define(["angular", "Q", "services", "hustleInit", "angular-indexedDB"],
    function(angular, Q, services, hustleInit) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB"]);
            services.init(app);
            // hustleInit.init();

            app.config(['$indexedDBProvider',
                function($indexedDBProvider) {
                    $indexedDBProvider.connection('msf');
                }
            ]);

            app.run(['dataService',
                function(dataService) {
                    dataService.downloadAllData("c484c99b86d");
                }
            ])

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