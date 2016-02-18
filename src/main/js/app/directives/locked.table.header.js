define([], function () {
    return function ($timeout, $window) {
        return {
            restrict: 'A',
            transclude: 'element',
            replace: true,
            templateUrl: 'templates/locked.table.header.html',
            link: function (scope, elem) {
                var wrapperDiv = elem[0],
                    originalTableDiv = elem.find('div')[0],
                    originalTable = originalTableDiv.querySelector('table'),
                    originalHeader = originalTable.querySelector('thead'),
                    fixedHeaderDiv = elem.find('div')[1],
                    fixedTable = document.createElement('table'),
                    fixedHeader;

                var setStyles = function () {
                    wrapperDiv.style.border = 'none';
                    wrapperDiv.classList.remove('table');
                    wrapperDiv.classList.remove('table-bordered');
                    wrapperDiv.classList.remove('table-hover');

                    fixedTable.classList.add('table');
                    fixedTable.classList.add('table-bordered');
                    fixedTable.style.border = 'none';
                };

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
                        headerCells[i].style.minWidth = cellWidths[i] + 'px';
                    }
                };

                var generateFixedHeader = function () {
                    fixedHeader = angular.element(originalHeader).clone()[0];
                };

                var setFixedHeaderVisibility = function () {
                    var tableTopIsAboveScreen = originalTable.getBoundingClientRect().top <= 0,
                        tableBottomIsAboveScreen = originalTable.getBoundingClientRect().bottom <= 0,
                        onlyFixedHeaderIsVisible = originalTable.getBoundingClientRect().bottom < fixedHeaderDiv.getBoundingClientRect().height;

                    if (tableTopIsAboveScreen && !tableBottomIsAboveScreen) {
                        if (fixedHeaderDiv.style.visibility == 'hidden') {
                            setFixedHeaderWidth();
                            fixedHeaderDiv.style.visibility = 'visible';
                        }
                        if (onlyFixedHeaderIsVisible) {
                            fixedHeaderDiv.style.top = (originalTable.getBoundingClientRect().bottom - fixedHeaderDiv.getBoundingClientRect().height) + 'px';
                        } else {
                            fixedHeaderDiv.style.top = '0px';
                        }
                    } else {
                        fixedHeaderDiv.style.visibility = 'hidden';
                    }
                };

                var appendFixedHeaderDivToWrapperDiv = function () {
                    fixedTable.appendChild(fixedHeader);
                    fixedHeaderDiv.appendChild(fixedTable);
                    setFixedHeaderDivWidth();
                };

                var setFixedHeaderDivWidth = function () {
                    fixedHeaderDiv.style.width = wrapperDiv.getBoundingClientRect().width + 'px';
                };

                var setUpListeners = function () {
                    angular.element($window).bind('scroll', setFixedHeaderVisibility);
                    angular.element($window).bind('resize', setFixedHeaderWidth);
                    angular.element($window).bind('resize', setFixedHeaderDivWidth);
                    angular.element(originalTableDiv).bind('scroll', function (event) {
                        fixedHeaderDiv.scrollLeft = event.target.scrollLeft;
                    });
                };

                var setupFixedHeader = function () {
                    setStyles();
                    generateFixedHeader();
                    setFixedHeaderWidth();
                    setFixedHeaderVisibility();
                    appendFixedHeaderDivToWrapperDiv();
                    setUpListeners();
                };

                var unwatch = scope.$watch(function () {
                    return originalTable.getBoundingClientRect().height;
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
