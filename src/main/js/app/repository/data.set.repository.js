define(["lodash", "dataSetTransformer", "customAttributes"], function(_, dataSetTransformer, CustomAttributes) {
    return function(db, $q, categoryRepository) {
        var DATA_SETS_STORE_NAME = 'dataSets';

        this.getAll = function() {
            var store = db.objectStore(DATA_SETS_STORE_NAME);

            return store.getAll().then(function(dataSets) {
                var transformedDataSets = _.map(dataSets, dataSetTransformer.mapDatasetForView);
                return _.filter(transformedDataSets, 'isNewDataModel');
            });
        };

        this.findAllForOrgUnits = function(orgUnits) {
            var store = db.objectStore(DATA_SETS_STORE_NAME),
                dataSetIds = _.uniq(_.map(_.flatten(_.map(orgUnits, 'dataSets')), 'id')),
                query = db.queryBuilder().$in(dataSetIds).compile();

            return store.each(query).then(function(dataSets) {
                var transformedDataSets = _.map(dataSets, dataSetTransformer.mapDatasetForView);
                return _.filter(transformedDataSets, 'isNewDataModel');
            });
        };

        var getDataElementGroups = function() {
            var groupStore = db.objectStore("dataElementGroups");
            return groupStore.getAll().then(function(dataElementGroups) {
                return _.filter(dataElementGroups, function(group) {
                    // TODO: Remove this backward compatible code once we are sure that all the fields are upgraded to 9.0
                    return CustomAttributes.getBooleanAttributeValue(group.attributeValues, 'praxisShowInModuleCreation') || _.endsWith(group.code, "module_creation");
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
            var categoryCombosPromise = categoryRepository.getAllCategoryCombos();
            var categoriesPromise = categoryRepository.getAllCategories();
            var categoryOptionCombosPromise = categoryRepository.getAllCategoryOptionCombos();

            return $q.all([categoryCombosPromise, categoriesPromise, categoryOptionCombosPromise]).then(function(data) {
                var allCategoryCombos = data[0];
                var allCategories = data[1];
                var allCategoryOptionCombos = data[2];
                return dataSetTransformer.enrichWithCategoryOptionCombinations(dataSets, allCategoryCombos, allCategories, allCategoryOptionCombos);
            });
        };

        this.findAllDhisDatasets = function(dataSetIds) {
            var store = db.objectStore(DATA_SETS_STORE_NAME);
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
            dataSets = sections ? associateSectionsToDataSets(dataSets, sections) : dataSets;
            var store = db.objectStore(DATA_SETS_STORE_NAME);
            return store.upsert(dataSets).then(function() {
                return dataSets;
            });
        };
    };
});
