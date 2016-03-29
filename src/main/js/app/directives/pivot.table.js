define([], function() {
    return function() {
        return {
            scope: {
                data: "=",
                definition: "=",
                showWeeks: "@",
                resourceBundle:"=",
                showDownload: "=?",
                dataDimensionItems:"=?orderOfItems"
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot-table/pivot.table.html"
        };
    };
});
