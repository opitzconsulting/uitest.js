(function() {
    function sayHello(userName) {
        return "hello "+userName;
    }

    document.getElementById("greeting").textContent = sayHello("someUser");
})();