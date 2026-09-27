'use strict';

// Loads index.html + calc.js into a fresh jsdom window per test, so each test
// drives the real page through the same change events a browser would fire.

var fs = require('node:fs');
var path = require('node:path');
var JSDOM = require('jsdom').JSDOM;

var ROOT = path.join(__dirname, '..');
var HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .replace(/<script src="calc\.js"><\/script>/, '');
var SCRIPT = fs.readFileSync(path.join(ROOT, 'calc.js'), 'utf8');

// beforeScript(document) runs before calc.js, e.g. to simulate form state the
// browser restores on reload or back/forward navigation.
function loadCalculator(beforeScript) {
    var dom = new JSDOM(HTML, { url: 'http://localhost/', runScripts: 'outside-only' });
    var window = dom.window;
    window.matchMedia = function() {
        return { matches: false, addEventListener: function() {}, removeEventListener: function() {} };
    };
    if (beforeScript) beforeScript(window.document);
    window.eval(SCRIPT);

    var doc = window.document;

    function el(id) {
        var node = doc.getElementById(id);
        if (!node) throw new Error('No element #' + id);
        return node;
    }

    function fireChange(node) {
        node.dispatchEvent(new window.Event('change', { bubbles: true }));
    }

    // Mimics a user click: disabled inputs cannot be changed.
    function setChecked(id, checked) {
        var node = el(id);
        if (node.disabled) return false;
        node.checked = checked;
        fireChange(node);
        return true;
    }

    return {
        window: window,
        doc: doc,
        el: el,
        select: function() {
            Array.prototype.forEach.call(arguments, function(id) { setChecked(id, true); });
        },
        check: function(id) { return setChecked(id, true); },
        uncheck: function(id) { return setChecked(id, false); },
        reset: function() { el('reset-button').click(); },
        total: function() { return Number(el('total-points').textContent); },
        totalText: function() { return el('total-points').textContent; },
        message: function() { return el('result-message').textContent; }
    };
}

module.exports = { loadCalculator: loadCalculator };
