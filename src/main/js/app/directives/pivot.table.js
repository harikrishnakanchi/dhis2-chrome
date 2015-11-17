define([], function() {
    return function() {
        return {
            scope: {
                data: "=",
                definition: "="
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot.table.html"
        };
    };
});
