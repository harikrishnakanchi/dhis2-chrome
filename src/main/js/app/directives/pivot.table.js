define([], function() {
    return function() {
        return {
            scope: {
                table: "=",
                resourceBundle:"=",
                disableDownload: "@?",
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot-table/pivot.table.html"
        };
    };
});
