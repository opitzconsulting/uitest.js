jasmineui.define('htmlParserFactory', [], function () {
    // Attention: htmlParserFactory will be used in an eval statement,
    // so all dependencies must be contained in this factory!

    function htmlParserFactory() {
        // Groups:
        // 1. text of all element attributes
        // 2. content of src attribute
        // 3. text content of script element.
        var SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>([\s\S]*?)<\/script>/g;

        function replaceScripts(html, callback) {
            return html.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
                var result = callback(srcAttribute, textContent);
                if (result===undefined) {
                    return match;
                }
                return result;
            });
        }

        function convertScriptContentToEvalString(textContent) {
            textContent = textContent.replace(/"/g, '\\"');
            textContent = textContent.replace(/\r/g, '');
            textContent = textContent.replace(/\n/g, '\\\n');
            return '"'+textContent+'"';
        }

        function serializeDocType(doc) {
          var node = doc.doctype;
          if (!node) {
            return '';
          }
          return "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') +
            (!node.publicId && node.systemId ? ' SYSTEM' : '') +
            (node.systemId ? ' "' + node.systemId + '"' : '') + '>';
        }

        function serializeHtmlTag(doc) {
          var el = doc.documentElement,
              i, attr;
          var parts = ['<html'];
          for (i=0; i<el.attributes.length; i++) {
            attr = el.attributes[i];
            if (attr.value!==undefined) {
              parts.push(attr.name+'="'+attr.value+'"');
            } else {
              parts.push(attr.name);
            }
          }
          return parts.join(" ")+">";
        }

        function serializeHtmlBeforeCurrentScript(doc) {
            var innerHtml = doc.documentElement.innerHTML;
            var lastScript = innerHtml.lastIndexOf('<script>');
            return serializeDocType(doc) + serializeHtmlTag(doc) + innerHtml.substring(0, lastScript);
        }

        return {
            convertScriptContentToEvalString: convertScriptContentToEvalString,
            replaceScripts:replaceScripts,
            serializeDocType:serializeDocType,
            serializeHtmlTag:serializeHtmlTag,
            serializeHtmlBeforeCurrentScript:serializeHtmlBeforeCurrentScript
        };

    }

    return htmlParserFactory;


});
