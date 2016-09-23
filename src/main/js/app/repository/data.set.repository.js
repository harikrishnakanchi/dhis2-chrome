define(["lodash", "dataSetTransformer", "moment"], function(_, dataSetTransformer, moment) {
    return function(db, $q) {
        var self = this;

        this.getAll = function() {
            var store = db.objectStore("dataSets");
            return store.getAll().then(function(dsFromDb) {
                dataSets = _.map(dsFromDb, dataSetTransformer.mapDatasetForView);
                dataSets = _.filter(dataSets, "isNewDataModel");
                return dataSets;
            });
        };
        
        this.findAllForOrgUnits = function(orgUnitIds) {
            var store = db.objectStore("dataSets");
            var query = db.queryBuilder().$in(orgUnitIds).$index("by_organisationUnit").compile();
            return store.each(query).then(function(dsFromDb) {
                dataSets = _.map(dsFromDb, dataSetTransformer.mapDatasetForView);
                dataSets = _.filter(dataSets, "isNewDataModel");
                dataSets = _.uniq(_.sortBy(dataSets, 'id'), true, 'id');
                return dataSets;
            });
        };

        var getDataElementGroups = function() {
            var groupStore = db.objectStore("dataElementGroups");
            return groupStore.getAll().then(function(dataElementGroups) {
                return _.filter(dataElementGroups, function(group) {
                    return _.endsWith(group.code, "module_creation");
                });
            });
        };

        this.includeDataElements = function(dataSets, excludedDataElements) {
            var sectionIds = _.pluck(_.flatten(_.pluck(dataSets, "sections")), "id");
            var store = db.objectStore("sections");
            var query = db.queryBuilder().$in(sectionIds).compile();
            var setupSections = function(dataElementGroups, sections) {
                var dataElementIds = _.pluck(_.flatten(_.pluck(sections, "dataElements")), "id");
                var store = db.objectStore("dataElements");
                var query = db.queryBuilder().$in(dataElementIds).compile();
                return store.each(query).then(function(dataElements) {
                    return dataSetTransformer.enrichWithSectionsAndDataElements(dataSets, sections, dataElements, excludedDataElements, dataElementGroups);
                });
            };
            return getDataElementGroups().then(function(dataElementGroups) {
                return store.each(query).then(_.curry(setupSections)(dataElementGroups));
            });

        };

        this.includeCategoryOptionCombinations = function(dataSets) {
            var getAll = function(storeName) {
                var store = db.objectStore(storeName);
                return store.getAll();
            };

            var categoryCombosPromise = getAll("categoryCombos");
            var categoriesPromise = getAll("categories");
            var categoryOptionCombosPromise = getAll("categoryOptionCombos");

            return $q.all([categoryCombosPromise, categoriesPromise, categoryOptionCombosPromise]).then(function(data) {
                var allCategoryCombos = data[0];
                var allCategories = data[1];
                var allCategoryOptionCombos = data[2];
                return dataSetTransformer.enrichWithCategoryOptionCombinations(dataSets, allCategoryCombos, allCategories, allCategoryOptionCombos);
            });
        };

        var extractOrgUnitIdsForIndexing = function(dataSets) {
            return _.map(dataSets, function(ds) {
                ds.orgUnitIds = _.pluck(ds.organisationUnits, "id");
                return ds;
            });
        };

        this.associateOrgUnits = function(dataSetIds, orgUnits) {
            return self.findAllDhisDatasets(dataSetIds).then(function(dataSets) {
                var updatedDataSets = _.map(dataSets, function(ds) {
                    ds.organisationUnits = ds.organisationUnits || [];
                    var orgUnitsForDataSet = _.transform(orgUnits, function(results, orgUnit) {
                        var orgUnitToAdd = {
                            "id": orgUnit.id,
                            "name": orgUnit.name
                        };
                        if (!_.some(ds.organisationUnits, orgUnitToAdd))
                            results.push(orgUnitToAdd);
                    });

                    ds.organisationUnits = ds.organisationUnits.concat(orgUnitsForDataSet);
                    return ds;
                });

                return self.upsertDhisDownloadedData(updatedDataSets);
            });
        };

        this.removeOrgUnits = function (dataSetIds, orgUnitIds) {
            return self.findAllDhisDatasets(dataSetIds).then(function(dataSets) {
                var updatedDataSets = _.map(dataSets, function(ds) {
                    ds.organisationUnits = ds.organisationUnits || [];
                    ds.organisationUnits = _.reject(ds.organisationUnits, function(orgUnit) {
                        return _.contains(orgUnitIds, orgUnit.id);
                    });
                    return ds;
                });
                return self.upsertDhisDownloadedData(updatedDataSets);
            });
        };

        this.findAllDhisDatasets = function(dataSetIds) {
            var store = db.objectStore("dataSets");
            var query = db.queryBuilder().$in(dataSetIds).compile();
            return store.each(query);
        };

        var associateSectionsToDataSets = function(dataSets, sections) {
            var indexedSections = _.groupBy(sections, function(section) {
                return section.dataSet.id;
            });

            return _.map(dataSets, function(ds) {
                ds.sections = _.map(indexedSections[ds.id], function(section) {
                    return _.pick(section, "id", "name");
                });
                return ds;
            });
        };

        this.upsertDhisDownloadedData = function(dataSets, sections) {
            dataSets = !_.isArray(dataSets) ? [dataSets] : dataSets;
            dataSets = extractOrgUnitIdsForIndexing(dataSets);
            dataSets = sections ? associateSectionsToDataSets(dataSets, sections) : dataSets;
            var store = db.objectStore("dataSets");
            return store.upsert(dataSets).then(function() {
                return dataSets;
            });
        };
    };
});
