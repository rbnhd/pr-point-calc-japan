'use strict';

// ===== DOM Element References =====
var form = document.getElementById('calculator-form');
var totalPointsElement = document.getElementById('total-points');
var innovationSupportCheckbox = document.getElementById('innovation-support');
var smeCheckbox = document.getElementById('sme');
var progressBarFill = document.getElementById('progress-bar-fill');
var resultMessage = document.getElementById('result-message');
var resetButton = document.getElementById('reset-button');
var floatingPointsElement = document.getElementById('floating-points');
var darkModeSwitch = document.getElementById('dark-mode-switch');
var japaneseUniversityCheckbox = document.getElementById('japanese-university');
var jlptN2Radio = document.getElementById('jlpt-n2');
var jlptN2Help = document.getElementById('jlpt-n2-help');
var designatedTrainingHelp = document.getElementById('designated-training-help');
var progressMarker70 = document.getElementById('progress-marker-70');
var progressMarker80 = document.getElementById('progress-marker-80');
var progressMaxLabel = document.getElementById('progress-max-label');
var salaryUnder3MRadio = document.getElementById('salary-under-3m');
var multipleDegreesCheckbox = document.getElementById('multiple-degrees');

// ===== Scoring Constants =====
var RESEARCH_ACHIEVEMENT_POINTS = 15;
var MASTERS_LEVEL_POINTS = 20;

// ===== Drag State =====
var isDragging = false;
var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;

// ===== Event Listeners =====
form.addEventListener('change', calculatePoints);
innovationSupportCheckbox.addEventListener('change', toggleSMECheckbox);
resetButton.addEventListener('click', resetCalculator);
japaneseUniversityCheckbox.addEventListener('change', toggleJLPTN2Radio);
japaneseUniversityCheckbox.addEventListener('change', toggleDesignatedTrainingHelp);
Array.from(form.elements.academic).forEach(function(radio) {
    radio.addEventListener('change', toggleMultipleDegreesCheckbox);
});
floatingPointsElement.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('mouseleave', dragEnd);
floatingPointsElement.addEventListener('touchstart', dragStart, { passive: false });
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('touchend', dragEnd);
document.addEventListener('touchcancel', dragEnd);
darkModeSwitch.addEventListener('change', toggleDarkMode);
window.addEventListener('pageshow', syncFormState);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem('theme')) {
        applyTheme(e.matches);
    }
});

// ===== Point Calculation =====
/**
 * Calculates total PR points by summing values from all form sections.
 * Called on every form change event.
 */
function calculatePoints() {
    if (!form.querySelector('input:checked')) {
        showEmptyResult();
        return;
    }

    if (salaryUnder3MRadio.checked) {
        showIneligibleResult();
        return;
    }

    // An empty age group must not fall through to the 40+ salary column (age value 0).
    var ageSelected = form.elements.age.value !== '';
    var age = parseInt(form.elements.age.value, 10) || 0;
    var academic = parseInt(form.elements.academic.value, 10) || 0;
    var additionalAcademic = Array.from(form.elements['additional-academic']).reduce(function(sum, checkbox) {
        // "Multiple degrees" needs two or more doctoral/master's/professional degrees.
        var counts = checkbox.checked && (checkbox !== multipleDegreesCheckbox || hasMastersLevelDegree());
        return sum + (counts ? parseInt(checkbox.value, 10) : 0);
    }, 0);
    var experience = parseInt(form.elements.experience.value, 10) || 0;
    var additionalOrganization = Array.from(form.elements['additional-organization']).reduce(function(sum, checkbox) {
        // The SME add-on (Note 3) only applies on top of the innovation-support bonus.
        var counts = checkbox.checked && (checkbox !== smeCheckbox || innovationSupportCheckbox.checked);
        return sum + (counts ? parseInt(checkbox.value, 10) : 0);
    }, 0);
    var salary = calculateSalaryPoints(ageSelected ? age : null);
    var salaryAwaitingAge = !ageSelected && isAgeDependent(getSalaryRow());
    var japaneseProficiency = parseInt(form.elements['japanese-proficiency'].value, 10) || 0;
    // Flat 15 on the technical track; the 25-point "two or more items" rule applies only to academic research.
    var researchAchievements = Array.from(form.elements['research-achievements']).some(function(checkbox) {
        return checkbox.checked;
    }) ? RESEARCH_ACHIEVEMENT_POINTS : 0;
    var qualifications = parseInt(form.elements.qualifications.value, 10) || 0;

    var totalPoints = age + academic + additionalAcademic + experience + additionalOrganization + salary + japaneseProficiency + researchAchievements + qualifications;

    totalPointsElement.textContent = totalPoints;
    updateFloatingPointsColor(totalPoints);
    updateProgressBar(totalPoints);
    updateResultMessage(totalPoints, salaryAwaitingAge);
}

/**
 * Shows the neutral starting state used before anything is selected.
 */
function showEmptyResult() {
    totalPointsElement.textContent = '0';
    floatingPointsElement.classList.remove('points-red', 'points-yellow-green', 'points-green');
    updateProgressBar(0);
    resultMessage.classList.remove('result-under-70', 'result-70-to-79', 'result-80-plus');
    resultMessage.textContent = 'Select your criteria above to calculate points.';
}

/**
 * Replaces the score with an ineligibility notice. The technical track requires an
 * annual salary of at least JPY 3M, so no point total qualifies below it.
 */
function showIneligibleResult() {
    totalPointsElement.textContent = 'N/A';
    updateFloatingPointsColor(0);
    updateProgressBar(0);
    resultMessage.classList.remove('result-under-70', 'result-70-to-79', 'result-80-plus');
    resultMessage.textContent = 'Not eligible: the advanced specialized / technical track requires an annual salary of at least ¥3M. Points cannot be counted below this minimum.';
    resultMessage.classList.add('result-under-70');
}

// ===== Salary-Age Matrix =====
/**
 * Returns salary points adjusted for age bracket.
 * Japan's HSP system reduces salary points for older applicants at lower salary bands.
 *
 * Matrix rows = salary brackets (JPY 10M+ down to JPY 3-4M).
 * Matrix cols = age brackets (under 30, 30-34, 35-39, 40+).
 * Higher salary bands award full points regardless of age.
 * Lower salary bands award 0 points for older age brackets.
 *
 * With no age selected, only bands that score the same for every age count.
 *
 * @param {?number} age - The age point value from the form (15, 10, 5, or 0), or null if unselected
 * @returns {number} The adjusted salary points
 */
function calculateSalaryPoints(age) {
    var row = getSalaryRow();

    if (age === null) {
        return isAgeDependent(row) ? 0 : row[0];
    }

    return row[getAgeIndex(age)];
}

function getSalaryRow() {
    var salary = parseInt(form.elements.salary.value, 10) || 0;
    var salaryPoints = [
        [40, 40, 40, 40],
        [35, 35, 35, 35],
        [30, 30, 30, 30],
        [25, 25, 25, 0],
        [20, 20, 20, 0],
        [15, 15, 0, 0],
        [10, 0, 0, 0],
        [0, 0, 0, 0]
    ];

    return salaryPoints[getSalaryIndex(salary)];
}

function isAgeDependent(row) {
    return row.some(function(points) {
        return points !== row[0];
    });
}

function getAgeIndex(age) {
    if (age === 15) return 0;
    if (age === 10) return 1;
    if (age === 5) return 2;
    return 3;
}

function getSalaryIndex(salary) {
    if (salary === 40) return 0;
    if (salary === 35) return 1;
    if (salary === 30) return 2;
    if (salary === 25) return 3;
    if (salary === 20) return 4;
    if (salary === 15) return 5;
    if (salary === 10) return 6;
    return 7;
}

// ===== Form Interaction Logic =====
function toggleSMECheckbox() {
    if (innovationSupportCheckbox.checked) {
        smeCheckbox.disabled = false;
    } else {
        smeCheckbox.disabled = true;
        smeCheckbox.checked = false;
    }
}

function toggleJLPTN2Radio() {
    if (japaneseUniversityCheckbox.checked) {
        jlptN2Radio.disabled = true;
        jlptN2Radio.checked = false;
        jlptN2Help.style.display = 'block';
    } else {
        jlptN2Radio.disabled = false;
        jlptN2Help.style.display = 'none';
    }
}

function hasMastersLevelDegree() {
    return (parseInt(form.elements.academic.value, 10) || 0) >= MASTERS_LEVEL_POINTS;
}

function toggleMultipleDegreesCheckbox() {
    if (hasMastersLevelDegree()) {
        multipleDegreesCheckbox.disabled = false;
    } else {
        multipleDegreesCheckbox.disabled = true;
        multipleDegreesCheckbox.checked = false;
    }
}

function toggleDesignatedTrainingHelp() {
    designatedTrainingHelp.style.display = japaneseUniversityCheckbox.checked ? 'block' : 'none';
}

/**
 * True when the page was opened by a normal navigation, so the browser has no
 * history form state to restore.
 */
function isFreshNavigation() {
    var entries = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
    return entries.length > 0 && entries[0].type === 'navigate';
}

/**
 * Re-applies all conditional UI state and recalculates from the current form values.
 * Browsers restore form state on reload and back/forward navigation without firing
 * change events, so this runs on every pageshow (including first load) and after reset.
 */
function syncFormState() {
    toggleSMECheckbox();
    toggleMultipleDegreesCheckbox();
    toggleJLPTN2Radio();
    toggleDesignatedTrainingHelp();
    calculatePoints();
}

// ===== Progress Bar & Results =====
/**
 * Updates the progress bar width and color based on current points.
 * @param {number} points - Current total points
 */
function updateProgressBar(points) {
    var scaleMax = getProgressScaleMax(points);
    var percentage = Math.min((points / scaleMax) * 100, 100);

    progressBarFill.style.width = percentage + '%';
    progressMaxLabel.textContent = scaleMax;
    positionProgressMarkers(scaleMax);

    if (points < 70) {
        progressBarFill.style.backgroundColor = '#cf222e';
    } else if (points < 80) {
        progressBarFill.style.backgroundColor = '#2da44e';
    } else {
        progressBarFill.style.backgroundColor = '#1a7f37';
    }
}

function getProgressScaleMax(points) {
    if (points <= 100) {
        return 100;
    }

    return Math.min(Math.ceil(points / 50) * 50, 300);
}

function positionProgressMarkers(scaleMax) {
    var marker70Position = Math.min((70 / scaleMax) * 100, 100);
    var marker80Position = Math.min((80 / scaleMax) * 100, 100);

    progressMarker70.style.left = marker70Position + '%';
    progressMarker80.style.left = marker80Position + '%';
}

/**
 * Updates the result message text and styling based on point thresholds.
 * @param {number} points - Current total points
 * @param {boolean} [salaryAwaitingAge] - True when a salary band needs an age to be scored
 */
function updateResultMessage(points, salaryAwaitingAge) {
    var ageHint = 'Select your age to include salary points.';

    resultMessage.classList.remove('result-under-70', 'result-70-to-79', 'result-80-plus');

    if (points < 70) {
        resultMessage.textContent = 'You have ' + points + ' points. You need ' + (70 - points) + ' more points to reach the 3-year threshold. For PR eligibility, we must maintain 70+ points continuously for 3 years before the application date.';
        resultMessage.classList.add('result-under-70');
    } else if (points < 80) {
        resultMessage.textContent = 'You have ' + points + ' points. This meets the 3-year route threshold if we maintain 70+ continuously for 3 years before applying. You need ' + (80 - points) + ' more points to target the 1-year route.';
        resultMessage.classList.add('result-70-to-79');
    } else {
        resultMessage.textContent = 'You have ' + points + ' points. This meets the 1-year route threshold if we maintain 80+ continuously for 1 year immediately before applying.';
        resultMessage.classList.add('result-80-plus');
    }

    if (salaryAwaitingAge) {
        resultMessage.textContent += ' ' + ageHint;
    }
}

// ===== Reset =====
/**
 * Resets the calculator form, points display, progress bar, and all
 * conditional UI states (SME checkbox, JLPT N2 radio, drag position).
 */
function resetCalculator() {
    form.reset();
    syncFormState();
    xOffset = 0;
    yOffset = 0;
    floatingPointsElement.style.transform = '';
}

// ===== Floating Points Color & Dragging =====
function updateFloatingPointsColor(points) {
    if (points < 70) {
        floatingPointsElement.classList.remove('points-yellow-green', 'points-green');
        floatingPointsElement.classList.add('points-red');
    } else if (points < 80) {
        floatingPointsElement.classList.remove('points-red', 'points-green');
        floatingPointsElement.classList.add('points-yellow-green');
    } else {
        floatingPointsElement.classList.remove('points-red', 'points-yellow-green');
        floatingPointsElement.classList.add('points-green');
    }
}

function dragStart(e) {
    if (window.innerWidth <= 768) return;
    if (e.type === 'mousedown' && e.button !== 0) return;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    initialX = clientX - xOffset;
    initialY = clientY - yOffset;

    if (e.target === floatingPointsElement || floatingPointsElement.contains(e.target)) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        currentX = clientX - initialX;
        currentY = clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, floatingPointsElement);
    }
}

function dragEnd() {
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0)';
}

// ===== Dark Mode =====
/**
 * Initializes the theme based on saved localStorage preference
 * or browser's prefers-color-scheme setting.
 */
function initializeTheme() {
    var savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        applyTheme(savedTheme === 'dark');
    } else {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark);
    }
}

function applyTheme(isDark) {
    var body = document.body;
    if (isDark) {
        body.classList.add('dark-mode');
        darkModeSwitch.checked = true;
    } else {
        body.classList.remove('dark-mode');
        darkModeSwitch.checked = false;
    }
}

function toggleDarkMode() {
    var body = document.body;
    var isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ===== Initialization =====
initializeTheme();
// On back/forward (and reload), Chromium restores form state after this script runs and
// skips disabled controls, so gating waits for pageshow, which also fires on first load.
// A fresh navigation has nothing to restore, so gate at once rather than after slow assets.
if (isFreshNavigation()) {
    syncFormState();
}
