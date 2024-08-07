// Function to fetch and display HRV data
async function fetchAndDisplayData(user) {
    try {
        console.log(`Fetching HRV data for ${user}`);
        const response = await fetch(`/hrv/${user}`);
        if (!response.ok) {
            console.error(`Failed to fetch HRV data for ${user}: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch HRV data for ${user}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`HRV data for ${user}:`, data);

        // Check if data is available and sufficient
        const days = document.getElementById('daysSelector').value;
        if (data.hrv && data.hrv.length >= days) {
            const filteredData = data.hrv.slice(-days);

            // Extract labels (dates) and values (HRV readings)
            const labels = filteredData.map(entry => {
                const date = new Date(entry.dateTime);
                return date.toLocaleDateString('en-US', { weekday: 'short' }); // Show day of the week
            });
            const values = filteredData.map(entry => entry.value.dailyRmssd);

            // Update the chart with the new data
            updateChart(user, labels, values);
        } else {
            console.error(`Insufficient data for ${user}.`);
            displayError(`Insufficient HRV data available for ${user}.`);
        }
    } catch (error) {
        console.error(`Error in fetchAndDisplayData for ${user}:`, error);
        displayError(`Failed to load HRV data for ${user}.`);
    }
}

// Function to update the Chart.js chart with new data
function updateChart(user, labels, values) {
    const chartId = `hrvChart${user}`;
    const ctx = document.getElementById(chartId).getContext('2d');

    // Check if chart already exists, destroy it before creating a new one
    if (window[`${chartId}Instance`]) {
        window[`${chartId}Instance`].destroy();
    }

    // Create the chart with the fetched data
    window[`${chartId}Instance`] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `HRV Data for ${user}`,
                data: values,
                borderColor: user === 'user1' ? '#3e95cd' : '#ff6347', // Different colors for each user
                fill: false,
                pointBackgroundColor: '#000', // Black dots
                pointRadius: 5, // Size of dots
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    color: '#fff', // White text color
                    backgroundColor: '#000', // Black background
                    borderRadius: 4,
                    font: {
                        weight: 'bold'
                    },
                    formatter: function(value) {
                        return value.toFixed(1); // Format the label text
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        stepSize: 10, // Ensure y-axis increments by 10
                    }
                }
            }
        },
        plugins: [ChartDataLabels] // Enable the datalabels plugin
    });
}

// Function to display an error message on the page
function displayError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `<p class="error-message">${message}</p>`;
}

// Event listener for dropdown change to update the charts
document.getElementById('daysSelector').addEventListener('change', () => {
    fetchAndDisplayData('user1');
    fetchAndDisplayData('user2');
});

// Fetch initial data for both users when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayData('user1');
    fetchAndDisplayData('user2');
});
