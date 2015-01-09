define(["migrator"], function(migrator) {
    describe("migrator", function() {
        var transaction = {
            name: "transaction"
        };
        var db = {
            name: "db"
        };
        var migration1 = jasmine.createSpy();
        var migration2 = jasmine.createSpy();
        var migration3 = jasmine.createSpy();
        var migrations = [migration1, migration2, migration3];


        it("should run all migrations from old version", function() {
            migrator.run(1, db, transaction, migrations);

            expect(migration1).not.toHaveBeenCalled();
            expect(migration2).toHaveBeenCalledWith(db, transaction);
            expect(migration3).toHaveBeenCalledWith(db, transaction);
        });
    });
});
