define('page', function (require) {
    var curPageController = null;
    var hashchangeHandler = function () {
        page.go(page.hashToControllerName(location.hash));
    };

    var _routers = {};
    var page = {
        router: function (path, name) {
            _routers[path] = name;
        },
        go: function (path) {
            var args = [].slice.call(arguments, 1);
            path = path || '';
            var name = _routers[path];
            name = name || ('page.' + path);
            require([name], function (controller) {
                if (curPageController === controller) {
                    return;
                }
                if (curPageController) {
                    curPageController.destroy();
                }
                curPageController = controller;
                controller.init.apply(controller, args);

                if (location.hash.slice(1) !== path) {
                    location.hash = '#' + path;
                }
            });
        },
        hashToControllerName: function (hash) {
            return hash.slice(1);
        },
        init: function () {
            page.go(page.hashToControllerName(location.hash));
        },
        startListenHashChange: function () {
            var $ = require('jquery');
            page.stopListenHashChange();
            $(window).bind('hashchange', hashchangeHandler);
        },
        stopListenHashChange: function () {
            $(window).unbind('hashchange', hashchangeHandler);
        }
    };
    return page;
});