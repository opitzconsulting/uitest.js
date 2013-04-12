uitest.define('documentUtils', ['global'], function(global) {

    function serializeDocType(doc) {
        var node = doc.doctype;
        if(!node) {
            return '';
        }
        return "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>';
    }

    function serializeHtmlTag(docEl) {
        var i, attr;
        var parts = ['<html'];
        for(i = 0; i < docEl.attributes.length; i++) {
            attr = docEl.attributes[i];
            if (attr.specified) {
                if(attr.value) {
                    parts.push(attr.name + '="' + attr.value + '"');
                } else {
                    parts.push(attr.name);
                }
            }
        }
        return parts.join(" ") + ">";
    }

    function loadFile(win, url, resultCallback) {
        var xhr = new win.XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) {
                if(xhr.status === 200 || xhr.status === 0) {
                    resultCallback(null, xhr.responseText);
                } else {
                    resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }

    function loadScript(win, url, resultCallback) {
        loadFile(win, url, function(error, data) {
            if (!error) {
                resultCallback(null, data+"//@ sourceURL=" + url);
            } else {
                resultCallback(error, data);
            }
        });
    }

    function evalScript(win, scriptContent) { /*jshint evil:true*/
        win["eval"].call(win, scriptContent);
    }

    function addEventListener(target, type, callback) {
        if (target.addEventListener) {
            target.addEventListener(type, callback, false);
        } else {
            target.attachEvent("on"+type, callback);
        }
    }

    function textContent(el, val) {
        if ("text" in el) {
            el.text = val;
        } else {
            if ("innerText" in el) {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        }
    }

    return {
        serializeDocType: serializeDocType,
        serializeHtmlTag: serializeHtmlTag,
        loadFile: loadFile,
        evalScript: evalScript,
        loadScript: loadScript,
        addEventListener: addEventListener,
        textContent: textContent
    };
});