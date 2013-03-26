var commands = [];
installDirectClient();

addCommandHandler("GET", "/session/*", function(clientId) {
    console.log("get session: ",clientId);
    return 1;
});

addCommandHandler("GET", "/session/*", function(clientId) {
    console.log("get session: ",clientId);
    return 1;
});

function addCommandHandler(method, path, callback) {
    path = path.replace("*", "([^/]*)");
    path = path.replace("/", "\/");
    var pattern = new RegExp(method+path);
    commands.push({        
        pattern: pattern,
        handler: callback
    });
}

function findAndExecuteCommand(method, path, data) {
    var i, match,
        input = method+path;

    for (i=0; i<commands.length; i++) {
        match = input.match(commands[i].pattern);
        if (match) {
            return commands[i].handler.apply(window, match.slice(1), data);
        }
    }
    throw new Error("Unknown command: "+method+" "+path);
}

function installDirectClient() {
    var client = webdriver.http.CorsClient;
    client.prototype.send = function(req, resultCallback) {
        try {
            console.log("request...",req);
            var result = findAndExecuteCommand(req.method, req.path, req.data);
            if (result) {
                result = JSON.stringify({
                    status: bot.ErrorCode.SUCCESS, 
                    value: result
                });
            } else {
                result = "";
            }
            resultCallback(null, new webdriver.http.Response(200, {}, result));
        } catch (e) {
           resultCallback(e); 
        }
    };
    client.prototype.isAvailable = function() {
        return true;
    };
}
