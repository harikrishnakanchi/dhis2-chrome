define([], function() {
	return function(db) {
		this.getProgramsForOrgUnit = function(orgUnit){
			var store = db.objectStore("programs");
			var query = db.queryBuilder().$eq(orgUnit).$index("by_organisationUnit").compile();
			return store.each(query);
		};
	};
});