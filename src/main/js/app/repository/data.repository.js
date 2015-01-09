define(["lodash"], function(_) {
    return function(db) {
        this.save = function(payload, isDraft) {
            var groupedDataValues = _.groupBy(payload.dataValues, function(dataValue) {
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
            return dataValuesStore.upsert(dataValues).then(function(data) {
                return payload;
            });
        };

        this.getDataValues = function(period, orgUnitId) {
            var store = db.objectStore('dataValues');
            return store.find([period, orgUnitId]);
        };

        this.getDataValuesForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore('dataValues');
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query).then(function(dataValues) {
                return _.filter(dataValues, function(dv) {
                    return _.contains(orgUnits, dv.orgUnit);
                });
            });
        };

        this.saveAsDraft = function(payload) {
            return this.save(payload, true);
        };
    };
});
