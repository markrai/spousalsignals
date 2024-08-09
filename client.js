const USER_COLORS = {
    user1: '#3e95cd',
    user2: '#ff6347'
};

const POINT_RADIUS = 5;
const Y_AXIS_STEP_SIZE = 10;

const chartInstances = {}; 


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

     
        const daysSelector = document.getElementById('daysSelector');
        if (!daysSelector) {
            throw new Error('Days selector element not found.');
        }
        
        const days = daysSelector.value;
        if (data.hrv && data.hrv.length >= days) {
            const filteredData = data.hrv.slice(-days);

     
            const labels = filteredData.map(entry => {
                const date = new Date(entry.dateTime);
     
                const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                return utcDate.toLocaleDateString('en-US', { weekday: 'short' });
            });
            const values = filteredData.map(entry => entry.value.dailyRmssd);

     
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



function updateChart(user, labels, values) {
    const chartId = `hrvChart${user}`;
    const ctx = document.getElementById(chartId)?.getContext('2d');

    if (!ctx) {
        console.error(`Chart context for ${chartId} not found.`);
        return;
    }


    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
    }


    chartInstances[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `HRV Data for ${user}`,
                data: values,
                borderColor: USER_COLORS[user], 
                fill: false,
                pointBackgroundColor: '#000', 
                pointRadius: POINT_RADIUS, 
            }]
        },
        options: {
            layout: {
                padding: {
                    right: 20,
                }
            },
            plugins: {
                datalabels: {
                    color: '#fff',
                    backgroundColor: '#000', 
                    borderRadius: 4,
                    font: {
                        weight: 'bold'
                    },
                    formatter: function(value) {
                        return value.toFixed(1); 
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        stepSize: Y_AXIS_STEP_SIZE, 
                    }
                }
            }
        },
        plugins: [ChartDataLabels] 
    });
}



function displayError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = `<p class="error-message">${message}</p>`;
    } else {
        console.error('Error container element not found.');
    }
}


document.getElementById('daysSelector')?.addEventListener('change', () => {
    fetchAndDisplayData('user1');
    fetchAndDisplayData('user2');
});


document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayData('user1');
    fetchAndDisplayData('user2');
});
