define([], function() {
    return function() {
        return {
            scope: {
                table: "=",
                resourceBundle:"=",
                disableDownload: "@?",
                updatedTime:"@?"
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot-table/pivot.table.html"
        };
    };
});
