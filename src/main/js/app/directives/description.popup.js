define([], function() {
    return function($modal, $rootScope) {
        return {
            scope: {
                title: '@dpTitle',
                description: '@dpDesc',
                resourceBundle: "="
            },
            link: function(scope, element) {
                angular.element(element).bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    var description = scope.description ? scope.description : scope.resourceBundle.noDescriptionLabel;
                    scope.notificationMessages = {
                        notificationTitle: scope.title,
                        notificationMessage: description
                    };
                    scope.layoutDirection = $rootScope.layoutDirection;

                    var modalInstance = $modal.open({
                        templateUrl: 'templates/notification-dialog.html',
                        controller: 'notificationDialogController',
                        scope: scope
                    });

                    modalInstance.result.then(function () {
                        console.log('modal closed');
                    });
                });
            }
        };
    };
});