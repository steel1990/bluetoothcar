define('page.bluetooth', function (require) {
    var $ = require('jquery');
    var xtmpl = require('xtmpl');
    var loading = require('loading');
    var bluetoothSerial = require('bluetoothSerial');

    var listTmpl = $('#device-list-tmpl').html();
    var listTmplFn = xtmpl.compile(listTmpl);
    var bluetoothList = $('#bluetooth-list');

    var failure = function () {
        loading.hide();
        alert('bluetooth handle failed');
    };
    
    var getClickedBluetooth = function (ele) {
        ele = $(ele);
        if (/^p$/i.test(ele[0].tagName)) {
            ele = ele.parent();
        }
        if (!/^li$/i.test(ele[0].tagName)) {
            return null;
        }

        return {
            address: ele.attr('data-address'),
            name: ele.attr('data-name')
        };
    };

    bluetoothList.click(function (evt) {
        var bluetooth = getClickedBluetooth(evt.target);
        if (!bluetooth) {
            return;
        }

        loading.show();
        bluetoothSerial.connect(bluetooth.address, function () {
            require(['page'], function (page) {
                page.go('controller', bluetoothSerial);
                loading.hide();
            });
        }, function () {
            loading.hide();
            alert('connect to ' + bluetooth.name + ' failed!');
        });
    });

    return {
        init: function () {
            loading.show();
            bluetoothSerial.isEnabled(function (isEnabled) {
                if (!isEnabled) {
                    loading.hide();
                    alert('没有打开蓝牙，请先打开蓝牙！');
                    return;
                }
                bluetoothSerial.list(function (devices) {
                    bluetoothList.html(listTmplFn(devices));
                    $('#page-bluetooth').show();
                    loading.hide();
                }, failure);
            }, failure);
        },
        destroy: function () {
            $('#page-bluetooth').hide();
        }
    };
});