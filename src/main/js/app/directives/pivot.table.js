define([], function() {
    return function($filter) {
        return {
            scope: {
                data: "=",
                definition: "=",
                showWeeks: "@",
                resourceBundle:"=",
                showDownload: "=?",
                dataDimensionItems:"=?orderOfItems"
            },
            link: function(scope, element, attrs) {
                if(attrs.orderOfItems) {
                    scope.$watch('orderBySortKeys', function (newVal) {
                        scope.dataDimensionItems = _.map($filter('orderBy')(scope.viewMap, newVal), function (dataDimensionItem) {
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
