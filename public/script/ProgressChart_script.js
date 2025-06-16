document.addEventListener("DOMContentLoaded", function () {
    // Automatically highlight the correct nav link based on current page
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");

        if (href && href.includes(currentPage)) {
            link.classList.add("active");
        }
    });

    // Add viewBox attribute to SVG
    const streakRing = document.querySelector(".streak-ring");
    if (streakRing) {
        streakRing.setAttribute("viewBox", "0 0 200 200");
        streakRing.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }

    // Initialize streak ring
    initializeStreakRing();

    // Initialize workout duration bar chart
    initializeDurationChart();

    // Initialize workout type pie chart
    initializeWorkoutChart();

    // Initialize calories burned bar chart
    // Initialize with monthly view by default
    initializeCaloriesChart('monthly');
    
    // Add event listener for view selector dropdown
    const viewSelector = document.getElementById('viewSelector');
    if (viewSelector) {
        viewSelector.addEventListener('change', function(e) {
            const selectedView = e.target.value;
            initializeCaloriesChart(selectedView);
            
            // Optional: Add smooth transition effect
            const chartContainer = document.querySelector('#caloriesBarChart').parentElement;
            chartContainer.style.opacity = '0.7';
            setTimeout(() => {
                chartContainer.style.opacity = '1';
            }, 100);
        });
    }


    // Initialize the BMI indicator
    updateBMIIndicator(parseFloat(document.getElementById('bmi-value').textContent));

    // Initialize weight progress chart
    initializeWeightProgressChart();
});

// Function to initialize and update streak ring
function initializeStreakRing() {
    // Get streak value from DOM (from EJS template)
    const streakElement = document.getElementById("noDays");
    const currentStreak = streakElement ? parseInt(streakElement.textContent) || 0 : 0;
    const goal = 31;
    
    console.log("Initializing streak ring with streak:", currentStreak, "Goal:", goal);
    
    const svgRing = document.querySelector(".streak-ring");
    const progress = document.querySelector(".streak-progress");
    
    if (svgRing && progress) {
        // Ensure viewBox is set correctly
        svgRing.setAttribute("viewBox", "0 0 200 200");
        svgRing.setAttribute("preserveAspectRatio", "xMidYMid meet");
        
        // Calculate circumference - 2πr where r=90
        const radius = 90;
        const circumference = 2 * Math.PI * radius; // ≈ 565.5
        
        // Calculate progress as percentage
        const progressPercentage = Math.min(currentStreak / goal, 1); // Cap at 100%
        
        // Calculate offset (start from top, go clockwise)
        const offset = circumference - (circumference * progressPercentage);
        
        // Set stroke-dasharray and stroke-dashoffset
        progress.style.strokeDasharray = circumference;
        progress.style.strokeDashoffset = offset;
        
        console.log("Streak ring updated:", {
            currentStreak,
            goal,
            progressPercentage: (progressPercentage * 100).toFixed(1) + "%",
            circumference: circumference.toFixed(1),
            offset: offset.toFixed(1)
        });
    } else {
        console.error("Streak ring elements not found:", { svgRing: !!svgRing, progress: !!progress });
    }
}

// Handle window resizing
window.addEventListener('resize', handleResponsiveLayout);
window.addEventListener('zoom', handleResponsiveLayout); // Some browsers support zoom events

// Called on window resize or zoom change
function handleResponsiveLayout() {
    // Reinitialize streak ring
    initializeStreakRing();
    
    // Check zoom level and make any necessary adjustments
    const zoomLevel = Math.round(window.devicePixelRatio * 100);
    console.log("Current zoom level:", zoomLevel + "%");
    
    // Make additional adjustments based on zoom level if needed
    const streakWrapper = document.querySelector(".streak-wrapper");
    if (streakWrapper) {
        // At very high zoom levels, check if we need additional scaling
        if (zoomLevel > 200) {
            streakWrapper.style.transform = "scale(0.85)";
        } else if (zoomLevel > 150) {
            streakWrapper.style.transform = "scale(0.9)";
        } else {
            streakWrapper.style.transform = "";
        }
    }
}

// Call once on load to handle initial state
setTimeout(handleResponsiveLayout, 100);

//Funtion to initialize the duration bar chart
function initializeDurationChart() {
  const durationCtx = document.getElementById('durationBarChart').getContext('2d');
  const canvas = document.getElementById('durationBarChart');
  
  // Get last 7 days data from canvas data attributes
  const last7DaysLabels = JSON.parse(canvas.dataset.last7daysLabels || '["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6","Day 7"]');
  const last7DaysDurations = JSON.parse(canvas.dataset.last7daysDurations || '[0,0,0,0,0,0,0]');
  
  new Chart(durationCtx, {
    type: 'bar',
    data: {
      labels: last7DaysLabels,
      datasets: [{
        label: 'Workout Duration (mins)',
        data: last7DaysDurations,
        backgroundColor: '#85A947',
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutes'
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return `Duration: ${context.parsed.y} minutes`;
            }
          }
        }
      }
    }
  });
}

// Function to initialize the calories burned bar chart
let caloriesChart = null;
const weeklyLabels = [];
const today = new Date();
for (let i = 6; i >= 0; i--) {
  const date = new Date(today);
  date.setDate(today.getDate() - i);
  const dayLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
  weeklyLabels.push(dayLabel);
}

// Chart configuration for different views
const chartConfig = {
    monthly: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        legendLabel: 'Best Month',
        xAxisTitle: 'Month'
    },
    weekly: {
        labels: weeklyLabels,
        legendLabel: 'Best Day',
        xAxisTitle: 'Day of Week'
    }
};

function initializeCaloriesChart(viewType = 'monthly') {
    const canvas = document.getElementById('caloriesBarChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // Get data from canvas data attributes
    const monthlyCalories = JSON.parse(canvas.getAttribute('data-monthly-calories') || '[]');
    const weeklyCalories = JSON.parse(canvas.getAttribute('data-weekly-calories') || '[]');
    
    // Select data based on view type
    const dataValues = viewType === 'monthly' ? monthlyCalories : weeklyCalories;
    const config = chartConfig[viewType];
    const labels = config.labels;
    const maxValue = Math.max(...dataValues);
    const highlightColor = '#3E7B27';  // Darker green
    const defaultColor = '#85A947';    // Regular green

    // Destroy existing chart if it exists
    if (caloriesChart) {
        caloriesChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    caloriesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Calories Burned',
                    data: dataValues.map((value, index) => 
                        value === maxValue && value > 0 ? null : value
                    ),
                    backgroundColor: defaultColor,
                    borderRadius: 8,
                    borderWidth: 1,
                    stack: 'Stack 0',
                },
                {
                    label: config.legendLabel,
                    data: dataValues.map((value, index) => 
                        value === maxValue && value > 0 ? value : null
                    ),
                    backgroundColor: highlightColor,
                    borderRadius: 8,
                    borderWidth: 1,
                    stack: 'Stack 0',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Calories Burned'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: config.xAxisTitle
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'rect',
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            return labels[index];
                        },
                        label: function(context) {
                            const value = dataValues[context.dataIndex];
                            return `Calories burned: ${value}`;
                        },
                        footer: function(context) {
                            const value = dataValues[context[0].dataIndex];
                            const period = viewType === 'monthly' ? 'month' : 'day';
                            return value === maxValue && value > 0 ? `This is the ${period} with highest calories burned!` : '';
                        }
                    }
                }
            }
        }
    });
}


// Function to update chart data
function updateCaloriesChart(newMonthlyData, newWeeklyData) {
    const canvas = document.getElementById('caloriesBarChart');
    if (canvas) {
        canvas.setAttribute('data-monthly-calories', JSON.stringify(newMonthlyData));
        canvas.setAttribute('data-weekly-calories', JSON.stringify(newWeeklyData));
        
        // Refresh current view
        const currentView = document.getElementById('viewSelector').value;
        initializeCaloriesChart(currentView);
    }
}

// Function to initialize the workout type pie chart
function initializeWorkoutChart() {
    const ctx = document.getElementById('workTypesPieChart');
    
    if (ctx) {
        let workoutTypes = {};
        
        // Try to get workout types data from data attribute
        const workoutTypesData = ctx.getAttribute('data-workout-types');
        
        try {
            if (workoutTypesData) {
                const parsedData = JSON.parse(workoutTypesData);
                console.log('Parsed workout types data:', parsedData);
                
                // Convert database format to chart format
                if (parsedData && parsedData.length > 0) {
                    parsedData.forEach(item => {
                        workoutTypes[item.type] = item.count;
                    });
                } else {
                    // Fallback if no workouts found
                    workoutTypes = {
                        'No workouts yet': 1
                    };
                }
            } else {
                // If no data attribute found, check for global variable
                if (typeof window.workoutTypesData !== 'undefined' && window.workoutTypesData) {
                    window.workoutTypesData.forEach(item => {
                        workoutTypes[item.type] = item.count;
                    });
                } else {
                    // Final fallback to default data
                    console.warn('No workout types data found, using default data');
                    workoutTypes = {
                        'Cycling': 48,
                        'Running': 30,
                        'Aerobics': 22,
                    };
                }
            }
        } catch (error) {
            console.error('Error parsing workout types data:', error);
            // Fallback data
            workoutTypes = {
                'Cycling': 48,
                'Running': 30,
                'Aerobics': 22,
            };
        }
        
        console.log('Final workout types for chart:', workoutTypes);
        
        // Generate colors based on number of workout types
        const colors = generateChartColors(Object.keys(workoutTypes).length);
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(workoutTypes),
                datasets: [{
                    data: Object.values(workoutTypes),
                    backgroundColor: colors,
                    hoverOffset: 4,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: false,
                        text: 'Workout Distribution'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} workouts (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Helper function to generate colors for different numbers of workout types
function generateChartColors(count) {
    const baseColors = [
        '#3E7B27',  // Dark green
        '#85A947',  // Medium green  
        '#99BC85',  // Light green
        '#A8C68F',  // Lighter green
        '#B7D099',  // Even lighter green
        '#C6DAA3',  // Pale green
        '#D5E4AD'   // Very pale green
    ];
    
    // If need more colors than we have, return the base colors repeated if necessary
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    } else {
        // For more than 7 types, cycle through the colors
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }
}

function updateBMIIndicator(bmi) {
    const minBMI = 10;
    const maxBMI = 40;
    const bar = document.querySelector('.bmi-bar');
    const indicator = document.getElementById('bmi-indicator');
  
    if (bar && indicator) {
      const barWidth = bar.offsetWidth;
      const normalized = Math.max(minBMI, Math.min(maxBMI, bmi)); // clamp BMI to [10, 40]
      const position = ((normalized - minBMI) / (maxBMI - minBMI)) * barWidth;
  
      indicator.style.left = `${position - 6}px`; // -6px to center the 12px wide indicator
    }
  }
  
  // Example usage
  const bmi = parseFloat(document.getElementById('bmi-value').textContent);
  updateBMIIndicator(bmi);
  
  // Recalculate on window resize
  window.addEventListener('resize', () => updateBMIIndicator(bmi));

function initializeWeightProgressChart() {
    const ctx = document.getElementById('weightProgressChart');
    if (!ctx) {
        console.error('Weight progress chart canvas not found');
        return;
    }

    // Get weight history data from data attributes (ensure consistent naming)
    let weightLabels = [];
    let weightData = [];
    
    try {
        weightLabels = JSON.parse(ctx.getAttribute('data-weight-labels') || '[]');
        weightData = JSON.parse(ctx.getAttribute('data-weight-data') || '[]');
    } catch (error) {
        console.error('Error parsing weight data:', error);
        return;
    }

    // Check if we have data
    if (!weightLabels.length || !weightData.length) {
        console.log('No weight history data available');
        // Show a message to user instead of empty chart
        ctx.parentElement.innerHTML = '<p class="text-center text-muted">No weight history data available. Start tracking your weight to see progress!</p>';
        return;
    }
    
    // Get target weight
    const targetWeight = JSON.parse(ctx.getAttribute('target-weight') || '[]');

    // Ensure targetWeight is valid
    if (isNaN(targetWeight)) {
        console.error('Invalid target weight');
        return;
    }

    // Chart configuration
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: weightLabels,
            datasets: [
                {
                    label: 'Weight (kg)',
                    data: weightData,
                    borderColor: '#3E7B27',
                    backgroundColor: 'rgba(62, 123, 39, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#3E7B27',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                },
                {
                    label: 'Target Weight',
                    data: new Array(weightLabels.length).fill(targetWeight),
                    borderColor: '#85A947',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    pointBackgroundColor: '#85A947',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    fill: false,
                    tension: 0,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Date: ${context[0].label}`;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Weight: ${context.raw} kg`;
                            } else {
                                return `Target: ${context.raw} kg`;
                            }
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                const diff = context.raw - targetWeight;
                                if (diff > 0) {
                                    return `${diff.toFixed(1)} kg above target`;
                                } else if (diff < 0) {
                                    return `${Math.abs(diff).toFixed(1)} kg below target`;
                                } else {
                                    return 'At target weight!';
                                }
                            }
                            return '';
                        },
                        labelColor: function(context) {
    if (context.datasetIndex === 0) {
        return {
            borderColor: '#3E7B27',
            backgroundColor: '#3E7B27',
        };
    } else {
        return {
            borderColor: '#85A947',
            backgroundColor: '#85A947',
        };
    }
}
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Weight (kg)',
                    },
                    beginAtZero: false,
                    // Safely calculate min/max with fallbacks
                    min: Math.min(...weightData.filter(w => !isNaN(w)), targetWeight) - 2,
                    max: Math.max(...weightData.filter(w => !isNaN(w)), targetWeight) + 2,
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        },
    });
}