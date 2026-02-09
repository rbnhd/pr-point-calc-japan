
const form = document.getElementById('calculator-form');
const totalPointsElement = document.getElementById('total-points');
const innovationSupportCheckbox = document.getElementById('innovation-support');
const smeCheckbox = document.getElementById('sme');
const progressBarFill = document.getElementById('progress-bar-fill');
const resultMessage = document.getElementById('result-message');
const resetButton = document.getElementById('reset-button');

form.addEventListener('change', calculatePoints);
innovationSupportCheckbox.addEventListener('change', toggleSMECheckbox);
resetButton.addEventListener('click', resetCalculator);


function calculatePoints() {
    const age = parseInt(form.elements['age'].value) || 0;
    const academic = parseInt(form.elements['academic'].value) || 0;
    const additionalAcademic = Array.from(form.elements['additional-academic']).reduce((sum, checkbox) => sum + (checkbox.checked ? parseInt(checkbox.value) : 0), 0);
    const experience = parseInt(form.elements['experience'].value) || 0;
    const additionalOrganization = Array.from(form.elements['additional-organization']).reduce((sum, checkbox) => sum + (checkbox.checked ? parseInt(checkbox.value) : 0), 0);
    const salary = calculateSalaryPoints(age);
    const japaneseProficiency = parseInt(form.elements['japanese-proficiency'].value) || 0;
    const researchAchievements = Array.from(form.elements['research-achievements']).reduce((sum, checkbox) => sum + (checkbox.checked ? parseInt(checkbox.value) : 0), 0);
    const qualifications = parseInt(form.elements['qualifications'].value) || 0;

    const totalPoints = age + academic + additionalAcademic + experience + additionalOrganization + salary + japaneseProficiency + researchAchievements + qualifications;

    totalPointsElement.textContent = totalPoints;

    updateFloatingPointsColor(totalPoints);
    updateProgressBar(totalPoints);
    updateResultMessage(totalPoints);
}

function calculateSalaryPoints(age) {
    const salary = parseInt(form.elements['salary'].value) || 0;
    const salaryPoints = [
        [40, 40, 40, 40],
        [35, 35, 35, 35],
        [30, 30, 30, 30],
        [25, 25, 25, 0],
        [20, 20, 20, 0],
        [15, 15, 0, 0],
        [10, 0, 0, 0],
        [0, 0, 0, 0]
    ];

    const ageIndex = getAgeIndex(age);
    const salaryIndex = getSalaryIndex(salary);

    return salaryPoints[salaryIndex][ageIndex];
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

function toggleSMECheckbox() {
    if (innovationSupportCheckbox.checked) {
        smeCheckbox.disabled = false;
    } else {
        smeCheckbox.disabled = true;
        smeCheckbox.checked = false;
    }
}

// Toggle JLPT N2 button based on japanese university degree
const japaneseUniversityCheckbox = document.getElementById('japanese-university');
const jlptN2Radio = document.getElementById('jlpt-n2');
const jlptN2Help = document.getElementById('jlpt-n2-help');

japaneseUniversityCheckbox.addEventListener('change', toggleJLPTN2Radio);

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

// Update Total points color based on result
function updateFloatingPointsColor(points) {
    if (points < 70) {
        floatingPointsElement.classList.remove('points-yellow-green', 'points-green');
        floatingPointsElement.classList.add('points-red');
    } else if (points >= 70 && points < 80) {
        floatingPointsElement.classList.remove('points-red', 'points-green');
        floatingPointsElement.classList.add('points-yellow-green');
    } else {
        floatingPointsElement.classList.remove('points-red', 'points-yellow-green');
        floatingPointsElement.classList.add('points-green');
    }
}

function updateProgressBar(points) {
    var percentage = Math.min((points / 100) * 100, 100);
    progressBarFill.style.width = percentage + '%';

    if (points < 70) {
        progressBarFill.style.backgroundColor = '#cf222e';
    } else if (points < 80) {
        progressBarFill.style.backgroundColor = '#2da44e';
    } else {
        progressBarFill.style.backgroundColor = '#1a7f37';
    }
}

function updateResultMessage(points) {
    resultMessage.classList.remove('result-under-70', 'result-70-to-79', 'result-80-plus');

    if (points === 0) {
        resultMessage.textContent = 'Select your criteria above to calculate points.';
    } else if (points < 70) {
        resultMessage.textContent = 'You have ' + points + ' points. You need ' + (70 - points) + ' more points to qualify for the 3-year PR path.';
        resultMessage.classList.add('result-under-70');
    } else if (points < 80) {
        resultMessage.textContent = 'You have ' + points + ' points! You qualify for PR via the 3-year path. ' + (80 - points) + ' more points needed for the 1-year path.';
        resultMessage.classList.add('result-70-to-79');
    } else {
        resultMessage.textContent = 'You have ' + points + ' points! You qualify for PR via the fast-track 1-year path!';
        resultMessage.classList.add('result-80-plus');
    }
}

function resetCalculator() {
    form.reset();
    totalPointsElement.textContent = '0';
    progressBarFill.style.width = '0%';
    progressBarFill.style.backgroundColor = '#cf222e';
    resultMessage.textContent = 'Select your criteria above to calculate points.';
    resultMessage.className = 'result-message';
    floatingPointsElement.classList.remove('points-red', 'points-yellow-green', 'points-green');
    // Re-disable SME checkbox
    smeCheckbox.disabled = true;
    smeCheckbox.checked = false;
    // Re-enable JLPT N2
    document.getElementById('jlpt-n2').disabled = false;
    document.getElementById('jlpt-n2-help').style.display = 'none';
    // Reset drag position
    xOffset = 0;
    yOffset = 0;
    floatingPointsElement.style.transform = '';
}


// JavaScript code to make the floating point draggable
const floatingPointsElement = document.getElementById('floating-points');
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

floatingPointsElement.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('mouseleave', dragEnd);
// Touch support for mobile (only on screens > 768px where widget is draggable)
floatingPointsElement.addEventListener('touchstart', dragStart, { passive: false });
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
    // Disable drag on mobile where floating widget is a fixed bottom bar
    if (window.innerWidth <= 768) return;

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

function dragEnd(e) {
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

// Dark mode toggle with automatic detection and manual override
const darkModeSwitch = document.getElementById('dark-mode-switch');

// Initialize theme on page load
function initializeTheme() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        // Use saved preference
        applyTheme(savedTheme === 'dark');
    } else {
        // Use browser's preferred color scheme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark);
    }
}

// Apply theme based on isDark boolean
function applyTheme(isDark) {
    const body = document.body;
    if (isDark) {
        body.classList.add('dark-mode');
        darkModeSwitch.checked = true;
    } else {
        body.classList.remove('dark-mode');
        darkModeSwitch.checked = false;
    }
}

// Handle manual toggle
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');

    // Save user's preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Listen for changes in browser's color scheme preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only apply if user hasn't set a manual preference
    if (!localStorage.getItem('theme')) {
        applyTheme(e.matches);
    }
});

// Initialize theme when page loads
initializeTheme();

// Add event listener for manual toggle
darkModeSwitch.addEventListener('change', toggleDarkMode);
