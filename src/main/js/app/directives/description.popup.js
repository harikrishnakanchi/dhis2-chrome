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
                    scope.notificationMessages = {
                        notificationTitle: scope.title,
                        notificationMessage: scope.description
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