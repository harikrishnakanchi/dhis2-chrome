define(['xlsx'], function (XLSX) {

    var createWorkBook = function () {

        function s2ab(s) {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        var myWorkBook = {
            SheetNames: ['FooBar'],
            Sheets: {
                FooBar: {
                    A1: {
                        v: 'foo',
                        t: 's'
                    },
                    B1: {
                        v: 'bar',
                        t: 's'
                    },
                    A2: {
                        v: 123,
                        t: 'n'
                    },
                    B2: {
                        v: 456,
                        t: 'n'
                    },
                    '!ref': XLSX.utils.encode_range('A1', 'B2')
                }
            }
        };

        var xlsxWorkBook = XLSX.write(myWorkBook, { bookType:'xlsx', bookSST:true, type: 'binary' });

        return new Blob([s2ab(xlsxWorkBook)], { type: "application/octet-stream" });
    };

    return {
        createWorkBook: createWorkBook
    };
});


