document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector(".navbar");
    const features = document.querySelectorAll(".card");
    const isLoggedIn = localStorage.getItem("loggedIn");

    // Check if user is logged in
    if (isLoggedIn === "true") {
        document.body.classList.add("logged-in");

        // Show the hidden nav and quicklink items
        const showIds = [
            "nav_tracker", "nav_nutrition", "nav_progress", "nav_reminder", "nav_profile",
            "quicklink_tracker", "quicklink_progress", "quicklink_nutrition", "quicklink_reminder"
        ];
        showIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("d-none");
        });

        // Hide login/signup/get-started buttons
        const btn_login = document.querySelector("#btn_login");
        const btn_signup = document.querySelector("#btn_signup");
        const btn_get_started = document.querySelector("#btn_get_started");

        if (btn_login) btn_login.classList.add("d-none");
        if (btn_signup) btn_signup.classList.add("d-none");
        if (btn_get_started) btn_get_started.classList.add("d-none");

        // Card feature redirection
        const buttons = document.querySelectorAll(".btn_feature");
        buttons.forEach(button => {
            button.addEventListener("click", function () {
                const card = button.closest(".card");
                const link = card.getAttribute("data-link");
                if (link) {
                    console.log("Redirecting to:", link);
                    window.location.href = link;
                }
            });
        });
    }

    // Automatically highlight the correct nav link based on current page
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        // Check if the href contains the current page name or ends with it
        if (href && (href.includes(currentPage) || href.endsWith(currentPage) || 
            (currentPage === "ProgressChart.html" && href.includes("ProgressChart.html")))) {
            link.classList.add("active");
            
            // Add green highlight for Progress Chart
            if (currentPage === "ProgressChart.html") {
                link.classList.add("active-green");
            }
        }
    });

    // Add viewBox attribute to SVG
    const streakRing = document.querySelector(".streak-ring");
    if (streakRing) {
        streakRing.setAttribute("viewBox", "0 0 200 200");
        streakRing.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }

    // Streak Progress Circle
    const currentStreak = 20;
    const goal = 31;

    const circle = document.querySelector(".streak-progress");
    if (circle) {
        const offset = 565.5 - (565.5 * currentStreak) / goal; // 565.5 = 2 * π * 90 (the circle radius)
        circle.style.strokeDashoffset = offset;
    }

    // Initialize streak ring
    initializeStreakRing();

    // Initialize workout duration bar chart
    initializeDurationChart();

    // Initialize workout type pie chart
    initializeWorkoutChart();

    // Initialize calories burned bar chart
    initializeCaloriesChart();

    // Initialize the BMI indicator
    updateBMIIndicator(parseFloat(document.getElementById('bmi-value').textContent));

    // Initialize weight progress chart
    initializeWeightProgressChart();
});

// Function to initialize and update streak ring
function initializeStreakRing() {
    const currentStreak = 20;
    const goal = 31;
    
    const svgRing = document.querySelector(".streak-ring");
    const progress = document.querySelector(".streak-progress");
    
    if (svgRing && progress) {
        // Ensure viewBox is set correctly
        svgRing.setAttribute("viewBox", "0 0 200 200");
        svgRing.setAttribute("preserveAspectRatio", "xMidYMid meet");
        
        // Calculate circumference - 2πr where r=90
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        
        // Calculate progress offset
        const offset = circumference - (circumference * currentStreak / goal);
        
        // Set attributes
        progress.setAttribute("stroke-dasharray", circumference);
        progress.setAttribute("stroke-dashoffset", offset);
        
        console.log("Streak ring initialized. Circumference:", circumference, "Offset:", offset);
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

// Sample workout duration data for a week
const workoutDurations = [120, 200, 150, 80, 70, 110, 130]; // in minutes
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

new Chart(durationCtx, {
  type: 'bar',
  data: {
    labels: daysOfWeek,
    datasets: [{
      label: 'Workout Duration (mins)',
      data: workoutDurations,
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
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

}
// Function to initialize the calories burned bar chart
function initializeCaloriesChart() {
    const dataValues = [1100, 500, 1300, 900, 600, 1000, 1200, 2100, 950, 1800, 800, 870];
    const maxValue = Math.max(...dataValues);
    const highlightColor = '#3E7B27';  // Darker green
    const defaultColor = '#85A947';    // Regular green

    // Find index of the highest value
    const maxIndex = dataValues.indexOf(maxValue);
    
    var ctx = document.getElementById('caloriesBarChart').getContext('2d');
    var myBarChart = new Chart(ctx, {
        type: 'bar', // Use 'bar' for vertical bar chart
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], // The categories for the bars
            datasets: [
                {
                    label: 'Calories Burned',
                    data: dataValues.map((value, index) => 
                        value === maxValue ? null : value
                    ),
                    backgroundColor: defaultColor,
                    borderRadius: 8,
                    borderWidth: 1,
                    stack: 'Stack 0',
                },
                {
                    label: 'Best Month',
                    data: dataValues.map((value, index) => 
                        value === maxValue ? value : null
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
                    beginAtZero: true, // Ensures the Y-axis starts at 0
                    title: {
                        display: true,
                        text: 'Calories Burned'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
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
                            const monthIndex = context[0].dataIndex;
                            return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];
                        },
                        label: function(context) {
                            const value = dataValues[context.dataIndex]; // Get the original value regardless of dataset
                            return `Calories burned: ${value}`;
                        },
                        footer: function(context) {
                            const value = dataValues[context[0].dataIndex];
                            return value === maxValue ? 'This is the month with highest calories burned!' : '';
                        }
                    }
                }
            }
        }
    });
}

// Function to initialize the workout type pie chart
function initializeWorkoutChart() {
    const ctx = document.getElementById('workTypesPieChart');
    
    if (ctx) {
        // Sample workout data - replace with actual data from your database
        const workoutTypes = {
            'Cycling': 48,
            'Running': 30,
            'Aerobics': 22,
        };
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(workoutTypes),
                datasets: [{
                    data: Object.values(workoutTypes),
                    backgroundColor: [
                        '#3E7B27',  
                        '#85A947',  
                        '#99BC85'
                    ],
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
                                return `${label}: ${percentage}%`;
                            }
                        }
                    }
                }
            }
        });
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
  

// Scroll-based nav highlighting (only relevant if you stay on a single page)
window.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            link.classList.remove('active');
            if (href === '#' + current) {
                link.classList.add('active');
            }
        }
    });
});

function initializeWeightProgressChart() {
    const ctx = document.getElementById('weightProgressChart').getContext('2d');

// Sample weight data across months
const weightData = [48, 47.5, 47, 46.8, 46.5, 46.2, 46, 45.8, 45.6, 45.5, 45.4, 45.3];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Target weight
const targetWeight = 47;

// Chart configuration
new Chart(ctx, {
  type: 'line',
  data: {
    labels: months,
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightData,
        borderColor: '#3E7B27',
        backgroundColor: '#E4EFE7',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#3E7B27',
      },
      {
        label: 'Target Weight',
        data: new Array(12).fill(targetWeight), // Constant horizontal line
        borderColor: '#85A947',
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Weight (kg)',
        },
        beginAtZero: false,
      },
    },
  },
});
}

// Logout functionality
const btn_logout = document.querySelector("#btn_logout");
btn_logout.addEventListener("click", logout);

function logout() {
    // Retain the 'mealFavourites' in localStorage, clear other data
    const favourites = localStorage.getItem('mealFavourites');

    // Clear all other data in localStorage
    localStorage.clear();

    // Restore the 'mealFavourites' back to localStorage
    if (favourites) {
        localStorage.setItem('mealFavourites', favourites);
    }

    // Redirect after a slight delay
    setTimeout(function () {
        window.location.href = "Login.html";
    }, 500);
}