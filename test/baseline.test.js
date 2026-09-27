'use strict';

// Behaviour already verified against the MoJ points table; guards against regressions.

var test = require('node:test');
var assert = require('node:assert/strict');
var loadCalculator = require('./helpers').loadCalculator;

var AGE_IDS = ['age-under-30', 'age-30-34', 'age-35-39', 'age-40-above'];

// Rows: salary band; columns: under 30, 30-34, 35-39, 40+.
var SALARY_MATRIX = [
    ['salary-10m-plus', [40, 40, 40, 40]],
    ['salary-9-10m', [35, 35, 35, 35]],
    ['salary-8-9m', [30, 30, 30, 30]],
    ['salary-7-8m', [25, 25, 25, 0]],
    ['salary-6-7m', [20, 20, 20, 0]],
    ['salary-5-6m', [15, 15, 0, 0]],
    ['salary-4-5m', [10, 0, 0, 0]],
    ['salary-3-4m', [0, 0, 0, 0]]
];

var AGE_POINTS = [15, 10, 5, 0];

test('age tiers score 15 / 10 / 5 / 0', function() {
    AGE_IDS.forEach(function(id, i) {
        var calc = loadCalculator();
        calc.select(id);
        assert.equal(calc.total(), AGE_POINTS[i], id);
    });
});

test('salary points follow the age-adjusted matrix', function() {
    SALARY_MATRIX.forEach(function(row) {
        AGE_IDS.forEach(function(ageId, col) {
            var calc = loadCalculator();
            calc.select(ageId, row[0]);
            assert.equal(calc.total(), AGE_POINTS[col] + row[1][col], row[0] + ' with ' + ageId);
        });
    });
});

test('work experience tiers score 20 / 15 / 10 / 5 / 0', function() {
    [['experience-10-plus', 20], ['experience-7-10', 15], ['experience-5-7', 10],
        ['experience-3-5', 5], ['experience-less-3', 0]].forEach(function(pair) {
        var calc = loadCalculator();
        calc.select(pair[0]);
        assert.equal(calc.total(), pair[1], pair[0]);
    });
});

test('national qualifications score 5 for one and 10 for more than one', function() {
    var calc = loadCalculator();
    calc.select('qualifications-one');
    assert.equal(calc.total(), 5);
    calc.select('qualifications-multiple');
    assert.equal(calc.total(), 10);
});

test('SME add-on follows the innovation-support bonus', function() {
    var calc = loadCalculator();
    calc.check('innovation-support');
    calc.check('sme');
    assert.equal(calc.total(), 20);
    calc.uncheck('innovation-support');
    assert.equal(calc.el('sme').checked, false);
    assert.equal(calc.el('sme').disabled, true);
    assert.equal(calc.total(), 0);
});

test('JLPT N2 is locked while the Japanese-degree bonus (Bonus 7) is claimed', function() {
    var calc = loadCalculator();
    calc.select('jlpt-n2');
    assert.equal(calc.total(), 10);
    calc.check('japanese-university');
    assert.equal(calc.el('jlpt-n2').disabled, true);
    assert.equal(calc.el('jlpt-n2').checked, false);
    assert.equal(calc.el('jlpt-n2-help').style.display, 'block');
    assert.equal(calc.total(), 10);
    calc.uncheck('japanese-university');
    assert.equal(calc.el('jlpt-n2').disabled, false);
    assert.equal(calc.el('jlpt-n2-help').style.display, 'none');
});

test('additional academic bonuses score 10 / 10 / 5 / 5', function() {
    [['japanese-university', 10], ['highly-reputable', 10], ['multiple-degrees', 5],
        ['designated-training', 5]].forEach(function(pair) {
        var calc = loadCalculator();
        calc.check(pair[0]);
        assert.equal(calc.total(), pair[1], pair[0]);
    });
});

test('organization bonuses score as listed in the MoJ table', function() {
    [['rd-ratio', 5], ['cutting-edge', 10], ['foreign-qualification', 5],
        ['investment-mgmt', 10], ['local-gov-target', 10]].forEach(function(pair) {
        var calc = loadCalculator();
        calc.check(pair[0]);
        assert.equal(calc.total(), pair[1], pair[0]);
    });
});

test('result message tracks the 70 and 80 point thresholds', function() {
    var calc = loadCalculator();
    assert.match(calc.message(), /Select your criteria/);
    calc.select('age-under-30', 'salary-10m-plus', 'experience-5-7');
    assert.equal(calc.total(), 65);
    assert.match(calc.message(), /5 more points to reach the 3-year/);
    calc.select('jlpt-n2');
    assert.equal(calc.total(), 75);
    assert.match(calc.message(), /meets the 3-year route/);
    calc.select('jlpt-n1');
    assert.equal(calc.total(), 80);
    assert.match(calc.message(), /meets the 1-year route/);
});

test('JLPT N1 scores 15', function() {
    var calc = loadCalculator();
    calc.select('jlpt-n1');
    assert.equal(calc.total(), 15);
});

test('reset clears the score and conditional state', function() {
    var calc = loadCalculator();
    calc.select('age-under-30', 'salary-10m-plus', 'japanese-university');
    calc.reset();
    assert.equal(calc.total(), 0);
    assert.equal(calc.el('jlpt-n2').disabled, false);
    assert.equal(calc.el('jlpt-n2-help').style.display, 'none');
});
