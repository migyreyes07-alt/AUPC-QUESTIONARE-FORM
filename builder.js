document.addEventListener('DOMContentLoaded', () => {
    const questionsContainer = document.getElementById('questions');
    const addQuestionBtn = document.getElementById('add-question');
    const generateLinkBtn = document.getElementById('generate-link');
    const linkOutput = document.getElementById('link-output');
    let questionCount = 0;

    // Add a creator ID input (insert before title in the form-section div)
    const creatorIdInput = document.createElement('input');
    creatorIdInput.type = 'text';
    creatorIdInput.id = 'creator-id';
    creatorIdInput.placeholder = 'Enter Creator ID (or leave blank to generate)';
    document.querySelector('.form-section').insertBefore(creatorIdInput, document.getElementById('title'));

    addQuestionBtn.addEventListener('click', () => {
        questionCount++;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.dataset.id = questionCount; // Unique ID for the question
        questionDiv.innerHTML = `
            <label>Question ${questionCount}:</label>
            <input type="text" placeholder="Enter question text" class="question-text">
            <select class="question-type">
                <option value="short">Short Answer</option>
                <option value="multiple">Multiple Choice</option>
            </select>
            <div class="options" style="display: none;">
                <input type="text" placeholder="Option 1" class="option">
                <input type="text" placeholder="Option 2" class="option">
                <button type="button" class="add-option">Add Option</button>
                <div class="correct-answer" style="margin-top: 10px;">
                    <label>Select Correct Answer:</label>
                    <div class="correct-radios"></div>
                </div>
            </div>
            <button type="button" class="remove-btn">Remove Question</button>
        `;
        questionsContainer.appendChild(questionDiv);

        const typeSelect = questionDiv.querySelector('.question-type');
        const optionsDiv = questionDiv.querySelector('.options');
        const addOptionBtn = questionDiv.querySelector('.add-option');
        const correctRadiosDiv = questionDiv.querySelector('.correct-radios');
        const removeBtn = questionDiv.querySelector('.remove-btn');

        typeSelect.addEventListener('change', () => {
            optionsDiv.style.display = typeSelect.value === 'multiple' ? 'block' : 'none';
            updateCorrectRadios();
        });

        addOptionBtn.addEventListener('click', () => {
            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.placeholder = `Option ${optionsDiv.querySelectorAll('.option').length + 1}`;
            optionInput.className = 'option';
            optionsDiv.insertBefore(optionInput, addOptionBtn);
            updateCorrectRadios();
        });

        const updateCorrectRadios = () => {
            correctRadiosDiv.innerHTML = '';
            const options = questionDiv.querySelectorAll('.option');
            options.forEach((opt, idx) => {
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `correct-${questionDiv.dataset.id}`; // Use data-id for unique name
                radio.value = idx;
                const label = document.createElement('label');
                label.textContent = opt.value || `Option ${idx + 1}`;
                correctRadiosDiv.appendChild(radio);
                correctRadiosDiv.appendChild(label);
                correctRadiosDiv.appendChild(document.createElement('br'));
            });
        };

        removeBtn.addEventListener('click', () => {
            questionsContainer.removeChild(questionDiv);
            questionCount--;
        });
    });

    generateLinkBtn.addEventListener('click', () => {
        let creatorId = document.getElementById('creator-id').value;
        if (!creatorId) {
            creatorId = 'creator_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); // Generate if blank
            document.getElementById('creator-id').value = creatorId; // Update input
        }

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const timer = document.getElementById('timer').value;
        if (!title || questionCount === 0) {
            alert('Please enter a title and add at least one question.');
            return;
        }

        const questions = Array.from(document.querySelectorAll('.question')).map(q => {
            const text = q.querySelector('.question-text').value;
            const type = q.querySelector('.question-type').value;
            const options = type === 'multiple' ? Array.from(q.querySelectorAll('.option')).map(o => o.value).filter(v => v) : [];
            const correctRadio = q.querySelector(`input[name="correct-${q.dataset.id}"]:checked`);
            const correctIndex = type === 'multiple' && correctRadio ? parseInt(correctRadio.value) : null;
            if (type === 'multiple' && (options.length < 2 || correctIndex === null)) {
                alert(`Question ${q.dataset.id}: For multiple choice, add at least 2 options and select a correct answer.`);
                throw new Error('Invalid multiple-choice question');
            }
            return { text, type, options, correct: correctIndex };
        });

        const formData = { title, description, timer: parseInt(timer) || 0, questions };
        const encodedData = btoa(JSON.stringify(formData));
        const link = `${window.location.origin}/form.html?data=${encodedData}&creatorId=${creatorId}`;
        linkOutput.innerHTML = `<a href="${link}" target="_blank">${link}</a><br><button id="view-responses">View Responses</button>`;

        // Add event listener for view responses
        document.getElementById('view-responses').addEventListener('click', () => {
            const storageKey = `formData_${creatorId}`;
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const responsesDiv = document.createElement('div');
            responsesDiv.id = 'responses-display';
            responsesDiv.innerHTML = '<h3>Submissions and Events</h3>';

            if (storedData.length === 0) {
                responsesDiv.innerHTML += '<p>No responses yet.</p>';
            } else {
                let html = '<table border="1" style="width:100%; border-collapse:collapse;"><tr><th>Type</th><th>Session ID</th><th>Details</th><th>Timestamp</th></tr>';
                storedData.forEach(item => {
                    const type = item.endpoint.includes('submit') ? 'Submission' : 'Event';
                    const style = type === 'Submission' ? 'color:green;' : 'color:red;';
                    let details = '';
                    if (type === 'Submission') {
                        details = `Score: ${item.data.score}/${item.data.totalQuestions}, Responses: ${JSON.stringify(item.data.responses)}`;
                    } else {
                        details = `Event: ${item.data.event}`;
                    }
                    html += `<tr style="${style}"><td>${type}</td><td>${item.data.sessionId}</td><td>${details}</td><td>${item.timestamp}</td></tr>`;
                });
                html += '</table>';
                responsesDiv.innerHTML += html;
            }
                    // Add event listener for view responses
        document.getElementById('view-responses').addEventListener('click', () => {
            const storageKey = `formData_${creatorId}`;
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const responsesDiv = document.createElement('div');
            responsesDiv.id = 'responses-display';
            responsesDiv.innerHTML = '<h3>Submissions and Events</h3>';

            if (storedData.length === 0) {
                responsesDiv.innerHTML += '<p>No responses yet.</p>';
            } else {
                // Create a map of sessionId to name from submissions
                const nameMap = {};
                storedData.forEach(item => {
                    if (item.endpoint.includes('submit') && item.data.responderName) {
                        nameMap[item.data.sessionId] = item.data.responderName;
                    }
                });

                let html = '<table border="1" style="width:100%; border-collapse:collapse;"><tr><th>Type</th><th>Name</th><th>Session ID</th><th>Details</th><th>Timestamp</th></tr>';
                storedData.forEach(item => {
                    const type = item.endpoint.includes('submit') ? 'Submission' : 'Event';
                    const style = type === 'Submission' ? 'color:green;' : 'color:red;';
                    const name = nameMap[item.data.sessionId] || 'N/A';
                    let details = '';
                    if (type === 'Submission') {
                        details = `Score: ${item.data.score}/${item.data.totalQuestions}, Responses: ${JSON.stringify(item.data.responses)}`;
                    } else {
                        details = `Event: ${item.data.event}`;
                    }
                    html += `<tr style="${style}"><td>${type}</td><td>${name}</td><td>${item.data.sessionId}</td><td>${details}</td><td>${item.timestamp}</td></tr>`;
                });
                html += '</table>';
                responsesDiv.innerHTML += html;
            }

            // Replace or append the display
            const existing = document.getElementById('responses-display');
            if (existing) existing.remove();
            linkOutput.appendChild(responsesDiv);
        });
            // Replace or append the display
            const existing = document.getElementById('responses-display');
            if (existing) existing.remove();
            linkOutput.appendChild(responsesDiv);
        });
    });
});