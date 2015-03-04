define(["lodash", "moment"], function(_, moment) {
    return function(db) {
        var transformAndSave = function(payload) {
            var groupedDataValues = _.groupBy(payload, function(dataValue) {
                return [dataValue.period, dataValue.orgUnit];
            });

            var dataValueSetsAggregator = function(result, dataValues, tuple) {
                var split = tuple.split(",");
                var dataValue = {
                    "period": split[0],
                    "dataValues": dataValues,
                    "orgUnit": split[1]
                };
                result.push(dataValue);
            };

            var indexableDataValues = _.transform(groupedDataValues, dataValueSetsAggregator, []);
            var dataValuesStore = db.objectStore("dataValues");
            return dataValuesStore.upsert(indexableDataValues).then(function() {
                return payload;
            });
        };

        this.isDataPresent = function(orgUnitIds) {
            var query = orgUnitIds ? db.queryBuilder().$in(orgUnitIds).$index("by_organisationUnit").compile() : db.queryBuilder().$index("by_organisationUnit").compile();
            var store = db.objectStore('dataValues');
            return store.exists(query).then(function(data) {
                return data;
            });
        };

        this.save = function(payload) {
            payload = _.map(payload, function(dataValue) {
                dataValue.clientLastUpdated = moment().toISOString();
                return dataValue;
            });

            return transformAndSave(payload);
        };

        this.saveAsDraft = function(payload) {
            payload = _.map(payload, function(dataValue) {
                dataValue.clientLastUpdated = moment().toISOString();
                dataValue.isDraft = true;
                return dataValue;
            });

            return transformAndSave(payload);
        };

        this.saveDhisData = function(payload) {
            return transformAndSave(payload);
        };

        this.getDataValues = function(period, orgUnitId) {
            var store = db.objectStore("dataValues");
            return store.find([period, orgUnitId]).then(function(data) {
                if (!_.isEmpty(data))
                    return data.dataValues;
                return undefined;
            });
        };

        this.getDataValuesForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore("dataValues");
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query).then(function(dataValues) {
                var filteredDV = _.filter(dataValues, function(dv) {
                    return _.contains(orgUnits, dv.orgUnit);
                });
                return _.flatten(_.pluck(filteredDV, 'dataValues'));
            });
        };
    };
});
