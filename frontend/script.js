document.addEventListener('DOMContentLoaded', () => {

    // IMPORTANT: This placeholder will be replaced by the CI/CD pipeline.
    const API_BASE_URL = 'http://vote-app-service';

    // Get references to the HTML elements
    const voteButtons = document.querySelectorAll('.vote-btn');
    const resultsA = document.getElementById('results-a');
    const resultsB = document.getElementById('results-b');
    const resultsC = document.getElementById('results-c');
    const statusMessage = document.getElementById('status-message');

    // Function to fetch the latest vote results from the backend
    const fetchResults = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/results`);
            if (!response.ok) throw new Error('Failed to fetch results.');
            
            const data = await response.json();
            
            // Update the UI with the new vote counts
            resultsA.textContent = data.option_a;
            resultsB.textContent = data.option_b;
            resultsC.textContent = data.option_c;

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
            console.error(error);
        }
    };

    // Function to cast a vote
    const castVote = async (option) => {
        statusMessage.textContent = 'Submitting your vote...';
        try {
            const response = await fetch(`${API_BASE_URL}/vote/${option}`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Vote failed to submit.');

            statusMessage.textContent = 'Vote submitted successfully!';
            
            // After voting, immediately update the results
            await fetchResults(); 

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
            console.error(error);
        }
    };

    // Add a click event listener to each vote button
    voteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const option = button.dataset.option;
            castVote(option);
        });
    });

    // --- Initial setup ---
    
    // Fetch the results when the page first loads
    fetchResults();

    // Set up polling to refresh the results every 3 seconds to show live updates
    setInterval(fetchResults, 3000);
});