define(['lodash', 'optionSetTransformer'], function(_, optionSetTransformer) {
    return function(db, $q, referralLocationsRepository, excludedLineListOptionsRepository) {
        var self = this;

        this.getAll = function() {
            var store = db.objectStore("optionSets");
            return store.getAll();
        };

        this.getOptionSets = function(moduleId) {
            var getAllParameters = function () {
                return $q.all({
                    optionSets: self.getAll(),
                    referralLocations: referralLocationsRepository.get(moduleId),
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
