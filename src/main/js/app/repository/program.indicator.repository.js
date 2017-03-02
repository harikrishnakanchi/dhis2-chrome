define(['lodash'], function (_) {
    return function (db) {
        var store = db.objectStore('programIndicators');

        this.getAll = function () {
            return store.getAll();
        };

        this.enrichWithProgramIndicatorDetails = function (programIndicators) {
            return this.getAll().then(function (programIndicatorsFromStore) {
                var indexedProgramIndicatorsFromStore = _.indexBy(programIndicatorsFromStore, 'id');
                return _.map(programIndicators, function (programIndicator) {
                    return _.merge(programIndicator, _.pick(indexedProgramIndicatorsFromStore[programIndicator.id], ['name', 'shortName', 'description', 'translations']));
                });
            });
        };
    };
});