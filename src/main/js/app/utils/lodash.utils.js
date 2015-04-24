define(["lodash"], function(_) {
    _.unionBy = function(lists, key) {
        return _.uniq(_.flatten(_.without(lists, undefined)), key);
    };

    _.xorBy = function(list1, list2, key) {
        return _.xor(_.pluck(list1, key), _.pluck(list2, key));
    };

    _.groupByArray = function(objects, key) {
        var groupedObject = {};
        _.forEach(objects, function(o) {
            _.forEach(o[key], function(k) {
                if (groupedObject[k]) {
                    groupedObject[k].push(o);
                } else {
                    groupedObject[k] = [o];
                }
            });
        });
        return groupedObject;
    };

    //k1 - https://github.com/lodash/lodash/issues/146
    // Just like _.result, but also works for nested objects
    _.extract = function extract(object, property, defaultValue) {
        var obj = object,
            parts = property.split('.'),
            part = parts.shift();

        while (part && obj) {
            obj = obj[part];
            part = parts.shift();
        }
        return obj || defaultValue;
    };

    _.minWhile = function(collection, key, customOrder) {
        var verifyCustomOrder = function() {
            var verifyAllKeysArePresent = function(customOrderKeys) {
                var keysWithUnknownOrder = _.difference(_.pluck(collection, key), customOrderKeys);
                if (keysWithUnknownOrder.length > 0) {
                    throw "Custom order is not known for [" + keysWithUnknownOrder + "]";
                }
            };

            var verifyAllValuesAreInt = function() {
                var areAllValuesInt = _.every(_.values(customOrder), _.isNumber);
                if (!areAllValuesInt) {
                    throw "Custom order values should be integers";
                }
            };

            if (_.isArray(customOrder)) {
                verifyAllKeysArePresent(customOrder);
            } else if (_.isPlainObject(customOrder)) {
                verifyAllValuesAreInt();
                verifyAllKeysArePresent(_.keys(customOrder));
            } else {
                throw "Unsupported custom order type";
            }
        };

        var mapCustomOrder = function() {
            verifyCustomOrder();
            return _.zipObject(customOrder, _.range(0, customOrder.length));
        };

        if (!customOrder) {
            return _.min(collection, key);
        }

        verifyCustomOrder();
        var keyOrder = _.isArray(customOrder) ? mapCustomOrder() : customOrder;

        var minValue = Infinity;
        var result;

        _.forEach(collection, function(obj) {
            if (keyOrder[obj[key]] < minValue) {
                minValue = keyOrder[obj[key]];
                result = obj;
            }
        });

        return result;
    };

    _.differenceBy = function(list1, list2, key) {
        return _.transform(list1, function(acc, object) {
            var matchingObject = _.find(list2, key, object[key]);
            if (!matchingObject) {
                acc.push(object);
            }
        }, []);
    };

    _.containsBy = function(list, searchKey, comparisonKey) {
        var comparisonKeys = _.pluck(list, comparisonKey);
        return _.contains(comparisonKeys, searchKey[comparisonKey]);
    };

    return _;
});
