describe('run/testframe', function() {
	var global, body, topFrame, iframeElement, uitestwindow;
	beforeEach(function() {
		uitestwindow = {
			location: {},
			close: jasmine.createSpy('close')
		};
		body = {
			appendChild: jasmine.createSpy('appendChild'),
			removeChild: jasmine.createSpy('removeChild'),
			style: {}
		};
		iframeElement = {
			setAttribute: jasmine.createSpy('setAttribute'),
			parentElement: body,
			contentWindow: uitestwindow
		};
		topFrame = {
			document: {
				body: body,
				createElement: jasmine.createSpy('createElement').andReturn(iframeElement),
				getElementById: jasmine.createSpy('getElementById')
			}
		};
		global = {
			top: topFrame,
			uitest: {}
		};
	});
	it('should publish the uitest module to the top frame', function() {
		uitest.require({
			global: global,
			"run/config": {
				url: 'someUrl'
			}
		}, ["run/testframe"]);
		expect(global.top.uitest).toBe(global.uitest);

	});
	it('should create an iframe in the top frame on first module creation', function() {
		var testframe = uitest.require({
			global: global,
			"run/config": {
				url: 'someUrl'
			}
		}, ["run/testframe"])["run/testframe"];
		expect(body.appendChild).toHaveBeenCalledWith(iframeElement);
		expect(iframeElement.setAttribute).toHaveBeenCalledWith("id", "uitestwindow");
		expect(testframe).toBe(uitestwindow);
	});
	it('should reuse an existing iframe in the top frame by its id', function() {
		topFrame.document.getElementById.andReturn(iframeElement);
		var testframe = uitest.require({
			global: global,
			"run/config": {
				url: 'someUrl'
			}
		}, ["run/testframe"])["run/testframe"];
		expect(body.appendChild).not.toHaveBeenCalled();
		expect(testframe).toBe(uitestwindow);
	});
	it('should set the location.href on the first call', function() {
		uitest.require({
			global: global,
			"run/config": {
				url: 'someUrl'
			}
		}, ["run/testframe"]);
		expect(uitestwindow.location.href).toBe("someUrl?uitr=1");
		expect(topFrame.uitestwindowRefreshCounter).toBe(1);
	});
	it('should set the location.href on further calls', function() {
		topFrame.uitestwindowRefreshCounter = 10;
		uitest.require({
			global: global,
			"run/config": {
				url: 'someUrl'
			}
		}, ["run/testframe"]);
		expect(uitestwindow.location.href).toBe("someUrl?uitr=11");
	});
});

