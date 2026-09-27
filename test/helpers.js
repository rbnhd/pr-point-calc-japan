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

// Mirrors a page load: calc.js runs, then the browser may restore form state from
// history, then pageshow fires. Chromium restores after load and before pageshow,
// and skips controls that are disabled at that moment, so restoredIds does too.
function loadCalculator(restoredIds) {
    var dom = new JSDOM(HTML, { url: 'http://localhost/', runScripts: 'outside-only' });
    var window = dom.window;
    window.matchMedia = function() {
        return { matches: false, addEventListener: function() {}, removeEventListener: function() {} };
    };
    window.eval(SCRIPT);
    (restoredIds || []).forEach(function(id) {
        var input = window.document.getElementById(id);
        if (!input) throw new Error('No element #' + id);
        if (!input.disabled) input.checked = true;
    });
    window.dispatchEvent(new window.Event('pageshow'));

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
