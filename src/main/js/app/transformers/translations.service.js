define([],function(){
    return function($q, db) {
        var translatableTypes = ["sections", "dataElements"];
        var translatableProperties = ["name", "description"];
        var translations;

        var setLocale = function(locale){
            this.locale = locale;
            var store = db.objectStore('translations');
            var query = db.queryBuilder().$index('by_locale').$eq(this.locale).compile();
            return store.each(query).then(function(data) {
                translations = data;
            });
        };

        var translateReports = function (reportsToTranslate) {
            if(this.locale == 'en') {
                return $q.when(reportsToTranslate);
            }

            var result = _.each(reportsToTranslate, function (report) {
                var items = report.definition.rows[0].items;
                var namesHash = report.data ? report.data.metaData.names : {};
                return _.each(items, function (item) {
                    var translationObject = _.filter(translations, {objectId: item.id});
                    var translationsByProperty = _.filter(translationObject, {property: "shortName"});
                    namesHash[item.id] = translationsByProperty.length > 0 ? translationsByProperty[0].value : item.name;
                });
            });

            return $q.when(result);
        };

        var translate = function(objectToBeTranslated){
            if(this.locale == 'en') {
                return $q.when(objectToBeTranslated);
            }

            var translationObject = _.filter(translations, {objectId: objectToBeTranslated.id});
            _.each(translatableProperties, function (property) {
                if(objectToBeTranslated[property]) {
                    var translationsByProperty = _.filter(translationObject, {property: property});
                    objectToBeTranslated[property] = translationsByProperty[0] ? translationsByProperty[0].value : objectToBeTranslated[property];
                }
            });

            _.find(objectToBeTranslated, function (value, key) {
                if(_.isArray(value) && _.contains(translatableTypes, key)){
                    return _.each(value,function(object){
                        return translate(object);
                    });
                } else if(_.isObject(value) && _.contains(translatableTypes, key)){
                    return translate(value);
                }
            });

            return $q.when(objectToBeTranslated);
        };

        return {
            setLocale: setLocale,
            translate: translate,
            translateReports: translateReports
        };
    };
});