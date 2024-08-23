
const form = document.getElementById('calculator-form');
const totalPointsElement = document.getElementById('total-points');
const innovationSupportCheckbox = document.getElementById('innovation-support');
const smeCheckbox = document.getElementById('sme');

form.addEventListener('change', calculatePoints);
innovationSupportCheckbox.addEventListener('change', toggleSMECheckbox);


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

function toggleDarkMode() {
    const selectedMode = darkModeSelect.value;
    const body = document.body;

    if (selectedMode === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
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

japaneseUniversityCheckbox.addEventListener('change', toggleJLPTN2Radio);

function toggleJLPTN2Radio() {
    if (japaneseUniversityCheckbox.checked) {
        jlptN2Radio.disabled = true;
        jlptN2Radio.checked = false;
    } else {
        jlptN2Radio.disabled = false;
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

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === floatingPointsElement) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

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

// Dark mode toggle
const darkModeSwitch = document.getElementById('dark-mode-switch');
darkModeSwitch.addEventListener('change', toggleDarkMode);

function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
}
