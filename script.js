// Timer logic (10 minutes)
let timeLeft = 10 * 60; // 10 minutes in seconds
const timerElement = document.getElementById('timer');
const submitBtn = document.getElementById('submitBtn');
const alertDiv = document.getElementById('alert');

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (timeLeft <= 0) {
        alert('Time is up! Submitting form.');
        submitForm();
    } else {
        timeLeft--;
        setTimeout(updateTimer, 1000);
    }
}
updateTimer();

// Prevent tab switching
let tabSwitched = false;
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        tabSwitched = true;
        alertDiv.style.display = 'block';
        submitBtn.disabled = true;
    } else if (tabSwitched) {
        if (confirm('You switched tabs. Confirm to continue.')) {
            alertDiv.style.display = 'none';
            submitBtn.disabled = false;
            tabSwitched = false;
        }
    }
});

// Prevent leaving the page
window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = '';
});

// Form submission
document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!submitBtn.disabled) {
        submitForm();
    }
});

function submitForm() {
    const formData = new FormData(document.getElementById('form'));
    const responses = {};
    for (let [key, value] of formData.entries()) {
        if (responses[key]) {
            if (Array.isArray(responses[key])) {
                responses[key].push(value);
            } else {
                responses[key] = [responses[key], value];
            }
        } else {
            responses[key] = value;
        }
    }
    console.log('Form Responses:', responses);
    alert('Form submitted successfully!');
    // In a real app, send to server here
}