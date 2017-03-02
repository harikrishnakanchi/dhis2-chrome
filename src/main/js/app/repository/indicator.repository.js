define(['lodash'], function (_) {
    return function (db) {
        var store = db.objectStore('indicators');

        this.getAll = function () {
            return store.getAll();
        };

        this.enrichWithIndicatorDetails = function (indicators) {
            return this.getAll().then(function (indicatorsFromStore) {
                var indexedIndicatorsFromStore = _.indexBy(indicatorsFromStore, 'id');
                return _.map(indicators, function (indicator) {
                    return _.merge(indicator, _.pick(indexedIndicatorsFromStore[indicator.id], ['name', 'shortName', 'description', 'numerator', 'denominator', 'translations']));
                });
            });
        };
    };
});