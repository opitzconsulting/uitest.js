(function() {
    function sayHello(userName) {
        return "hello "+userName;
    }

    function testIntercept(userName) {
        return sayHello(userName);
    }

    window.testIntercept = testIntercept;
})();