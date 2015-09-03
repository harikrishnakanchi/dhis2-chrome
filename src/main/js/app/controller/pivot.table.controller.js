define(["lodash"],
    function(_) {
        return function($scope) {
            var PivotTableModel = function(definition, data) {
                var self = this;
                this.definition = definition;
                this.data = data;

                var replaceWithName = function(text) {
                    return {
                        "text": self.data.metaData.names[text],
                        "value": text
                    };
                };
                var updateChildren = function(row, children) {
                    return _.map(row, function(item) {
                        item.children = children;
                        return item;
                    });
                };
                var buildRowTree = function(rowDimensions) {
                    var tree = {};
                    for (var i = rowDimensions.length - 1; i >= 0; i--) {
                        var level = rowDimensions[i];
                        if (i !== rowDimensions.length - 1) {
                            level = updateChildren(rowDimensions[i], tree[i + 1]);
                        }
                        tree[i] = level;
                    }
                    return tree[0];
                };
                return {
                    "getColumnHeaders": function() {
                        var columnDimensions = self.definition.columns;
                        return _.map(columnDimensions, function(columnGroup) {
                            if (columnGroup.dimension === "pe") {
                                return _.map(self.data.metaData.pe, replaceWithName);
                            } else {
                                return _.pluck(rowGroup.items, "name");
                            }
                        });
                    },
                    "getRowDimensions": function() {
                        var rowData = self.definition.rows;
                        var rowDimensions = _.map(rowData, function(rowGroup) {
                            if (rowGroup.dimension === "pe") {
                                return _.map(self.data.metaData.pe, replaceWithName);
                            }
                            return _.map(rowGroup.items, function(item) {
                                return {
                                    "text": item.name,
                                    "value": item.id
                                };
                            });
                        });
                        return rowDimensions;
                    }

                };
            };
            if ($scope.definition && $scope.data) {
                var table = PivotTableModel($scope.definition, $scope.data);
                $scope.columnHeaders = table.getColumnHeaders();
                $scope.rowDimensions = table.getRowDimensions();
            }
        };
    });
