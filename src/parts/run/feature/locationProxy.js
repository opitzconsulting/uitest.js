uitest.define('run/feature/locationProxy', ['proxyFactory', 'run/scriptInstrumentor', 'run/eventSource', 'run/injector', 'run/testframe', 'sniffer'], function(proxyFactory, scriptInstrumentor, eventSource, injector, testframe, sniffer) {
    eventSource.on('addPrepends', function(event, done) {
        event.handlers.push(initFrame);
        done();
    });
    eventSource.on('js:location', function (event, done) {
        event.pushToken({
            type: 'other',
            match: '[locationProxy.test()]()'
        });
        done();
    });

    // Override window.location!
    locationResolver.priority = 99999;
    injector.addDefaultResolver(locationResolver);

    return;

    function initFrame(window, location) {
        instrumentLinks(window);
        createLocationProxy(window, location);
    }

    function instrumentLinks(window) {
        var elProto = window.HTMLElement ? window.HTMLElement.prototype : window.Element.prototype;
        instrumentElementProto(elProto);
        if (window.HTMLButtonElement) {
            // In FF, Buttons have their own dispatchEvent, ... methods
            // In IE10, HTMLButtonElement exists but has the same methods
            // as HTMLElement.
            instrumentElementProto(window.HTMLButtonElement.prototype);
        }

        function instrumentElementProto(elProto) {
            var _fireEvent = elProto.fireEvent,
                _dispatchEvent = elProto.dispatchEvent;
            if (_fireEvent && !_fireEvent.uitest) {
                elProto.fireEvent = checkAfterClick(fixFF684208(_fireEvent));
            }
            if (_dispatchEvent && !_dispatchEvent.uitest) {
                elProto.dispatchEvent = checkAfterClick(fixFF684208(_dispatchEvent));
            }
            // Need to instrument click to use triggerEvent / fireEvent,
            // as .click does not tell us if the default has been prevented!
            // Note: Some browsers do note support .click, we add it here
            // for all of them :-)
            elProto.click = newClick;
        }

        function newClick() {
            fireEvent(this, 'click');
        }

        function findLinkInParents(elm) {
            while (elm !== null) {
                if (elm.nodeName.toLowerCase() === 'a') {
                    return elm;
                }
                elm = elm.parentNode;
            }
            return elm;
        }

        function fixFF684208(origTriggerFn) {
            if (!sniffer.dispatchEventDoesNotReturnPreventDefault) {
                return origTriggerFn;
            }
            result.uitest = true;
            return result;

            function result() {
                var el = this,
                    defaultPrevented = false,
                    originalDefaultExecuted,
                    evtObj = typeof arguments[0] === 'object' ? arguments[0] : arguments[1];

                // TODO care for DOM-Level-0 handlers that return false!
                var _preventDefault = evtObj.preventDefault;
                evtObj.preventDefault = function() {
                    defaultPrevented = true;
                    return _preventDefault.apply(this, arguments);
                };
                origTriggerFn.apply(this, arguments);
                return !defaultPrevented;
            }
        }

        function checkAfterClick(origTriggerFn) {
            result.uitest = true;
            return result;

            function result() {
                var el = this,
                    link = findLinkInParents(el),
                    origHref = window.location.href,
                    defaultExecuted;
                defaultExecuted = origTriggerFn.apply(this, arguments);
                if (defaultExecuted && link) {
                    // Note: calling stopPropagation on a click event that has
                    // been triggered for a child of a link still fires up
                    // the link, although the event is not propagated to the
                    // listeners of the link!
                    // So we don't need to check for stopPropagation here!
                    triggerHrefChange(origHref, link.href);
                }
                return defaultExecuted;
            }

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
                    type: 'loc:reload',
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
            changeType = 'loc:reload';
        } else {
            changeType = 'loc:hash';
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
        eventSource.emit(changeEvent);
    }

    function createTestFn(window, location, locationProxy) {
        // In IE8: location does not inherit from Object.prototype...
        location.testLocation = testLocation;
        // If the locationProxy is copied in a variable named "location".
        locationProxy.testLocation = testLocation;

        return function() {
            window.Object.prototype.testLocation = testLocation;
            return 'testLocation';

        };

        function testLocation() {
            // Note: Calling delete location.testLocation yields
            // to an Error in IE8...
            delete window.Object.prototype.testLocation;
            // Note: In IE8 we can't do a this === location,
            // as this seems to be some wrapper object...
            this.testFlag = true;
            try {
                if (location.testFlag) {
                    return locationProxy;
                }
            } finally {
                delete this.testFlag;
            }
            return this;
        }
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