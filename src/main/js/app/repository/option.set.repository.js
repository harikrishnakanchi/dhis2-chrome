define(['lodash'], function(_) {
    return function(db, referralLocationsRepository) {

        this.getAll = function() {
            var store = db.objectStore("optionSets");
            return store.getAll();
        };

        this.getOptionSetMapping = function(resourceBundle, moduleId, rejectDisabled) {
            var referralLocations;

            var buildMapForReferralOptionSet = function(optionSet, optionMapping, optionSetMapping, options) {
                options = _.filter(optionSet.options, function(ops) {
                    if (!rejectDisabled)
                        return !_.isUndefined(referralLocations[ops.name]);
                    else
                        return !_.isUndefined(referralLocations[ops.name]) && !referralLocations[ops.name].isDisabled;
                });
                _.each(options, function(o) {
                    o.displayName = resourceBundle[o.id] || referralLocations[o.name].name;
                    optionMapping[o.id] = referralLocations[o.name].name;
                });
                optionSetMapping[optionSet.id] = _.map(options, function(option) {
                    option.isDisabled = referralLocations[option.name].isDisabled;
                    option.name = referralLocations[option.name].name;
                    return option;
                });
                optionSetMapping[optionSet.id] = _.sortBy(options, 'name');
            };

            var createMaps = function() {
                var store = db.objectStore("optionSets");
                return store.getAll().then(function(optionSets) {
                    var optionSetMapping = {};
                    var optionMapping = {};
                    _.forEach(optionSets, function(optionSet) {
                        var options;
                        if (_.endsWith(optionSet.code, "_referralLocations") && !_.isUndefined(referralLocations)) {
                            buildMapForReferralOptionSet(optionSet, optionMapping, optionSetMapping, options);
                        } else {
                            options = _.compact(optionSet.options);
                            _.each(options, function(o) {
                                o.displayName = resourceBundle[o.id] || o.name;
                                optionMapping[o.id] = o.displayName;
                            });
                            optionSetMapping[optionSet.id] = _.sortBy(options, 'name');
                        }

                    });

                    return {
                        'optionSetMap': optionSetMapping,
                        'optionMap': optionMapping
                    };
                });
            };

            return referralLocationsRepository.get(moduleId).then(function(data) {
                referralLocations = data;
                return createMaps();
            });
        };

    };
});
