define(["lodash"], function(_) {
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
