/**
 * Usage: <table locked-header bind-event="click" freeze-first-column="true">
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
                    eventOnFixedHeaderCells = attrs.bindEvent,
                    shouldFreezeFirstColumn = attrs.freezeFirstColumn == 'true',
                    freezedColumnTable;

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

                var setFixedHeaderCellsWidth = function () {
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
                            setFixedHeaderCellsWidth();
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

                    var addListenersToOriginalCellWithIndex = function (index) {
                        angular.element(originalHeaderCells[index]).bind(eventOnFixedHeaderCells, function (event) {
                            freezedColumnTable.remove();
                            freezedColumnTable = freezeFirstColumnOfTable(originalTable);
                        });
                    };
                    if (shouldFreezeFirstColumn) {
                        for (i = 0; i < originalHeaderCells.length; i++) {
                            addListenersToOriginalCellWithIndex(i);
                        }
                    }
                };

                var setUpListeners = function () {
                    angular.element($window).bind('scroll', setFixedHeaderDivVisibility);
                    angular.element($window).bind('resize', setFixedHeaderCellsWidth);
                    angular.element($window).bind('resize', setFixedHeaderDivWidth);
                    angular.element(originalTableDiv).bind('scroll', function (event) {
                        fixedHeaderDiv.scrollLeft = event.target.scrollLeft;
                    });
                };

                var setupFixedHeader = function () {
                    setStyles();
                    generateFixedHeader();
                    setFixedHeaderCellsWidth();
                    setFixedHeaderDivVisibility();
                    appendFixedHeaderDivToWrapperDiv();
                    setUpListeners();
                    if (eventOnFixedHeaderCells)
                        setUpFixedHeaderCellClickListeners();
                    if(shouldFreezeFirstColumn) {
                        freezedColumnTable = freezeFirstColumnOfTable(originalTable);
                        freezeFirstColumnOfTable(fixedHeaderTable, {position: 'inherit'});
                    }
                };

                function freezeFirstColumnOfTable(table, styles) {
                    // clone
                    var freezedColumnTableEl = angular.element(table).clone();

                    // add properties
                    freezedColumnTableEl[0].classList.add('freezed-column');
                    freezedColumnTableEl[0].style.backgroundColor = 'white';
                    freezedColumnTableEl[0].style.border = 'none';

                    if(styles) _.each(styles, function (value, key) {
                        freezedColumnTableEl[0].style[key] = value;
                    });

                    // insert freezed table after original table
                    table.parentNode.insertBefore(freezedColumnTableEl[0], table);

                    // remove other cells except first column
                    var elems = freezedColumnTableEl[0].querySelectorAll('th:not(:first-child), td:not(:first-child)');
                    Array.prototype.forEach.call(elems, function( node ) {
                        node.parentNode.removeChild( node );
                    });

                    // fix heights
                    var rows = freezedColumnTableEl[0].querySelectorAll('tr');
                    for (var i = 0; i < rows.length; ++i) {
                        rows[i].style.height = table.querySelectorAll('tr')[i].getBoundingClientRect().height + 'px';
                    }
                    if(rows[0]) {
                        rows[0].querySelector('th').style.width = table.querySelectorAll('thead tr th')[0].getBoundingClientRect().width + 'px';
                    }
                    return freezedColumnTableEl;
                }

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
