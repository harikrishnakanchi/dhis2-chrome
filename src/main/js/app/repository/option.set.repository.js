define(['lodash', 'optionSetTransformer'], function(_, optionSetTransformer) {
    return function(db, $q, referralLocationsRepository, excludedLineListOptionsRepository) {
        var self = this;

        var enrichWithOptions = function (optionSets) {
            var optionStore = db.objectStore("options");
            return optionStore.getAll().then(function (options) {
                var indexedOptions = _.indexBy(options, 'id');
                return _.each(optionSets, function (optionSet) {
                    return _.map(optionSet.options, function (option) {
                        return _.merge(option, indexedOptions[option.id]);
                    });
                });
            });
        };

        this.getAll = function() {
            var optionSetStore = db.objectStore("optionSets");
            return optionSetStore.getAll().then(enrichWithOptions);
        };

        this.getOptionSets = function(opUnitId, moduleId) {
            var getAllParameters = function () {
                return $q.all({
                    optionSets: self.getAll(),
                    referralLocations: referralLocationsRepository.get(opUnitId),
                    excludedLineListOptions: excludedLineListOptionsRepository.get(moduleId)
                });
            };

            return getAllParameters().then(function (data) {
                var excludedOptions = _.get(data.excludedLineListOptions, 'dataElements', []);
                return optionSetTransformer.enrichOptionSets(data.optionSets, data.referralLocations, excludedOptions);
            });
        };

        this.getOptionSetByCode = function (optionSetCode) {
            return this.getAll().then(_.partial(_.find, _, {code: optionSetCode}));
        };
    };
});
