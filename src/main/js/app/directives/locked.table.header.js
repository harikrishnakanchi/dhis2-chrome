/**
 * Usage: <table locked-table-header bind-event="click">
 */

define([], function () {
    return function ($timeout, $window) {
        return {
            restrict: 'A',
            transclude: 'element',
            replace: true,
            templateUrl: 'templates/locked.table.header.html',
            link: function (scope, elem, attrs) {
                var wrapperDiv = elem[0],
                    originalTableDiv = elem.find('div')[0],
                    originalTable = originalTableDiv.querySelector('table'),
                    originalHeader = originalTable.querySelector('thead'),
                    fixedHeaderDiv = elem.find('div')[1],
                    fixedHeaderTable = document.createElement('table'),
                    fixedHeader,
                    eventOnFixedHeaderCells = attrs.bindEvent;

                var setStyles = function () {
                    wrapperDiv.style.border = 'none';
                    wrapperDiv.classList.remove('table');
                    wrapperDiv.classList.remove('table-bordered');
                    wrapperDiv.classList.remove('table-hover');

                    fixedHeaderTable.classList.add('table');
                    fixedHeaderTable.classList.add('table-bordered');
                    fixedHeaderTable.style.border = 'none';
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

                var setFixedHeaderDivVisibility = function () {
                    var tableTopIsAboveScreen = originalTableDiv.getBoundingClientRect().top <= 0,
                        tableBottomIsAboveScreen = originalTableDiv.getBoundingClientRect().bottom <= 0,
                        onlyFixedHeaderDivIsVisible = originalTableDiv.getBoundingClientRect().bottom < fixedHeaderDiv.getBoundingClientRect().height;

                    if (tableTopIsAboveScreen && !tableBottomIsAboveScreen) {
                        if (fixedHeaderDiv.style.visibility == 'hidden') {
                            if (eventOnFixedHeaderCells) {
                                resetFixedHeaderCellStyling();
                            }
                            setFixedHeaderDivWidth();
                            setFixedHeaderWidth();
                            fixedHeaderDiv.style.visibility = 'visible';
                        }
                        if (onlyFixedHeaderDivIsVisible) {
                            fixedHeaderDiv.style.top = (originalTableDiv.getBoundingClientRect().bottom - fixedHeaderDiv.getBoundingClientRect().height) + 'px';
                        } else {
                            fixedHeaderDiv.style.top = '0px';
                        }
                    } else {
                        fixedHeaderDiv.style.visibility = 'hidden';
                    }
                };

                var appendFixedHeaderDivToWrapperDiv = function () {
                    fixedHeaderTable.appendChild(fixedHeader);
                    fixedHeaderDiv.appendChild(fixedHeaderTable);
                    setFixedHeaderDivWidth();
                };

                var setFixedHeaderDivWidth = function () {
                    fixedHeaderDiv.style.width = wrapperDiv.getBoundingClientRect().width + 'px';
                };

                var resetFixedHeaderCellStyling = function () {
                    var fixedHeaderCells = fixedHeader.getElementsByTagName('th');
                    var originalHeaderCells = originalHeader.getElementsByTagName('th');
                    for (var i = 0; i < fixedHeaderCells.length; i++) {
                        fixedHeaderCells[i].innerHTML = originalHeaderCells[i].innerHTML;
                    }
                };

                var setUpFixedHeaderCellClickListeners = function () {
                    var fixedHeaderCells = fixedHeader.getElementsByTagName('th');
                    var originalHeaderCells = originalHeader.getElementsByTagName('th');
                    var addListenersToHeaderCellWithIndex = function (index) {
                        angular.element(fixedHeaderCells[index]).bind(eventOnFixedHeaderCells, function (event) {
                            angular.element(originalHeaderCells[index]).triggerHandler(eventOnFixedHeaderCells);
                            resetFixedHeaderCellStyling();
                        });
                    };
                    for (var i = 0; i < fixedHeaderCells.length; i++) {
                        addListenersToHeaderCellWithIndex(i);
                    }
                };

                var setUpListeners = function () {
                    angular.element($window).bind('scroll', setFixedHeaderDivVisibility);
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
                    setFixedHeaderDivVisibility();
                    appendFixedHeaderDivToWrapperDiv();
                    setUpListeners();
                    if (eventOnFixedHeaderCells)
                        setUpFixedHeaderCellClickListeners();
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
