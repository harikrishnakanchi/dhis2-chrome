define(["migrations"], function(migrations) {

    describe("migrations", function() {

        it("should create object store", function(done) {
            var req = indexedDB.open("msf", 1);
            req.onupgradeneeded = function(e) {
                var db = req.result;
                migrations.add_object_stores(db);
                expect(db.objectStoreNames.length).toBe(1);
                expect(db.objectStoreNames[0]).toBe("organization");
            };
            done();
        });
    });
});