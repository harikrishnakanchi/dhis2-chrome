define(["lodash"], function (_) {
    return function ($timeout, $window) {
        return {
            restrict: 'A',
            link: function (scope, elem) {
                var getOriginalHeaderCellWidths = function (originalHeader) {
                    var headerCells = originalHeader.getElementsByTagName('th'),
                        cellWidths = [];

                    for (var i = 0; i < headerCells.length; i++) {
                        var cellWidth = headerCells[i].getBoundingClientRect().width;
                        cellWidths.push(cellWidth);
                    }
                    return cellWidths;
                };

                var setFixedHeaderCellWidths = function (fixedHeader, cellWidths) {
                    var headerCells = fixedHeader.getElementsByTagName('th');

                    for (var i = 0; i < headerCells.length; i++) {
                        console.log(headerCells[i]);
                        console.log(cellWidths[i]);
                        headerCells[i].style.width = cellWidths[i] + "px";
                    }
                };

                var generateFixedHeader = function (originalHeader) {
                    var fixedHeader = angular.element(originalHeader).clone()[0];
                    fixedHeader.style = 'position: fixed; top: 0; margin-left: -1px; visibility: hidden; will-change: top;';
                    setFixedHeaderCellWidths(fixedHeader, getOriginalHeaderCellWidths(originalHeader));
                    return fixedHeader;
                };

                var setupFixedHeader = function (table) {
                    var originalHeader = table.getElementsByTagName('thead')[0],
                        fixedHeader = generateFixedHeader(originalHeader);
                    table.appendChild(fixedHeader);
                    angular.element($window).bind('scroll', function (event) {
                        if (table.getBoundingClientRect().top <= 0 && table.getBoundingClientRect().bottom > 2 * originalHeader.getBoundingClientRect().height) {
                            fixedHeader.style.visibility = 'visible';
                        } else {
                            fixedHeader.style.visibility = 'hidden';
                        }
                    });
                };

                var init = function () {
                    var table = elem[0];
                    var unwatch = scope.$watch(function () {
                        return table.getBoundingClientRect().height;
                    }, function (tableHeight) {
                        if (tableHeight > 0) {
                            // timeout for accordion to complete the open animation
                            $timeout(function () {
                                setupFixedHeader(table);
                            }, 500);
                            unwatch();
                        }
                    });
                };

                init();
            }
        };
    };
});
