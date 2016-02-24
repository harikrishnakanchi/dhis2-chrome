define([], function() {
    return function() {
        return {
            scope: {
                data: "=",
                definition: "=",
                showWeeks: "@"
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot-table/pivot.table.html"
        };
    };
});
