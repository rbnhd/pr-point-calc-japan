'use strict';

// Regression tests for the scoring defects in local/pr-point-calc-bugs.md, as
// verified against the official MoJ points calculation table
// (https://www.moj.go.jp/isa/content/001398882.pdf, 930001657.pdf).

var test = require('node:test');
var assert = require('node:assert/strict');
var loadCalculator = require('./helpers').loadCalculator;

var RESEARCH_IDS = ['patents', 'research-funding', 'research-papers', 'research-other'];

// BUG-1: on the advanced specialized/technical track, research achievements are
// a flat 15; the "25 points for two or more" footnote applies only to the
// advanced academic research track.
test('BUG-1: research achievements award a flat 15 however many items apply', function() {
    [0, 1, 2, 4].forEach(function(count) {
        var calc = loadCalculator();
        RESEARCH_IDS.slice(0, count).forEach(function(id) { calc.check(id); });
        assert.equal(calc.total(), count === 0 ? 0 : 15, count + ' item(s) checked');
    });
});

test('BUG-1: the research section explains that extra items add nothing', function() {
    var calc = loadCalculator();
    var fieldset = calc.el('patents').closest('fieldset');
    assert.match(fieldset.textContent, /15 points in total/);
});

// BUG-2 (report claim rejected): N2 excludes Bonus 7 (Japanese degree) and
// Bonus 8 (JLPT N1). The MoJ-designated university is Bonus 11, so it must NOT
// lock N2.
test('BUG-2 (not a bug): the MoJ-designated university bonus does not lock N2', function() {
    var calc = loadCalculator();
    calc.check('highly-reputable');
    assert.equal(calc.el('jlpt-n2').disabled, false);
    calc.select('jlpt-n2');
    assert.equal(calc.total(), 20);
});

// BUG-3: 専門職学位 is a professional degree, not 専門学校 (vocational school).
test('BUG-3: master\'s label names professional degrees, not Senmon Gakko', function() {
    var calc = loadCalculator();
    var label = calc.doc.querySelector('label[for="masters"]').textContent;
    assert.doesNotMatch(label, /Senmon Gakko/i);
    assert.match(label, /professional degree/i);
    assert.match(label, /専門職学位/);
});

// BUG-4 (report claim rejected): Note 7 (+5 for MBA/MOT) is attached only to
// the master's row on the technical track, so MBA/MOT = 25 and a doctorate
// stays 30 (35 only with the separate multiple-fields bonus).
test('BUG-4 (not a bug): academic tiers match the technical-track rows', function() {
    [['doctorate', 30], ['professional', 25], ['masters', 20], ['bachelors', 10],
        ['high-school', 0]].forEach(function(pair) {
        var calc = loadCalculator();
        calc.select(pair[0]);
        assert.equal(calc.total(), pair[1], pair[0]);
    });
    var calc = loadCalculator();
    calc.select('doctorate', 'multiple-degrees');
    assert.equal(calc.total(), 35);
});

// BUG-5: an annual salary of at least ¥3M is an eligibility requirement for
// the technical track, not a scoring band.
test('BUG-5: a salary under ¥3M replaces the score with an ineligibility notice', function() {
    var calc = loadCalculator();
    calc.select('age-under-30', 'doctorate', 'experience-10-plus', 'jlpt-n1', 'salary-under-3m');
    assert.equal(Number.isNaN(Number(calc.totalText())), true, 'total should not show a number');
    assert.match(calc.message(), /at least ¥3M/);
    assert.equal(calc.el('progress-bar-fill').style.width, '0%');
    assert.equal(calc.el('floating-points').classList.contains('points-green'), false);

    calc.select('salary-3-4m');
    assert.equal(calc.total(), 80);
    assert.match(calc.message(), /meets the 1-year route/);
});

test('BUG-5: reset clears the ineligible state', function() {
    var calc = loadCalculator();
    calc.select('salary-under-3m');
    calc.reset();
    assert.equal(calc.totalText(), '0');
    assert.match(calc.message(), /Select your criteria/);
});

// BUG-6: an unselected age must not silently use the 40+ salary column.
test('BUG-6: salary with no age selected prompts for age instead of assuming 40+', function() {
    var calc = loadCalculator();
    calc.select('salary-4-5m');
    assert.equal(calc.total(), 0);
    assert.match(calc.message(), /Select your age/);
    calc.select('age-under-30');
    assert.equal(calc.total(), 25);
    assert.doesNotMatch(calc.message(), /Select your age/);
});

test('BUG-6: age-independent salary bands still count before age is chosen', function() {
    var calc = loadCalculator();
    calc.select('salary-10m-plus');
    assert.equal(calc.total(), 40);
    assert.doesNotMatch(calc.message(), /Select your age/);
});

// BUG-7: the SME add-on (Note 3) only applies on top of the innovation bonus,
// but the checkbox was enabled on first page load.
test('BUG-7: SME add-on is disabled on first load and cannot score alone', function() {
    var calc = loadCalculator();
    assert.equal(calc.el('sme').disabled, true);
    calc.check('sme');
    assert.equal(calc.total(), 0);
});

// BUG-8: browsers restore form state on reload and back/forward navigation;
// the page must score and gate that state instead of showing 0.
test('BUG-8: restored form state is scored and gated on load', function() {
    var calc = loadCalculator(function(doc) {
        doc.getElementById('age-under-30').checked = true;
        doc.getElementById('salary-10m-plus').checked = true;
        doc.getElementById('japanese-university').checked = true;
        doc.getElementById('jlpt-n2').checked = true;
        doc.getElementById('sme').checked = true;
    });
    assert.equal(calc.el('jlpt-n2').disabled, true);
    assert.equal(calc.el('jlpt-n2').checked, false);
    assert.equal(calc.el('sme').checked, false);
    assert.equal(calc.el('designated-training-help').style.display, 'block');
    assert.equal(calc.total(), 65);
});

test('BUG-8: a back/forward cache restore re-syncs the page', function() {
    var calc = loadCalculator();
    calc.el('age-under-30').checked = true;
    calc.el('salary-10m-plus').checked = true;
    var PageTransitionEvent = calc.window.PageTransitionEvent || calc.window.Event;
    calc.window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    assert.equal(calc.total(), 55);
});
