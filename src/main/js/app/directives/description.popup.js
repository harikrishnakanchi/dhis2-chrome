define([], function() {
    return function($modal, $rootScope) {
        return {
            scope: {
                title: '@dpTitle',
                description: '@?dpDesc',
                multipleItemDescriptions: '=?dpMultipleDescriptions'
            },
            link: function(scope, element) {
                angular.element(element).bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    scope.resourceBundle = $rootScope.resourceBundle;
                    scope.layoutDirection = $rootScope.layoutDirection;

                    var modalInstance = $modal.open({
                        templateUrl: 'templates/description-dialog.html',
                        controller: 'notificationDialogController',
                        scope: scope,
                        windowClass: 'modal-lg'
                    });
                });
            }
        };
    };
});