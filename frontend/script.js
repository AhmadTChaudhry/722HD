document.addEventListener('DOMContentLoaded', () => {

    // IMPORTANT: We now use a relative path. The browser will send requests
    // to the same server that served the page (our Nginx proxy).
    const API_BASE_URL = '/api';

    // The rest of your JavaScript file is correct and does not need to change.
    // Make sure to update the fetch URLs to include the base URL.

    const fetchResults = async () => {
        try {
            // Updated URL
            const response = await fetch(`${API_BASE_URL}/results`);
            if (!response.ok) throw new Error('Failed to fetch results.');
            
            const data = await response.json();
            
            resultsA.textContent = data.option_a;
            resultsB.textContent = data.option_b;
            resultsC.textContent = data.option_c;

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
            console.error(error);
        }
    };

    const castVote = async (option) => {
        statusMessage.textContent = 'Submitting your vote...';
        try {
            // Updated URL
            const response = await fetch(`${API_BASE_URL}/vote/${option}`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Vote failed to submit.');

            statusMessage.textContent = 'Vote submitted successfully!';
            
            await fetchResults(); 

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
            console.error(error);
        }
    };

    // --- References to HTML elements and event listeners remain the same ---
    const voteButtons = document.querySelectorAll('.vote-btn');
    const resultsA = document.getElementById('results-a');
    const resultsB = document.getElementById('results-b');
    const resultsC = document.getElementById('results-c');
    const statusMessage = document.getElementById('status-message');

    voteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const option = button.dataset.option;
            castVote(option);
        });
    });

    fetchResults();
    setInterval(fetchResults, 3000);
});