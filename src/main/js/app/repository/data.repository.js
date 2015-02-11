define(["lodash", "moment"], function(_, moment) {
    return function(db) {
        var transformAndSave = function(payload, isDraft) {
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
                if (isDraft)
                    dataValue = _.merge(dataValue, {
                        "isDraft": true
                    });
                result.push(dataValue);
            };

            var dataValues = _.transform(groupedDataValues, dataValueSetsAggregator, []);
            var dataValuesStore = db.objectStore("dataValues");
            return dataValuesStore.upsert(dataValues).then(function() {
                return payload;
            });
        };

        this.save = function(payload) {
            payload = _.map(payload, function(dataValue) {
                dataValue.clientLastUpdated = moment().toISOString();
                return dataValue;
            });

            return transformAndSave(payload, false);
        };

        this.saveAsDraft = function(payload) {
            payload = _.map(payload, function(dataValue) {
                dataValue.clientLastUpdated = moment().toISOString();
                return dataValue;
            });

            return transformAndSave(payload, true);
        };

        this.saveDhisData = function(payload) {
            return transformAndSave(payload);
        };

        this.getDataValues = function(period, orgUnitId) {
            var store = db.objectStore("dataValues");
            return store.find([period, orgUnitId]).then(function(data) {
                return _.flatten(data, "dataValues");
            });
        };

        this.getDataValuesForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore("dataValues");
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query).then(function(data) {
                return _.flatten(data, "dataValues");
            }).then(function(dataValues) {
                return _.filter(dataValues, function(dv) {
                    return _.contains(orgUnits, dv.orgUnit);
                });
            });
        };
    };
});
