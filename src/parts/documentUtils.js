uitest.define('documentUtils', ['global'], function(global) {

    var // Groups:
        // 1. opening script tag
        // 2. content of src attribute
        // 3. text content of script element.
        SCRIPT_RE = /(<script(?:[^>]*src=\s*"([^"]+))?[^>]*>)([\s\S]*?)<\/script>/g,
        UI_TEST_RE = /(uitest|simpleRequire)[^\w\/][^\/]*$/;

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

    function loadScript(win, url, async, resultCallback) {
        var xhr = new win.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
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
        /*jshint evil:true*/
        win["eval"].call(win, scriptContent);
    }

    function loadAndEvalScriptSync(win, url, preProcessCallback) {
        loadScript(win, url, false, function(error, data) {
            if (error) {
                throw error;
            }
            if (preProcessCallback) {
                data = preProcessCallback(data);
            }
            evalScript(win, data);
        });
    }

    function replaceScripts(html, callback) {
        return html.replace(SCRIPT_RE, function (match, scriptOpenTag, srcAttribute, textContent) {
            var result = callback(scriptOpenTag, srcAttribute||'', textContent);
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
        /*jshint evil:true*/
        evalScript(win, 'document.open();document.write(newContent);document.close();');
        win.newContent = '';
    }

    function uitestUrl() {
        var scriptNodes = global.document.getElementsByTagName("script"),
            i, src;
        for(i = 0; i < scriptNodes.length; i++) {
            src = scriptNodes[i].src;
            if (src && src.match(UI_TEST_RE)) {
                return src;
            }
        }
        throw new Error("Could not locate uitest.js in the script tags of the browser");
    }

    function basePath(url) {
        var lastSlash = url.lastIndexOf('/');
        if (lastSlash===-1) {
            return '';
        }
        return url.substring(0, lastSlash);
    }

    function makeAbsoluteUrl(url, baseUrl) {
        if (url.charAt(0)==='/' || url.indexOf('://')!==-1) {
            return url;
        }
        return basePath(baseUrl)+'/'+url;
    }

    return {
        serializeDocType: serializeDocType,
        serializeHtmlTag: serializeHtmlTag,
        serializeHtmlBeforeLastScript: serializeHtmlBeforeLastScript,
        contentScriptHtml: contentScriptHtml,
        urlScriptHtml: urlScriptHtml,
        loadAndEvalScriptSync: loadAndEvalScriptSync,
        replaceScripts: replaceScripts,
        rewriteDocument: rewriteDocument,
        makeAbsoluteUrl: makeAbsoluteUrl,
        uitestUrl: uitestUrl
    };
});