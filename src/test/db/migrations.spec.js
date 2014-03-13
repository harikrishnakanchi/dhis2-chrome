define(["migrations"], function(migrations) {
    describe("migrations", function() {
        it("should create object store", function(done) {
            var req = indexedDB.open("msf");
            req.onupgradeneeded = function(e) {
                db = req.result;
                migrations[0](db);

                expect(db.objectStoreNames.length).toBe(1);
                expect(db.objectStoreNames[0]).toBe("organization");
            };
            done();
        });
    });
});