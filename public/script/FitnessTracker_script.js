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
            (currentPage === "FitnessTracker.html" && href.includes("FitnessTracker.html")))) {
            link.classList.add("active");

            // Add green highlight for Fitness Tracker
            if (currentPage === "FitnessTracker.html") {
                link.classList.add("active-green");
            }
        }
    });

    //Handle logworkout form
    document.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();

        const type = document.getElementById("workoutType").value;
        const duration = document.getElementById("duration").value;
        const date = document.getElementById("date").value;
        const workoutDetail = document.getElementById("workoutDetail").value;

        const calories = getCaloriesBurned(type, duration); // default 60kg
        const workout = { type, duration, date, workoutDetail, calories };

        // Store
        console.log("Logged Workout:", workout);
        alert("Workout recorded successfully!");

        // Clear inputs
        this.reset();
    });

    // Update placeholder based on workout type
    const workoutTypeSelect = document.getElementById("workoutType");
    const workoutDetail = document.getElementById("workoutDetail");

    workoutTypeSelect.addEventListener("change", function () {
        const selectedType = this.value;

        switch (selectedType) {
            case "cycling":
                workoutDetail.placeholder = "Distance (in km)";
                break;
            case "running":
                workoutDetail.placeholder = "Steps (e.g. 1000)";
                break;
            case "aerobic":
                workoutDetail.placeholder = "Type of Aerobic (e.g. Jumping Jacks)";
                break;
            case "yoga":
                workoutDetail.placeholder = "Type of Yoga (e.g. Vinyasa)";
                break;
            case "zumba":
                workoutDetail.placeholder = "Intensity (e.g. Basic, Strong)";
                break;
        }
    });


    // Step goal logic
    let goalSteps = localStorage.getItem("goalSteps") || 10000;
    goalSteps = parseInt(goalSteps);
    const goalValue = document.getElementById("goalValue");
    if (goalValue) {
    goalValue.textContent = `Goal: ${goalSteps}`;
    }
    // Example step count
    const currentSteps = 6800;
    // Update text
    document.getElementById('stepCount').textContent = currentSteps.toLocaleString();
    updateStepRing(currentSteps, goalSteps);

    // Prefill goal input
    const stepGoalInput = document.getElementById("stepGoal");
    if (stepGoalInput) {
        stepGoalInput.value = goalSteps;
    }

    // Set new goal on button click
    const setGoalBtn = document.getElementById("btn-set-goal");
    if (setGoalBtn) {
        setGoalBtn.addEventListener("click", () => {
            const newGoal = parseInt(stepGoalInput.value);
            if (!isNaN(newGoal) && newGoal > 0) {
                goalSteps = newGoal;
                localStorage.setItem("goalSteps", goalSteps);
                updateStepRing(currentSteps, goalSteps);
                if (goalValue) {
                    goalValue.textContent = `Goal: ${goalSteps}`;
                }
                alert("Step goal updated successfully!");
            } else {
                alert("Please enter a valid step goal.");
            }
        })
    }


});

const weight = parseInt(localStorage.getItem('userWeight'))  || "55";
function getCaloriesBurned(type, duration, weight) {
    // MET values for each workout type (approximate)
    const MET_VALUES = {
        cycling: 9.5,
        running: 9.8,
        aerobic: 6.83,
        yoga: 3.0,
        zumba: 4.5
    };

    const met = MET_VALUES[type]; 
    const time = duration;

    // Formula: Calories = Time (min) x MET × 3.5 weight (kg) / 200
    const calories = (time * met * 3.5 * weight) / 200;
    return Math.round(calories);
}

function updateStepRing(currentSteps, goalSteps) {
  const percent = currentSteps / goalSteps;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent);

  const progressCircle = document.querySelector('.streak-progress');
  progressCircle.style.strokeDasharray = `${circumference}`;
  progressCircle.style.strokeDashoffset = `${offset}`;

  document.getElementById('stepCount').textContent = currentSteps.toLocaleString();
}

// Log out
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
