define([], function () {
    return function ($timeout, $window) {
        return {
            restrict: 'A',
            link: function (scope, elem) {
                var table = elem[0],
                    originalHeader = table.querySelector('thead'),
                    fixedHeader;

                var getOriginalHeaderCellWidths = function () {
                    var headerCells = originalHeader.getElementsByTagName('th'),
                        cellWidths = [];

                    for (var i = 0; i < headerCells.length; i++) {
                        var cellWidth = headerCells[i].getBoundingClientRect().width;
                        cellWidths.push(cellWidth);
                    }
                    return cellWidths;
                };

                var setFixedHeaderWidth = function () {
                    var cellWidths = getOriginalHeaderCellWidths(),
                        headerCells = fixedHeader.getElementsByTagName('th');

                    for (var i = 0; i < headerCells.length; i++) {
                        headerCells[i].style.width = cellWidths[i] + "px";
                    }
                };

                var generateFixedHeader = function () {
                    fixedHeader = angular.element(originalHeader).clone()[0];
                    fixedHeader.style = 'position: fixed; top: 0; margin-left: -1px; visibility: hidden; will-change: top;';
                };

                var setFixedHeaderVisibility = function () {
                    var tableTopIsAboveScreen = table.getBoundingClientRect().top <= 0,
                        tableBottomIsAboveScreen = table.getBoundingClientRect().bottom <= 0,
                        onlyFixedHeaderIsVisible = table.getBoundingClientRect().bottom < fixedHeader.getBoundingClientRect().height;

                    if (tableTopIsAboveScreen && !tableBottomIsAboveScreen) {
                        if (fixedHeader.style.visibility == 'hidden') {
                            setFixedHeaderWidth();
                            fixedHeader.style.visibility = 'visible';
                        }
                        if (onlyFixedHeaderIsVisible) {
                            fixedHeader.style.top = (table.getBoundingClientRect().bottom - fixedHeader.getBoundingClientRect().height) + 'px';
                        } else {
                            fixedHeader.style.top = '0px';
                        }
                    } else {
                        fixedHeader.style.visibility = 'hidden';
                    }
                };

                var appendHeaderToTable = function () {
                    table.appendChild(fixedHeader);
                    table.style.borderBottom = '0px';
                };

                var setupFixedHeader = function () {
                    generateFixedHeader();
                    setFixedHeaderWidth();
                    setFixedHeaderVisibility();
                    appendHeaderToTable();
                    angular.element($window).bind('scroll', setFixedHeaderVisibility);
                    angular.element($window).bind('resize', setFixedHeaderWidth);
                };

                var unwatch = scope.$watch(function () {
                    return table.getBoundingClientRect().height;
                }, function (tableHeight) {
                    if (tableHeight > 0) {
                        // timeout for accordion to complete the open animation
                        $timeout(setupFixedHeader, 500);
                        unwatch();
                    }
                });
            }
        };
    };
});
