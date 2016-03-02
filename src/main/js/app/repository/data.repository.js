define(["lodash", "moment"], function(_, moment) {
    return function($q, db) {
        var transformAndSave = function(payload, localStatus) {
            var groupedDataValues = _.groupBy(payload, function(dataValue) {
                return [dataValue.period, dataValue.orgUnit];
            });

            var dataValueSetsAggregator = function(result, dataValues, tuple) {
                var split = tuple.split(","),
                    existingLocalStatus = null,
                    dataValuesWithLocalStatus = _.filter(dataValues, function(dataValue){ return !_.isUndefined(dataValue.localStatus); });
                if (!_.isEmpty(dataValuesWithLocalStatus)) {
                    existingLocalStatus = _.first(dataValuesWithLocalStatus).localStatus;
                    _.each(dataValuesWithLocalStatus, function(dataValue) {
                        delete dataValue.localStatus;
                    });
                }
                var dataValue = {
                    "period": split[0],
                    "dataValues": dataValues,
                    "orgUnit": split[1],
                    "localStatus": existingLocalStatus || localStatus
                };
                result.push(dataValue);
            };

            var indexableDataValues = _.transform(groupedDataValues, dataValueSetsAggregator, []);
            var dataValuesStore = db.objectStore("dataValues");
            return dataValuesStore.upsert(indexableDataValues).then(function() {
                return payload;
            });
        };

        this.isDataPresent = function(orgUnitId) {
            var query = orgUnitId ? db.queryBuilder().$eq(orgUnitId).$index("by_organisationUnit").compile() : db.queryBuilder().$index("by_organisationUnit").compile();
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

            return transformAndSave(payload, 'WAITING_TO_SYNC');
        };

        this.saveAsDraft = function(payload) {
            payload = _.map(payload, function(dataValue) {
                dataValue.clientLastUpdated = moment().toISOString();
                dataValue.isDraft = true;
                return dataValue;
            });

            return transformAndSave(payload, 'SAVED');
        };

        this.saveDhisData = function(payload) {
            return transformAndSave(payload, 'DATA_FROM_DHIS');
        };

        this.getDataValues = function(period, orgUnitIds) {
            var store = db.objectStore("dataValues");
            return $q.all(_.map(orgUnitIds, function(orgUnitId) {
                return store.find([period, orgUnitId]).then(function(data) {
                    if (!_.isEmpty(data))
                        return data.dataValues;
                    return undefined;
                });
            })).then(function(dataValues) {
                return _.compact(_.flatten(dataValues));
            });
        };

        this.getDataValuesForOrgUnitsPeriods = function(orgUnits, periods) {
            var store = db.objectStore("dataValues");
            var query = db.queryBuilder().$index("by_period").$in(periods).compile();
            return store.each(query).then(function(dataValues) {
                var filteredDataValues = _.filter(dataValues, function(dv) {
                    return _.contains(orgUnits, dv.orgUnit);
                });
                _.each(filteredDataValues, function(dataValueBlock) {
                    if(dataValueBlock.localStatus) {
                        _.each(dataValueBlock.dataValues, function(dataValue) {
                            dataValue.localStatus = dataValueBlock.localStatus;
                        });
                    }
                });
                return _.flatten(_.pluck(filteredDataValues, 'dataValues'));
            });
        };

        this.getSubmittedDataValuesForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore("dataValues");
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query).then(function(dataValues) {
                var filteredDV = _.filter(dataValues, function(dv) {
                    var hasSomeDraftValues = _.some(dv.dataValues, { isDraft: true });
                    return _.contains(orgUnits, dv.orgUnit) && dv.localStatus != 'SAVED' && !hasSomeDraftValues;
                });
                return filteredDV;
            });
        };

        this.setLocalStatus = function(periodsAndOrgUnits, localStatus) {
            periodsAndOrgUnits = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
               return [periodAndOrgUnit.period, periodAndOrgUnit.orgUnit];
            });
            var store = db.objectStore("dataValues");
            _.each(periodsAndOrgUnits, function(tuple) {
                store.find(tuple).then(function (data) {
                    data.localStatus = localStatus;
                    return store.upsert(data);
                });
            });
        };

        this.getLocalStatus = function(period, orgUnit) {
            var store = db.objectStore("dataValues");
            return store.find([period, orgUnit]).then(function(data) {
                if (!_.isEmpty(data))
                    return data.localStatus;
                return undefined;
            });
        };

    };
});
