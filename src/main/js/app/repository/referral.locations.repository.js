define(["lodash"], function(_) {
    return function(db, $q, datasetRepository) {
        var storeName = "referralLocations";

        var upsert = function(payload){
            var store = db.objectStore(storeName);
            return store.upsert(payload);
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
                if (!referralLocations) {
                    return $q.when([]);
                }
                var getReferralLocationDataSet = function () {
                    var filterReferralLocationDataSets = function (dataSets) {
                        return _.filter(dataSets, {isReferralDataset: true});
                    };
                    return datasetRepository.getAll().then(filterReferralLocationDataSets);
                };

                var getReferralLocationDataELements = function (referralLocationDataSets) {
                    return datasetRepository.includeDataElements(referralLocationDataSets, []).then(function (dataSetIncludedWithDataElements) {
                        return _.flatten(_.map(_.flatten(_.map(dataSetIncludedWithDataElements, 'sections')), 'dataElements'));
                    });
                };

                var mapReferralLocationsWithDataElementIds = function (referralLocationDataElements) {
                    return _.transform(referralLocationDataElements, function (referralLocationsWithIds, referralLocationDataElement) {
                        var referralLocationObject = referralLocations[referralLocationDataElement.formName];
                        if (referralLocationObject) {
                            referralLocationsWithIds.push({
                                id: referralLocationDataElement.id,
                                name: referralLocationObject.name,
                                isDisabled: referralLocationObject.isDisabled
                            });
                        }
                    }, []);
                };

                var getEnrichedReferralLocations = function (referralLocationsWithIds) {
                    return {
                        orgUnit: referralLocations.orgUnit,
                        clientLastUpdated: referralLocations.clientLastUpdated,
                        referralLocations: referralLocationsWithIds
                    };
                };

                return getReferralLocationDataSet()
                    .then(getReferralLocationDataELements)
                    .then(mapReferralLocationsWithDataElementIds)
                    .then(getEnrichedReferralLocations);
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