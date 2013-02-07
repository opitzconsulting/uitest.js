uitest.define('documentUtils', [], function() {

    var // Groups:
        // 1. text of all element attributes
        // 2. content of src attribute
        // 3. text content of script element.
        SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>([\s\S]*?)<\/script>/g;

    function serializeDocType(doc) {
        var node = doc.doctype;
        if(!node) {
            return '';
        }
        return "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>';
    }

    function serializeHtmlTag(doc) {
        var el = doc.documentElement,
            i, attr;
        var parts = ['<html'];
        for(i = 0; i < el.attributes.length; i++) {
            attr = el.attributes[i];
            if(attr.value !== undefined) {
                parts.push(attr.name + '="' + attr.value + '"');
            } else {
                parts.push(attr.name);
            }
        }
        return parts.join(" ") + ">";
    }

    function serializeHtmlBeforeLastScript(doc) {
        var innerHtml = doc.documentElement.innerHTML;
        var lastScript = innerHtml.lastIndexOf('<script');
        return serializeDocType(doc) + serializeHtmlTag(doc) + innerHtml.substring(0, lastScript);
    }

    function contentScriptHtml(content) {
        return '<script type="text/javascript">'+content+'</script>';
    }

    function urlScriptHtml(url) {
        return '<script type="text/javascript" src="'+url+'"></script>';
    }

    function loadScript(win, url, resultCallback, async) {
        var xhr = new win.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resultCallback(null, xhr.responseText + "//@ sourceURL=" + url);
                } else {
                    resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.open("GET", url, async);
        xhr.send();
    }

    function evalScript(win, scriptContent) {
        win["eval"].call(win, scriptContent);
    }

    function loadAndEvalScriptSync(win, url) {
        loadScript(win, url, function(error, data) {
            if (error) {
                throw error;
            }
            evalScript(win, data);
        });
    }

    function replaceScripts(html, callback) {
        return html.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
            var result = callback(srcAttribute, textContent);
            if (result===undefined) {
                return match;
            }
            return result;
        });
    }

    function rewriteDocument(win, html) {
        // eval is required here so that the window keeps
        // it's current location.href!
        win.newContent = html;
        win.eval('document.open();document.write(newContent);document.close();');
        win.newContent = '';
    }

    return {
        serializeDocType: serializeDocType,
        serializeHtmlTag: serializeHtmlTag,
        serializeHtmlBeforeLastScript: serializeHtmlBeforeLastScript,
        contentScriptHtml: contentScriptHtml,
        urlScriptHtml: urlScriptHtml,
        loadScript: loadScript,
        evalScript: evalScript,
        loadAndEvalScriptSync: loadAndEvalScriptSync,
        replaceScripts: replaceScripts,
        rewriteDocument: rewriteDocument
    };
});