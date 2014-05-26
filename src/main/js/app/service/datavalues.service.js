define([], function() {
    return function(dataService, dataRepository, dataSetRepository, userPreferenceRepository, $q) {
        this.sync = function() {
            var dataValues = [];
            var getAllDataValues = function(vals) {
                var orgUnitIds = vals[0];
                var allDataSets = vals[1];
                return orgUnitIds.length > 0 && allDataSets.length > 0 ? dataService.downloadAllData(orgUnitIds, allDataSets) : [];
            };

            var saveAllDataValues = function(data) {
                console.debug("Storing data values : ", data);
                return dataRepository.save(data);
            };

            var getAllOrgUnits = function() {
                return userPreferenceRepository.getAll().then(function(userPreferences) {
                    userPreferences = userPreferences || [];
                    return _.map(_.flatten(_.map(userPreferences, "orgUnits")), function(o) {
                        return o.id;
                    });
                });
            };

            return $q.all([getAllOrgUnits(), dataSetRepository.getAll()]).then(getAllDataValues).then(saveAllDataValues);
        };
    };
});