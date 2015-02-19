define(["lodash", "datasetTransformer", "moment"], function(_, datasetTransformer, moment) {
    return function(db, $q) {
        var get = function(datasetId) {
            var store = db.objectStore("dataSets");
            return store.find(datasetId);
        };

        var findAll = function(datasetIds) {
            var store = db.objectStore("dataSets");
            var query = db.queryBuilder().$in(datasetIds).compile();
            return store.each(query);
        };

        var getEnriched = function(datasets, excludedDataElements) {
            var getEntitiesFromDb = function(storeName) {
                var store = db.objectStore(storeName);
                return store.getAll();
            };

            var sectionPromise = getEntitiesFromDb("sections");
            var dataElementsPromise = getEntitiesFromDb("dataElements");

            return $q.all([sectionPromise, dataElementsPromise]).then(function(data) {
                var sections = data[0];
                var dataElements = data[1];
                return datasetTransformer.enrichDatasets(datasets, sections, dataElements, excludedDataElements);
            });
        };

        var getAll = function(rejectLinelistTypeDataSets) {
            var getBooleanAttributeValue = function(attributes, attributeCode) {
                var attr = _.find(attributes, {
                    "attribute": {
                        "code": attributeCode
                    }
                });
                return attr && attr.value === "true";
            };

            var filterNewDatasets = function(datasets) {
                return _.filter(datasets, function(ds) {
                    return getBooleanAttributeValue(ds.attributeValues, "isNewDataModel");
                });
            };

            var rejectLineListDatasets = function(datasets) {
                return _.reject(datasets, function(ds) {
                    return getBooleanAttributeValue(ds.attributeValues, "isLineListService");
                });
            };

            var store = db.objectStore("dataSets");
            return store.getAll().then(function(all) {
                var filtered = filterNewDatasets(all);
                if (rejectLinelistTypeDataSets) {
                    filtered = rejectLineListDatasets(filtered);
                }
                return filtered;
            });
        };

        var getAllDatasetIds = function() {
            return getAll().then(function(data) {
                return _.pluck(data, "id");
            });
        };

        var getAllForOrgUnit = function(orgUnitId) {
            var store = db.objectStore("dataSets");
            var query = db.queryBuilder().$eq(orgUnitId).$index("by_organisationUnit").compile();
            return store.each(query);
        };

        var extractOrgUnitIdsForIndexing = function(dataSets) {
            return _.map(dataSets, function(ds) {
                ds.orgUnitIds = _.pluck(ds.organisationUnits, "id");
                return ds;
            });
        };

        var upsert = function(payload) {
            var dataSets = !_.isArray(payload) ? [payload] : payload;

            dataSets = _.map(dataSets, function(ds) {
                ds.clientLastUpdated = moment().toISOString();
                return ds;
            });

            dataSets = extractOrgUnitIdsForIndexing(dataSets);
            var store = db.objectStore("dataSets");
            return store.upsert(dataSets).then(function() {
                return dataSets;
            });
        };

        var upsertDhisDownloadedData = function(payload) {
            var dataSets = !_.isArray(payload) ? [payload] : payload;
            dataSets = extractOrgUnitIdsForIndexing(dataSets);
            var store = db.objectStore("dataSets");
            return store.upsert(dataSets).then(function() {
                return dataSets;
            });
        };

        return {
            "get": get,
            "findAll": findAll,
            "upsertDhisDownloadedData": upsertDhisDownloadedData,
            "getAll": getAll,
            "getAllDatasetIds": getAllDatasetIds,
            "upsert": upsert,
            "getAllForOrgUnit": getAllForOrgUnit,
            "getEnriched": getEnriched
        };
    };
});
