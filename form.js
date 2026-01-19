document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    const creatorId = urlParams.get('creatorId'); // Assume this is passed in the link for tracking
    if (!encodedData) {
        alert('Invalid link');
        return;
    }

    const formData = JSON.parse(atob(encodedData));
    document.getElementById('form-title').textContent = formData.title;
    document.getElementById('form-description').textContent = formData.description;

    const questionsContainer = document.getElementById('questions');
    const responseForm = document.getElementById('response-form');
    const timerDisplay = document.getElementById('timer');

    // Generate a unique session ID for this user/session
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Function to send data to server (and store locally for demo)
    async function sendToServer(endpoint, data) {
        // Store locally in localStorage (keyed by creatorId)
        const storageKey = `formData_${creatorId}`;
        let storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        storedData.push({ endpoint, data, timestamp: new Date().toISOString() });
        localStorage.setItem(storageKey, JSON.stringify(storedData));

        // Optional: Still try to send to server if available
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Server error');
            console.log('Data sent to server:', data);
        } catch (error) {
            console.error('Failed to send to server, but stored locally:', error);
        }
    }

    // Render questions
    formData.questions.forEach((q, index) => {
        const qDiv = document.createElement('div');
        qDiv.innerHTML = `<label>${q.text}</label>`;
        if (q.type === 'short') {
            qDiv.innerHTML += `<input type="text" name="q${index}" required>`;
        } else if (q.type === 'multiple') {
            q.options.forEach((opt, optIndex) => {
                qDiv.innerHTML += `<input type="radio" name="q${index}" value="${optIndex}" required> ${opt}<br>`;
            });
        }
        questionsContainer.appendChild(qDiv);
    });

    // Timer
    let timeLeft = formData.timer * 60; // in seconds
    const timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            responseForm.submit();
        }
        timeLeft--;
    }, 1000);

    // Auto-submit on leaving the page
    window.addEventListener('beforeunload', () => {
        // Send event to server
        sendToServer('/api/event', {
            creatorId,
            sessionId,
            event: 'left_page',
            timestamp: new Date().toISOString()
        });
        responseForm.submit();
    });

    // Auto-submit on tab switch (when tab becomes hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Send event to server
            sendToServer('/api/event', {
                creatorId,
                sessionId,
                event: 'tab_switched',
                timestamp: new Date().toISOString()
            });
            responseForm.submit();
        }
    });

    // Handle submit
    responseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formDataObj = new FormData(responseForm);
        let score = 0;
        let feedback = '';

        formData.questions.forEach((q, index) => {
            const userAnswer = formDataObj.get(`q${index}`);
            if (q.type === 'multiple') {
                const correctIndex = q.correct;
                const isCorrect = parseInt(userAnswer) === correctIndex;
                if (isCorrect) {
                    score++;
                    feedback += `Question ${index + 1}: Correct!<br>`;
                } else {
                    feedback += `Question ${index + 1}: Incorrect. The right answer is: ${q.options[correctIndex]}<br>`;
                }
            } else if (q.type === 'short') {
                // For short answer, assume no auto-check (you could add manual grading logic here)
                feedback += `Question ${index + 1}: Short answer submitted: ${userAnswer}<br>`;
            }
        });

        // Prepare submission data
        const submissionData = {
            creatorId,
            sessionId,
            responses: Array.from(formDataObj.entries()),
            score,
            totalQuestions: formData.questions.length,
            timestamp: new Date().toISOString()
        };

        // Send submission to server
        await sendToServer('/api/submit', submissionData);

        // Show confirmation to user
        alert(`Form submitted!\nScore: ${score}/${formData.questions.length}\n\n${feedback}\n\nYour response has been sent to the form creator.`);
    });
});