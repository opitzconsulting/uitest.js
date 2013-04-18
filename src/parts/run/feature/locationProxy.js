uitest.define('run/feature/locationProxy', ['proxyFactory', 'run/scriptInstrumentor', 'run/config', 'run/injector', 'run/testframe'], function(proxyFactory, scriptInstrumentor, runConfig, injector, testframe) {
    var changeListeners = [];

    // Attention: order matters here, as the simple "location" token
    // is also contained in the "locationAssign" token!
    scriptInstrumentor.jsParser.addTokenType('locationAssign', '(\\blocation\\s*=)', 'location=', {});
    scriptInstrumentor.jsParser.addSimpleTokenType('location');

    scriptInstrumentor.addPreProcessor(preProcessScript);
    runConfig.prepends.unshift(initFrame);

    locationResolver.priority = 9999;
    injector.addDefaultResolver(locationResolver);

    return {
        addChangeListener: addChangeListener
    };

    function addChangeListener(listener) {
        changeListeners.push(listener);
    }

    function preProcessScript(event, control) {
        if (event.token.type === 'location') {
            event.pushToken({
                type: 'other',
                match: '[locationProxy.test()]()'
            });
        }
        control.next();
    }

    function initFrame(window, location) {
        instrumentLinks(window);
        createLocationProxy(window, location);
    }

    function instrumentLinks(window) {
        var elProto = window.HTMLElement.prototype,
            _fireEvent = elProto.fireEvent,
            _dispatchEvent = elProto.dispatchEvent;

        if (_fireEvent) {
            elProto.fireEvent = checkAfterClick(_fireEvent);
        } else if (_dispatchEvent) {
            elProto.dispatchEvent = checkAfterClick(_dispatchEvent);
        }

        // Need to instrument click to use triggerEvent / fireEvent,
        // as .click does not tell us if the default has been prevented!
        // Note: Some browsers do note support .click, we add it here
        // for all of them :-)
        elProto.click = function newClick() {
            fireEvent(this, 'click');
        };

        function findLinkInParents(elm) {
            while (elm !== null) {
                if (elm.nodeName.toLowerCase() === 'a') {
                    return elm;
                }
                elm = elm.parentNode;
            }
            return elm;
        }

        function checkAfterClick(origTriggerFn) {
            return function() {
                var el = this,
                    link = findLinkInParents(el),
                    origHref = window.location.href;

                var defaultExecuted = origTriggerFn.apply(this, arguments);
                if (defaultExecuted && link) {
                    triggerHrefChange(origHref, el.href);
                }
                return defaultExecuted;
            };

        }
    }

    function createLocationProxy(window, location) {
        var urlResolverLink = window.document.createElement('a');
        var locationProxy = proxyFactory(location, {
            fn: fnInterceptor,
            get: getInterceptor,
            set: setInterceptor
        });
        locationProxy.test = createTestFn(window, location, locationProxy);
        window.locationProxy = locationProxy;

        function makeAbsolute(url) {
            urlResolverLink.href = url;
            return urlResolverLink.href;
        }

        function fnInterceptor(data) {
            var newHref,
            replace = false;
            if (data.name === 'reload') {
                newHref = location.href;
            } else if (data.name === 'replace') {
                newHref = data.args[0] || location.href;
                replace = true;
            } else if (data.name === 'assign') {
                newHref = data.args[0] || location.href;
            }
            if (newHref) {
                triggerLocationChange({
                    oldHref: location.href,
                    newHref: makeAbsolute(newHref),
                    type: 'reload',
                    replace: replace
                });
            }
            return data.delegate.apply(data.self, data.args);
        }

        function getInterceptor(data) {
            return data.self[data.name];
        }

        function setInterceptor(data) {
            var value = data.value,
                oldHref = location.href,
                absHref,
                change = false,
                changeType;
            if (data.name === 'href') {
                change = true;
            } else if (data.name === 'hash') {
                if (!value) {
                    value = '#';
                } else if (value.charAt(0) !== '#') {
                    value = '#' + value;
                }
                change = true;
            }
            if (change) {
                triggerHrefChange(oldHref, makeAbsolute(value));
            }
            data.self[data.name] = data.value;
        }
    }

    function triggerHrefChange(oldHref, newHref) {
        var changeType;
        if (newHref.indexOf('#') === -1 || removeHash(newHref) !== removeHash(oldHref)) {
            changeType = 'reload';
        } else {
            changeType = 'hash';
        }
        triggerLocationChange({
            oldHref: oldHref,
            newHref: newHref,
            type: changeType,
            replace: false
        });
    }

    function removeHash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos === -1) {
            return url;
        }
        return url.substring(0, hashPos);
    }

    function triggerLocationChange(changeEvent) {
        var i;
        for (i = 0; i < changeListeners.length; i++) {
            changeListeners[i](changeEvent);
        }
    }

    function createTestFn(window, location, locationProxy) {
        return function() {
            window.Object.prototype.testLocation = function() {
                delete window.Object.prototype.testLocation;
                if (this === location) {
                    return locationProxy;
                }
                return this;
            };

            return 'testLocation';
        };
    }

    function fireEvent(obj, evt) {
        var fireOnThis = obj,
            doc = obj.ownerDocument,
            evtObj;

        if (doc.createEvent) {
            evtObj = doc.createEvent('MouseEvents');
            evtObj.initEvent(evt, true, true);
            return fireOnThis.dispatchEvent(evtObj);
        } else if (doc.createEventObject) {
            evtObj = doc.createEventObject();
            return fireOnThis.fireEvent('on' + evt, evtObj);
        }
    }

    function locationResolver(propName) {
        var locationProxy = testframe.win().locationProxy;
        if (propName === 'location' && locationProxy) {
            return locationProxy;
        }
    }
});