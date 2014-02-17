define('page.controller', function (require) {
    var $ = require('jquery');
    var Hammer = require('hammer');

    var controllerPage = $('#page-controller');
    var controllerBar = $('.scene .bar', controllerPage);

    var buttonStatus = null;
    $('#page-controller .buttons').click(function (evt) {
        buttonStatus = $(evt.target).attr('data-status');
    });
    var getSpeedsByButtonStatus = function () {
        switch (buttonStatus) {
            case "left-cycle": return [-255, 255];
            case "right-cycle": return [255, -255];
            case "forward": return [255, 255];
            case "backward": return [-255, -255];
            case "left": return [0, 255];
            case "right": return [255, 0];
            default: return null;
        }
    };

    var speedComputer = function (power, angle) {
        if (power > 1) {
            power = 1;
        }

        // console.log(power, angle);
        lowSpeed = Math.cos(angle / 180 * Math.PI) * power;
        
        if (angle <= 90) {
            speed1 = power;
            speed2 = lowSpeed;
        }
        else if (angle <= 180) {
            speed1 = -power;
            speed2 = lowSpeed;
        }
        else if (angle <= 270) {
            speed2 = -power;
            speed1 = lowSpeed;
        }
        else {
            speed2 = power;
            speed1 = lowSpeed;
        }

        speed1 = Math.round(speed1 * 255);
        speed2 = Math.round(speed2 * 255);
        return [speed1, speed2];
    };

    var bluetoothSerial = null;
    var sendMsgToBluetooth = function () {
        var lastMsg = null;
        var lastMsgId = -1;
        var isLastMsgSendSuccess = true;
        var lastMsgSendTime = 0;

        function checksum (str) {
            var sum = 0;
            for (var i = str.length - 1; i >= 0; i -= 1) {
                sum += str.charCodeAt(i);
            }
            sum = sum % 11;
            sum = (12 - sum) % 11;
            if (sum === 10) {
                sum = 'x';
            }
            return sum;
        }

        return function (msg) {
            if (!bluetoothSerial) {
                console.log(msg);
                return;
            }

            if (!isLastMsgSendSuccess && new Date() - lastMsgSendTime > 1000) {
                lastMsg = null;
                isLastMsgSendSuccess = true;
                lastMsgSendTime = 0;
            } else if (!isLastMsgSendSuccess || msg === lastMsg) {
                return;
            }
            
            lastMsgId = (lastMsgId + 1) % 10;

            bluetoothSerial.clear();
            if (isLastMsgSendSuccess) {
                bluetoothSerial.subscribe('\n', function (data) {
                    data = data.replace(/^\s*/, '').replace(/\s*$/, '');
                    console.log('recive:' + data);
                    var expert = '--msg-recive-ok-' + lastMsgId + '--';
                    console.log('recive-check:' + (expert === data) + ';' + data.length);
                    if ('--msg-recive-ok-' + lastMsgId + '--' === data) {
                        isLastMsgSendSuccess = true;
                        bluetoothSerial.unsubscribe();
                    }
                });
            }

            isLastMsgSendSuccess = false;
            lastMsgSendTime = new Date().getTime();
            var msgToSend = '--msg-|-' + msg + '-|-' + checksum(msg) + '-' + lastMsgId + '--\n';
            console.log('send:' + msgToSend);
            bluetoothSerial.write(msgToSend);
        }
    }();

    var initDrag = function (onStatusChange) {
        var controllerRods = $('.scene .rods', controllerPage);

        var setSceneCss = function (deltaX, deltaY) {
            controllerBar.css({
                top: 21 + deltaY,
                left: 21 + deltaX
            });
            controllerRods.css({
                top: 38 + deltaY / 5,
                left: 38 + deltaX / 5
            });
        };

        var hammertime = Hammer(controllerBar[0]);
        hammertime.on('dragstart', function (evt) {
            console.log('dragstart');
        });
        hammertime.on('drag', function (evt) {
            var deltaX = evt.gesture.deltaX;
            var deltaY = evt.gesture.deltaY;
            var distance = evt.gesture.distance;
            var angle = evt.gesture.angle;

            if (distance > 40) {
                deltaX = 40 * Math.cos(angle / 180 * Math.PI);
                deltaY = 40 * Math.sin(angle / 180 * Math.PI);
            }

            setSceneCss(deltaX, deltaY);

            onStatusChange(distance, angle);
        });
        hammertime.on('dragend', function (evt) {
            console.log('dragend');
            setSceneCss(0, 0);
            onStatusChange(0, 0);
        });
    };

    var curStatus = {
        power: 0,
        angle: 0
    };

    initDrag(function(distance, angle) {
        buttonStatus = null;
        curStatus.power = distance / 40;
        if (curStatus.power > 1) {
            curStatus.power = 1;
        }
        
        if (angle !== 0) {
            angle += 90;
            if (angle < 0) {
                angle += 360;
            }
        }

        curStatus.angle = angle;
    });

    var msgSendIntervalId = 0;
    return {
        init: function (bts) {
            bluetoothSerial = bts;
            controllerPage.show();

            msgSendIntervalId = setInterval(function () {
                var speeds = getSpeedsByButtonStatus();
                if (!speeds) {
                    speeds = speedComputer(curStatus.power, curStatus.angle);
                }
                sendMsgToBluetooth('speed:' + speeds.join(','));
            }, 200);
        },
        destroy: function () {
            if (bluetoothSerial) {
                bluetoothSerial.clear();
                bluetoothSerial.unsubscribe();
                bluetoothSerial.disconnect();
            }

            clearInterval(msgSendIntervalId);
            controllerPage.hide();
        }
    };
});