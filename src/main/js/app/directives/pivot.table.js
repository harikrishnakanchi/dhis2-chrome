define([], function() {
    return function() {
        return {
            scope: {
                data: "=",
                definition: "=",
                showWeeks: "@",
                resourceBundle:"=",
                showDownload: "=?"
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot-table/pivot.table.html"
        };
    };
});
