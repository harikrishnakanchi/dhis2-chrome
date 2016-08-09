define([], function() {
    return function($filter) {
        return {
            scope: {
                data: "=",
                definition: "=",
                resourceBundle:"=",
                disableDownload: "@?",
                orderOfItems:"=?",
                updatedTime:"@?"
            },
            link: function(scope, element, attrs) {
                if(attrs.orderOfItems) {
                    scope.$watch('orderBySortKeys', function (newVal) {
                        scope.orderOfItems = _.map($filter('orderBy')(scope.viewMap, newVal), function (dataDimensionItem) {
                            return dataDimensionItem.dataElement;
                        });
                    });
                }
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot-table/pivot.table.html"
        };
    };
});
