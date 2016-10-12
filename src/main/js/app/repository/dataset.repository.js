define(["lodash", "datasetTransformer", "moment"], function(_, datasetTransformer, moment) {
    return function(db, $q, categoryRepository) {
        var self = this;

        this.getAll = function() {
            var store = db.objectStore("dataSets");
            return store.getAll().then(function(dsFromDb) {
                datasets = _.map(dsFromDb, datasetTransformer.mapDatasetForView);
                datasets = _.filter(datasets, "isNewDataModel");
                return datasets;
            });
        };
        
        this.findAllForOrgUnits = function(orgUnitIds) {
            var store = db.objectStore("dataSets");
            var query = db.queryBuilder().$in(orgUnitIds).$index("by_organisationUnit").compile();
            return store.each(query).then(function(dsFromDb) {
                datasets = _.map(dsFromDb, datasetTransformer.mapDatasetForView);
                datasets = _.filter(datasets, "isNewDataModel");
                datasets = _.uniq(_.sortBy(datasets, 'id'), true, 'id');
                return datasets;
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

        this.includeDataElements = function(datasets, excludedDataElements) {
            var sectionIds = _.pluck(_.flatten(_.pluck(datasets, "sections")), "id");
            var store = db.objectStore("sections");
            var query = db.queryBuilder().$in(sectionIds).compile();
            var setupSections = function(dataElementGroups, sections) {
                var dataElementIds = _.pluck(_.flatten(_.pluck(sections, "dataElements")), "id");
                var store = db.objectStore("dataElements");
                var query = db.queryBuilder().$in(dataElementIds).compile();
                return store.each(query).then(function(dataElements) {
                    return datasetTransformer.enrichWithSectionsAndDataElements(datasets, sections, dataElements, excludedDataElements, dataElementGroups);
                });
            };
            return getDataElementGroups().then(function(dataElementGroups) {
                return store.each(query).then(_.curry(setupSections)(dataElementGroups));
            });

        };

        this.includeCategoryOptionCombinations = function(datasets) {
            var categoryCombosPromise = categoryRepository.getAllCategoryCombos();
            var categoriesPromise = categoryRepository.getAllCategories();
            var categoryOptionCombosPromise = categoryRepository.getAllCategoryOptionCombos();

            return $q.all([categoryCombosPromise, categoriesPromise, categoryOptionCombosPromise]).then(function(data) {
                var allCategoryCombos = data[0];
                var allCategories = data[1];
                var allCategoryOptionCombos = data[2];
                return datasetTransformer.enrichWithCategoryOptionCombinations(datasets, allCategoryCombos, allCategories, allCategoryOptionCombos);
            });
        };

        var extractOrgUnitIdsForIndexing = function(dataSets) {
            return _.map(dataSets, function(ds) {
                ds.orgUnitIds = _.pluck(ds.organisationUnits, "id");
                return ds;
            });
        };

        this.associateOrgUnits = function(datasetIds, orgUnits) {
            return self.findAllDhisDatasets(datasetIds).then(function(datasets) {
                var updatedDatasets = _.map(datasets, function(ds) {
                    ds.organisationUnits = ds.organisationUnits || [];
                    var orgUnitsForDataset = _.transform(orgUnits, function(results, orgUnit) {
                        var orgUnitToAdd = {
                            "id": orgUnit.id,
                            "name": orgUnit.name
                        };
                        if (!_.some(ds.organisationUnits, orgUnitToAdd))
                            results.push(orgUnitToAdd);
                    });

                    ds.organisationUnits = ds.organisationUnits.concat(orgUnitsForDataset);
                    return ds;
                });

                return self.upsertDhisDownloadedData(updatedDatasets);
            });
        };

        this.removeOrgUnits = function (datasetIds, orgUnitIds) {
            return self.findAllDhisDatasets(datasetIds).then(function(datasets) {
                var updatedDatasets = _.map(datasets, function(ds) {
                    ds.organisationUnits = ds.organisationUnits || [];
                    ds.organisationUnits = _.reject(ds.organisationUnits, function(orgUnit) {
                        return _.contains(orgUnitIds, orgUnit.id);
                    });
                    return ds;
                });
                return self.upsertDhisDownloadedData(updatedDatasets);
            });
        };

        this.findAllDhisDatasets = function(datasetIds) {
            var store = db.objectStore("dataSets");
            var query = db.queryBuilder().$in(datasetIds).compile();
            return store.each(query);
        };

        var associateSectionsToDatasets = function(dataSets, sections) {
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
            dataSets = sections ? associateSectionsToDatasets(dataSets, sections) : dataSets;
            var store = db.objectStore("dataSets");
            return store.upsert(dataSets).then(function() {
                return dataSets;
            });
        };
    };
});
