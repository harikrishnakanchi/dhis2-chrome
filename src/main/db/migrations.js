var add_object_store = function(db) {
    var store = db.createObjectStore("organization", {
        keyPath: "name"
    });
    return store.transaction;
};

var add_organization = function(db) {
    var transaction = this.transaction;
    var store = transaction.objectStore("organization");
    store.add({
        "name": "Msf",
        "countries": [{
            "Tacloban": ["Bethany"]
        }]
    });
    return store.transaction;
};


var migrations = [add_object_store, add_organization];