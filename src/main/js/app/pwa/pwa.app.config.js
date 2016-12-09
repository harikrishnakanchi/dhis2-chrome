require.config({
    paths: {
        //Utils
        "platformUtils": "app/pwa/pwa.utils",
        "fileSaver": "lib/file-saver/FileSaver",
        "filesystemService": "app/pwa/pwa.filesystem.service"
    },
    waitSeconds: 0,
    shim: {
        'fileSaver': {
            exports: 'saveAs'
        }
    }
});