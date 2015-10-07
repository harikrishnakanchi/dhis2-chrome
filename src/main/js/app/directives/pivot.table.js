define(["lodash", "moment"], function(_, moment) {
    return function() {
        return {
            scope: {
                data: "=",
                definition: "=",
                exportButtonName: "="
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot.table.html"
        };
    };
});
