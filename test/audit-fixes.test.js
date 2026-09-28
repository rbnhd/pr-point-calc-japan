'use strict';

// Regression tests for defects found by an independent audit of calc.js and
// index.html, beyond the original bug report. Rule references are to the MoJ
// points table and the 評価項目・配点 ordinance (930001658.pdf).

var test = require('node:test');
var assert = require('node:assert/strict');
var loadCalculator = require('./helpers').loadCalculator;

function fire(calc, target, type, props) {
    var event = new calc.window.Event(type, { bubbles: true, cancelable: true });
    Object.keys(props || {}).forEach(function(key) {
        Object.defineProperty(event, key, { value: props[key] });
    });
    target.dispatchEvent(event);
    return event;
}

// F-1: the national-qualifications link opened the FOREIGN qualifications list.
test('F-1: national-qualifications legend does not link to the foreign list', function() {
    var calc = loadCalculator();
    var legend = calc.el('qualifications-one').closest('fieldset').querySelector('legend');
    var link = legend.querySelector('a');
    assert.ok(link, 'legend should keep a reference link');
    assert.doesNotMatch(link.href, /930001661/);
});

// F-2: MoJ-designated IT exams/qualifications count, and qualifications must relate to the work.
test('F-2: qualifications section mentions IT exams and the work-relation condition', function() {
    var calc = loadCalculator();
    var text = calc.el('qualifications-one').closest('fieldset').textContent;
    assert.match(text, /IT exam/i);
    assert.match(text, /related to (your|the) work/i);
});

// F-3: "multiple degrees" (+5) needs two or more doctoral/master's/professional degrees.
test('F-3: multiple-degrees bonus requires a master\'s-level degree or higher', function() {
    var calc = loadCalculator();
    assert.equal(calc.el('multiple-degrees').disabled, true);
    calc.select('high-school');
    assert.equal(calc.check('multiple-degrees'), false);
    assert.equal(calc.total(), 0);

    calc.select('masters');
    assert.equal(calc.el('multiple-degrees').disabled, false);
    calc.check('multiple-degrees');
    assert.equal(calc.total(), 25);

    calc.select('bachelors');
    assert.equal(calc.el('multiple-degrees').disabled, true);
    assert.equal(calc.el('multiple-degrees').checked, false);
    assert.equal(calc.total(), 10);
});

test('F-3: restored multiple-degrees without a postgraduate degree is cleared on load', function() {
    var calc = loadCalculator(['bachelors', 'multiple-degrees']);
    assert.equal(calc.el('multiple-degrees').checked, false);
    assert.equal(calc.total(), 10);
});

// F-5: the page must say which track it scores.
test('F-5: the intro names the advanced specialized / technical track', function() {
    var calc = loadCalculator();
    var intro = calc.doc.querySelector('main').textContent;
    assert.match(intro, /advanced specialized \/ technical/i);
    assert.match(intro, /高度専門・技術/);
});

// F-6: Bonus 7 covers any degree from a Japanese institution of higher education.
test('F-6: Japanese-degree label covers any Japanese institution of higher education', function() {
    var calc = loadCalculator();
    var label = calc.doc.querySelector('label[for="japanese-university"]').textContent.replace(/\s+/g, ' ');
    assert.match(label, /institution of higher education/i);
});

// F-7: only experience related to the intended work counts (Note 1).
test('F-7: work experience is labelled as experience related to the intended work', function() {
    var calc = loadCalculator();
    var legend = calc.el('experience-3-5').closest('fieldset').querySelector('legend').textContent;
    assert.match(legend, /related/i);
});

// F-8: a real 0-point selection is a result, not "nothing selected".
test('F-8: a zero-point selection reports 0 points instead of asking for input', function() {
    var calc = loadCalculator();
    calc.select('age-40-above');
    assert.equal(calc.total(), 0);
    assert.match(calc.message(), /You have 0 points/);
    calc.reset();
    assert.match(calc.message(), /Select your criteria/);
});

// F-10: touchcancel must end a drag, or later touchmoves block page scrolling.
test('F-10: touchcancel ends a drag', function() {
    var calc = loadCalculator();
    var box = calc.el('floating-points');
    fire(calc, box, 'touchstart', { touches: [{ clientX: 10, clientY: 10 }] });
    fire(calc, box, 'touchcancel', { touches: [] });
    var move = fire(calc, calc.doc.body, 'touchmove', { touches: [{ clientX: 10, clientY: 300 }] });
    assert.equal(move.defaultPrevented, false);
    assert.equal(box.style.transform, '');
});

// F-11: only the primary mouse button should start a drag.
test('F-11: a right-click does not start a drag', function() {
    var calc = loadCalculator();
    var box = calc.el('floating-points');
    fire(calc, box, 'mousedown', { button: 2, clientX: 10, clientY: 10 });
    fire(calc, calc.doc, 'mousemove', { clientX: 60, clientY: 60 });
    assert.equal(box.style.transform, '');

    fire(calc, calc.doc, 'mouseup');
    fire(calc, box, 'mousedown', { button: 0, clientX: 10, clientY: 10 });
    fire(calc, calc.doc, 'mousemove', { clientX: 60, clientY: 60 });
    assert.equal(box.style.transform, 'translate3d(50px, 50px, 0)');
});
