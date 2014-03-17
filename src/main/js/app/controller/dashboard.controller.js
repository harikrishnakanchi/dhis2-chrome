define([], function() {
    return function($scope, db) {
        var store = db.objectStore("dataSets");
        $scope.headline = "DHIS2 Dashboard";
    };
});