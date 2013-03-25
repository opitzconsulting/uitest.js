uitest.define('documentUtils', ['global'], function(global) {

    var // Groups:
    // 1. opening script tag
    // 2. content of src attribute
    // 3. text content of script element.
    SCRIPT_RE = /(<script(?:[^>]*(src=\s*"([^"]+)"))?[^>]*>)([\s\S]*?)<\/script>/ig,
    EMPTY_TAG_RE = /(<([^>\s]+)[^>]*)\/>/ig;

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

    function contentScriptHtml(content) {
        return '<script type="text/javascript">' + content + '</script>';
    }

    function urlScriptHtml(url) {
        return '<script type="text/javascript" src="' + url + '"></script>';
    }

    function loadFile(win, url, async, resultCallback) {
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
        xhr.open("GET", url, async);
        xhr.send();
    }

    function loadScript(win, url, async, resultCallback) {
        loadFile(win, url, async, function(error, data) {
            if (!error) {
                resultCallback(error, data+"//@ sourceURL=" + url);
            } else {
                resultCallback(error, data);
            }
        });
    }

    function evalScript(win, scriptContent) { /*jshint evil:true*/
        win["eval"].call(win, scriptContent);
    }

    function loadAndEvalScriptSync(win, url, preProcessCallback) {
        loadScript(win, url, false, function(error, data) {
            if(error) {
                throw error;
            }
            if(preProcessCallback) {
                data = preProcessCallback(data);
            }
            evalScript(win, data);
        });
    }

    function replaceScripts(html, callback) {
        return html.replace(SCRIPT_RE, function(match, scriptOpenTag, srcAttribute, scriptUrl, textContent) {
            var result = callback({
                match: match,
                scriptOpenTag: scriptOpenTag,
                srcAttribute: srcAttribute||'',
                scriptUrl: scriptUrl||'',
                textContent: textContent
            });
            if(result === undefined) {
                return match;
            }
            return result;
        });
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

    function makeEmptyTagsToOpenCloseTags(html) {
        return html.replace(EMPTY_TAG_RE, function(match, openTag, tagName) {
            return openTag+"></"+tagName+">";
        });
    }

    return {
        serializeDocType: serializeDocType,
        serializeHtmlTag: serializeHtmlTag,
        contentScriptHtml: contentScriptHtml,
        urlScriptHtml: urlScriptHtml,
        loadAndEvalScriptSync: loadAndEvalScriptSync,
        loadFile: loadFile,
        replaceScripts: replaceScripts,
        addEventListener: addEventListener,
        textContent: textContent,
        makeEmptyTagsToOpenCloseTags: makeEmptyTagsToOpenCloseTags
    };
});