define(["lodash", "moment"], function(_, moment) {
    return function() {
        return {
            scope: {
                data: "=",
                definition: "=",
                exportButtonName: "@",
                columnOneTitle: "@",
                columnTwoTitle: "@"
            },
            controller: 'pivotTableController',
            templateUrl: "templates/pivot.table.html"
        };
    };
});
