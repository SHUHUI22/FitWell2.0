document.addEventListener("DOMContentLoaded", function () {
    // Automatically highlight the correct nav link based on current page
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        // Check if the href contains the current page name or ends with it
        if (href && href.includes(currentPage)) {
            link.classList.add("active");
        }
    });
});

// Update placeholder based on workout type
const workoutTypeSelect = document.getElementById("workoutType");
const workoutDetail = document.getElementById("workoutDetail");

workoutTypeSelect.addEventListener("change", function () {
    const selectedType = this.value;

    switch (selectedType) {
        case "Cycling":
            workoutDetail.placeholder = "Distance (in km)";
            break;
        case "Running":
            workoutDetail.placeholder = "Steps (e.g. 1000)";
            break;
        case "Aerobic":
            workoutDetail.placeholder = "Type of Aerobic (e.g. Jumping Jacks)";
            break;
        case "Yoga":
            workoutDetail.placeholder = "Type of Yoga (e.g. Vinyasa)";
            break;
        case "Zumba":
            workoutDetail.placeholder = "Intensity (e.g. Basic, Strong)";
            break;
    }
});

// Get user's weight
const weight = parseFloat(document.getElementById("userWeight").value);

// Submit form 
document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();

    console.log(weight);
    const type = document.getElementById("workoutType").value;
    const duration = parseFloat(document.getElementById("duration").value);
    const date = document.getElementById("date").value;
    const workoutDetail = document.getElementById("workoutDetail").value;


    const calories = getCaloriesBurned(type, duration, weight);
    if (isNaN(calories)) {
        alert("Calories calculation failed. Please check your inputs.");
        return;
    }

    document.getElementById("caloriesBurned").value = calories;
    const workout = { type, duration, date, workoutDetail, calories };
    // Store      
    console.log("Logged Workout:", workout);
    alert("Workout recorded successfully!");

    this.submit();
});

// Calculate calorie burned
function getCaloriesBurned(type, duration, weight) {
    // MET values for each workout type (approximate)
    const MET_VALUES = {
        Cycling: 9.5,
        Running: 9.8,
        Aerobic: 6.83,
        Yoga: 3.0,
        Zumba: 4.5
    };

    const met = MET_VALUES[type]; 
    const time = duration;

    // Formula: Calories = Time (min) x MET × 3.5 weight (kg) / 200
    const calories = (time * met * 3.5 * weight) / 200;
    return Math.round(calories);
}


// Step goal logic
const goalValue = document.getElementById("goalValue").dataset.value;
const currentSteps = document.getElementById("stepCount").dataset.value;

// Prefill goal input
const stepGoalInput = document.getElementById("stepGoal");
if (stepGoalInput) {
    stepGoalInput.value = goalValue;
}

updateStepRing(currentSteps, goalValue);

function updateStepRing(currentSteps, goalValue) {
  const percent = Math.min(currentSteps / goalValue, 1);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent);

  const progressCircle = document.querySelector('.streak-progress');
  progressCircle.style.strokeDasharray = `${circumference}`;
  progressCircle.style.strokeDashoffset = `${offset}`;
}
