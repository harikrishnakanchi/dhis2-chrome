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

        this.getCompleteDataValues = function(period, orgUnitId) {
            var filterSoftDeletedApprovals = function(d) {
                return d && d.isDeleted ? undefined : d;
            };

            var store = db.objectStore('completeDataSets');
            return store.find([period, orgUnitId]).then(filterSoftDeletedApprovals);
        };

        this.unapproveLevelOneData = function(period, orgUnit) {
            var unapprove = function(data) {
                if (!data) return;
                data.isDeleted = true;
                var store = db.objectStore('completeDataSets');
                return store.upsert(data);
            };

            return this.getCompleteDataValues(period, orgUnit).then(unapprove);
        };

        this.saveAsDraft = function(payload) {
            return this.save(payload, true);
        };
    };
});