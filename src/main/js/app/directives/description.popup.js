define([], function() {
    return function($modal, $rootScope) {
        return {
            scope: {
                title: '@dpTitle',
                description: '@dpDesc',
            },
            link: function(scope, element) {
                angular.element(element).bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    scope.resourceBundle = $rootScope.resourceBundle;
                    var description = scope.description ? scope.description : scope.resourceBundle.noDescriptionLabel;
                    scope.notificationMessages = {
                        notificationTitle: scope.title,
                        notificationMessage: description
                    };
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