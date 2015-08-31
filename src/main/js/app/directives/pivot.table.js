define([], function() {
    return function() {
        return {
            scope: {
                data: '='
            },
            controller: ['$scope',
                function($scope) {

                }
            ],
            templateUrl: 'templates/pivot.table.html'
        };
    };
});