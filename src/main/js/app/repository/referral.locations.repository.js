define(["lodash"], function(_) {
    return function(db, $q, datasetRepository) {
        var storeName = "referralLocations";

        var upsert = function(payload){
            var store = db.objectStore(storeName);
            return store.upsert(payload);
        };

        var enrichReferralLocations =  function (referralLocations) {
            var getReferralLocationDataSet = function () {
                var filterReferralLocationDataSets = function(dataSets) {
                    return _.filter(dataSets, {isReferralDataset: true});
                };
                return datasetRepository.getAll().then(filterReferralLocationDataSets);
            };

            var getReferralLocationDataELements = function (referralLocationDataSets) {
                 return datasetRepository.includeDataElements(referralLocationDataSets, []).then(function (dataSetIncludedWithDataElements) {
                     var dataSetIncludedWithDataElement = _.first(dataSetIncludedWithDataElements),
                     sections = dataSetIncludedWithDataElement.sections;
                     return _.reduce(sections, function (referralLocationDataElements, section) {
                         return referralLocationDataElements.concat(section.dataElements);
                     }, []);
                 });
            };

            var mapReferralLocationsWithDataElementIds = function (referralLocationDataElements) {
                var referralLocationObjects = _.omit(referralLocations, 'orgUnit', 'clientLastUpdated', 'referralLocations');
                return _.map(referralLocationObjects, function (referralLocationObject, referralLocationDataElementName) {
                    var referralLocationDataElement = _.find(referralLocationDataElements, {formName: referralLocationDataElementName});
                    if (referralLocationDataElement) {
                        return {
                            id: referralLocationDataElement.id,
                            name: referralLocationObject.name,
                            isDisabled: referralLocationObject.isDisabled
                        };
                    }
                    return;
                });
            };

            var addMappedReferralLocationObjectsToOriginal = function (referralLocationObjects) {
                referralLocations = _.pick(referralLocations, 'orgUnit', 'clientLastUpdated');
                referralLocations.referralLocations = referralLocationObjects;
                return referralLocations;
            };

            return getReferralLocationDataSet()
                .then(getReferralLocationDataELements)
                .then(mapReferralLocationsWithDataElementIds)
                .then(addMappedReferralLocationObjectsToOriginal);
        };

        var get = function(opUnitId) {
            if (!opUnitId) return $q.when([]);
            var store = db.objectStore(storeName);
            return store.find(opUnitId);
        };

        var findAll = function(opUnitIds) {
            var store = db.objectStore(storeName);
            var query = db.queryBuilder().$in(opUnitIds).compile();
            return store.each(query);
        };

        var getWithId = function (opUnitId) {
            return get(opUnitId).then(function (referralLocations) {
                if (referralLocations) {
                    return enrichReferralLocations(referralLocations);
                }
            });

        };

        return {
            "get": get,
            "upsert": upsert,
            "findAll": findAll,
            "getWithId": getWithId
        };
    };
});