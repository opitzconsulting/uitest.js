jasmineui.require(['factory!client/simulateEvent'], function (simulateFactory) {

    describe("simulateEvent", function () {
        var simulate, el, globals;
        beforeEach(function () {
            globals = {
                jasmineui: {}
            };
            simulate = simulateFactory({
                globals: globals
            }).globals.jasmineui.simulate;
        });
        afterEach(function () {
            el.parentNode.removeChild(el);
        });

        /**
         * Tests the event.
         * @param type
         * @param inputElement
         */
        function testEvent(type, inputElement) {
            var received = false;
            if (inputElement) {
                el = document.createElement("input");
                el.type = "text";
            } else {
                el = document.createElement("div");
            }
            el.id = "si1";
            document.body.appendChild(el);

            el.addEventListener(type, function () {
                received = true;
            }, false);
            simulate(el, type);
            expect(received).toEqual(true);
        }

        it('should fire mouseup event', function () {
            testEvent('mouseup');
        });
        it('should fire mousedown event', function () {
            testEvent('mousedown');
        });
        it('should fire click event', function () {
            testEvent('click');
        });
        it('should fire dblclick event', function () {
            testEvent('dblclick');
        });
        it('should fire mouseover event', function () {
            testEvent('mouseover');
        });
        it('should fire mouseout event', function () {
            testEvent('mouseout');
        });
        it('should fire mousemove event', function () {
            testEvent('mousemove');
        });
        it('should fire keydown event', function () {
            testEvent('keydown');
        });
        it('should fire keyup event', function () {
            testEvent('keyup');
        });
        it('should fire keypress event', function () {
            testEvent('keypress');
        });
        it('should fire change event', function () {
            testEvent('change', true);
        });
        it('should fire blur event', function () {
            testEvent('blur', true);
        });
    });
});
