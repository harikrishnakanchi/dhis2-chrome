define(["lodash", "datasetTransformer", "moment"], function(_, datasetTransformer, moment) {
    return function(db, $q) {
        var get = function(datasetId) {
            var store = db.objectStore("dataSets");
            return store.find(datasetId);
        };

        var getEntitiesFromDb = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var getEnriched = function(datasetId) {
            var dataSetPromise = getEntitiesFromDb('dataSets');
            var sectionPromise = getEntitiesFromDb("sections");
            var dataElementsPromise = getEntitiesFromDb("dataElements");
            return $q.all([get(datasetId), sectionPromise, dataElementsPromise]).then(function(data) {
                if (_.isEmpty(data[0])) return undefined;
                return datasetTransformer.enrichDatasets([data[0]], data[1], data[2])[0];
            });
        };

        var getEnrichedDatasets = function(dataSets) {
            return $q.all(_.map(dataSets, function(ds) {
                return getEnriched(ds.id);
            }));
        };

        var getAll = function() {
            var store = db.objectStore("dataSets");
            var filtered = store.getAll().then(function(all) {
                return _.filter(all, function(ds) {
                    var attr = _.find(ds.attributeValues, {
                        "attribute": {
                            "code": 'isNewDataModel'
                        }
                    });
                    return attr && attr.value === 'true';
                });
            });
            return filtered;
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
            "upsertDhisDownloadedData": upsertDhisDownloadedData,
            "getAll": getAll,
            "getAllDatasetIds": getAllDatasetIds,
            "upsert": upsert,
            "getAllForOrgUnit": getAllForOrgUnit,
            "getEnriched": getEnriched,
            "getEnrichedDatasets": getEnrichedDatasets
        };
    };
});
