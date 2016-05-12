define([],function(){
    return function($q, db) {
        var translatableTypes = ["sections", "dataElements"];
        var translatableProperties = ["name", "description"];

        var setLocale = function(locale){
            this.locale = locale;
        };

        var getTranslationsForLocale = function() {
            var store = db.objectStore('translations');
            var query = db.queryBuilder().$index('by_locale').$eq(this.locale).compile();
            return store.each(query).then(function(translations) {
                return translations;
            });
        };

        var translate = function(objectToBeTranslated){
            if(this.locale == 'en') {
                return $q.when(objectToBeTranslated);
            }

            return getTranslationsForLocale().then(function(data) {
                var translationObject = _.filter(data, {objectId: objectToBeTranslated.id});
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

                return objectToBeTranslated;
            });
        };

        return {
            setLocale: setLocale,
            translate: translate
        };
    };
});