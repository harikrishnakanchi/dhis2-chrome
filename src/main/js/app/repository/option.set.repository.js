define(['lodash'], function(_) {
    return function(db) {

        this.getAll = function() {
            var store = db.objectStore("optionSets");
            return store.getAll();
        };

        this.getOptionSetMapping = function(resourceBundle) {
            var store = db.objectStore("optionSets");
            return store.getAll().then(function(optionSets) {
                var optionSetMapping = {};
                var optionMapping = {};
                _.forEach(optionSets, function(optionSet) {
                    var options = _.compact(optionSet.options);
                    _.each(options, function(o) {
                        o.displayName = resourceBundle[o.id] || o.name;
                        optionMapping[o.id] = o.displayName;
                    });
                    optionSetMapping[optionSet.id] = _.sortBy(options, 'name');
                });

                return {
                    'optionSetMap': optionSetMapping,
                    'optionMap': optionMapping
                };
            });
        };

    };
});
