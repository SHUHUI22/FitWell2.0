const bsModal = new bootstrap.Modal(document.getElementById('editModal'));

const activityData = [
  {
    date: "16 Apr",
    type: "Cycling",
    detail: "15.2 km",
    time: "45 min",
    calories: "411 kcal"
  },
  {
    date: "15 Apr",
    type: "Yoga",
    detail: "Vinyasa",
    time: "30 min",
    calories: "87 kcal"
  }
];

const activityContainer = document.getElementById("activityHistory");
activityContainer.innerHTML = '<h2 class="fw-bold mb-4">Activity History</h2>';

let currentDate = "";
let currentActivity = null;
let currentCard = null;
let currentActivityToDelete = null;
let currentCardToDelete = null;

activityData.forEach((activity, index) => {
  if (activity.date !== currentDate) {
    const dateHeading = document.createElement("div");
    dateHeading.innerHTML = `<strong>${activity.date}</strong>`;
    dateHeading.classList.add("mb-2", "mt-3");
    activityContainer.appendChild(dateHeading);
    currentDate = activity.date;
  }

  // //Create Activity Card
  const activityCard = document.createElement("div");
  activityCard.className = "container mb-3 p-3 border rounded d-flex align-items-center justify-content-between flex-wrap history-card";

  activityCard.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <i class="fas fa-${getIcon(activity.type)} me-3 fs-4"></i>
      <div><strong>${activity.type}</strong></div>
      <i class="fas ${getDetailIcon(activity.type)}"></i>
      <span class="detail">${activity.detail}</span>
      <i class="fas fa-stopwatch"></i> <span class="time">${activity.time}</span>
      <i class="fas fa-fire"></i> <span class="calories">${activity.calories}</span>
    </div>
    <div class="d-flex justify-content-center mx-auto mx-lg-0 mt-2 mt-lg-0">
      <button class="btn btn-outline-success btn-sm me-2 btn-edit">
        <i class="fas fa-pen"></i>
      </button>
      <button class="btn btn-outline-danger btn-sm btn-delete">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  // Append to container
  activityContainer.appendChild(activityCard);

  // Attach event listeners
  const btnEdit = activityCard.querySelector(".btn-edit");
  const btnDelete = activityCard.querySelector(".btn-delete");

  //Edit Button
  btnEdit.addEventListener("click", () => {
    const detailInput = document.getElementById("editDetail");
    const timeInput = document.getElementById("editTime");
    const calInput = document.getElementById("editCalories");
    const detailLabel = document.getElementById("detailLabel");
    const saveBtn = document.getElementById("saveEdit");

    // Save which card we're editing
    currentActivity = activity;
    currentCard = activityCard;


    // Pre-fill values
    detailLabel.textContent = `Enter ${getDetailLabel(activity.type)}:`;
    detailInput.value = activity.detail;
    timeInput.value = activity.time;
    calInput.value = activity.calories;

    // Remove old listener
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener("click", () => {
      const newDetail = detailInput.value;
      const newTime = timeInput.value;
      const weight = parseInt(localStorage.getItem('userWeight')) || "55";
      const duration = parseFloat(newTime.replace(/[^\d.]/g, ""));

      currentActivity.detail = newDetail;
      currentActivity.time = newTime;
      currentActivity.calories = getCaloriesBurned(currentActivity.type.toLowerCase(), duration, weight) + " kcal";

      currentCard.querySelector(".detail").textContent = newDetail;
      currentCard.querySelector(".time").textContent = currentActivity.time;
      currentCard.querySelector(".calories").textContent = currentActivity.calories;

      bsModal.hide();
    });
    // Show the modal
    bsModal.show();
  });

  //Delete Button
  btnDelete.addEventListener("click", () => {
    currentCardToDelete = activityCard;
    currentActivityToDelete = activity;

    const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
    deleteModal.show();
  });
});

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
confirmDeleteBtn.addEventListener("click", () => {
  if (currentCardToDelete && currentActivityToDelete) {
    // Remove card
    currentCardToDelete.remove();

    // Check if any other cards exist with the same date
    const sameDateCards = Array.from(activityContainer.querySelectorAll(".history-card")).some(card => {
      const heading = card.previousElementSibling;
      return heading && heading.textContent === currentActivityToDelete.date;
    });

    // Remove heading if no more same-date cards
    if (!sameDateCards) {
      const headings = activityContainer.querySelectorAll("div.mb-2.mt-3");
      headings.forEach(heading => {
        if (heading.textContent === currentActivityToDelete.date) {
          heading.remove();
        }
      });
    }

    // Reset
    currentCardToDelete = null;
    currentActivityToDelete = null;
  }

  const deleteModalEl = document.getElementById("deleteModal");
  const modal = bootstrap.Modal.getInstance(deleteModalEl);
  modal.hide();
});

function getIcon(type) {
  switch (type.toLowerCase()) {
    case 'cycling':
      return 'person-biking';
    case 'running':
      return 'person-running';
    case 'walking':
      return 'person-walking';
    case "aerobic":
      return "heart-pulse";
    case "yoga":
      return "person-praying";
    case "zumba":
      return "fa-music";
    default: return 'dumbbell';
  }
}

function getDetailLabel(type) {
  switch (type.toLowerCase()) {
    case "cycling": return "Distance";
    case "running": return "Steps";
    case "aerobic": return "Type";
    case "yoga": return "Type";
    case "zumba": return "Intensity";
  }
}

function getDetailIcon(type) {
  switch (type.toLowerCase()) {
    case "cycling": return "fa-location-dot";
    case "running": return "fa-shoe-prints";
    case "aerobic": return "fa-circle-info";
    case "yoga": return "fa-circle-info";
    case "zumba": return "fa-circle-info";
  }
}

function getCaloriesBurned(type, duration, weight) {
  const MET_VALUES = {
    cycling: 9.5,
    running: 9.8,
    aerobic: 6.83,
    yoga: 3.0,
    zumba: 4.5
  };

  const met = MET_VALUES[type]
  const time = duration;

  // Formula: Calories = Time (min) x MET × 3.5 weight (kg) / 200
  const calories = (time * met * 3.5 * weight) / 200;
  return Math.round(calories);
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
