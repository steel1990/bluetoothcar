require.config({
    baseUrl: 'js',
    paths: {
        jquery: 'lib/jquery-2.0.3.min',
        xtmpl: 'lib/xtmpl.min',
        hammer: 'lib/hammer.min',
        bluetoothSerial: 'lib/bluetoothSerial'
    }
});

define('loading', ['jquery'], function ($) {
    var loading = $('#widget-loading');
    return {
        show: function () {
            loading.show();
            setTimeout(function () {
                loading.css('opacity', 0.6);
            }, 0);
        },
        hide: function () {
            loading.hide();
        }
    };
});

document.addEventListener('deviceready', function () {
    require(['page'], function (page) {
        page.router('', 'page.bluetooth');
        page.init();
        page.startListenHashChange();
    });
}, false);