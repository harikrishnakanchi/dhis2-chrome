define(['lodash'], function(_) {
    return function(db) {

    	this.getAll = function(){
    		var store = db.objectStore("indicators");
            var filtered = store.getAll().then(function(allIndicators) {
                return _.filter(allIndicators, function(indicator) {
                    var attr = _.find(indicator.attributeValues, {
                        "attribute": {
                            "code": 'showInFieldReports'
                        }
                    });
                    return attr && attr.value === 'true';
                });
            });
            return filtered;
    	};
    };
});