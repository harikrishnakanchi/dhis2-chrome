define(["lodash"], function(_) {
    return function(db) {

    	this.getAll = function(){
    		 var store = db.objectStore("dataElements");
            return store.getAll();
    	};
    };
});