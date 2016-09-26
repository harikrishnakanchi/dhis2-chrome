define(['JSZip'], function (JSZip) {
    window.cptable = {}; //To satisfy NodeJS when running specs with Karma
    window.JSZip = JSZip; //To satisfy JSZip dependency within js-xlsx
});