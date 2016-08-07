define(["lodash"], function (_) {
    return function ($location) {
        var history = [];

        this.pushState = function (searchState) {
            var path = $location.path();
            var search = $location.search();
            history.push({
                path: path,
                search: _.assign({}, search, searchState)
            });
        };

        this.back = function () {
            var previousState = history.pop();
            if (!previousState)
                return;
            $location.path(previousState.path).search(previousState.search);
        };
    };
});