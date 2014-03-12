define(["migrator"], function(migrator) {
    describe("migrator", function() {
        var scope;

        it("should run migrations if db version is greater", function(done) {
            console.log(done);
            var migrations = [

                function(db) {
                    db.createObjectStore("someStore");
                }
            ];

            migrator.run("somedb", migrations).then(function(db) {
                expect(db.objectStoreNames.length).toBe(1);
                done();
            });
        });
    });
});