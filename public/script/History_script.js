document.addEventListener("DOMContentLoaded", () => {
  const bsModal = new bootstrap.Modal(document.getElementById('editModal'));
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

  let currentEditActivity = null;
  let currentDeleteActivity = null;

  // Get user's weight
  const weight = parseFloat(document.getElementById("userWeight").value);

  // Select all edit buttons and attach listeners
  document.querySelectorAll(".btn-edit").forEach(button => {
    button.addEventListener("click", () => {
      const activityId = button.dataset.id;
      const activity = activityData.find(a => a._id === activityId);

      if (!activity) {
        alert("Activity not found!");
        return;
      }

      currentEditActivity = activity;
      document.getElementById("detailLabel").textContent = `Enter ${getDetailLabel(activity.workoutType)}:`;
      document.getElementById("editDetail").value = activity.detail;
      document.getElementById("editTime").value = activity.duration;
      document.getElementById("editCalories").value = activity.caloriesBurned;

      // Change the label dynamically
      const labelText = getDetailLabel(activity.workoutType);
      document.getElementById('detailLabel').textContent = `Enter ${labelText}`;

      bsModal.show();
    });
  });

  // Handle save edit
  document.getElementById("saveEdit").addEventListener("click", () => {
    if (!currentEditActivity) return;
    
    const newDetail = document.getElementById("editDetail").value;
    const newTime = document.getElementById("editTime").value;

    const duration = parseFloat(newTime.replace(/[^\d.]/g, ""));

    const newCalories = getCaloriesBurned(currentEditActivity.workoutType.toLowerCase(), duration, weight);

    // Update values in modal
    currentEditActivity.detail = newDetail;
    currentEditActivity.duration = newTime;
    currentEditActivity.caloriesBurned = newCalories;

    // Send update to backend
    fetch(`/FitWell/activities/${currentEditActivity._id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentEditActivity.userId,
        detail: newDetail,
        duration: duration,
        caloriesBurned: newCalories 
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to update activity");
        console.log("Activity updated successfully");

        location.reload();
      })
      .catch(err => {
        console.error(err);
        alert("Failed to update activity");
      });

    bsModal.hide();
  });

  // Select all delete buttons and attach listeners
  document.querySelectorAll(".btn-delete").forEach(button => {
    button.addEventListener("click", () => {
      const activityId = button.dataset.id;

      const activity = activityData.find(a => a._id === activityId);
    
      if (!activity) {
          alert("Activity not found!");
      return;
      }

      currentDeleteActivity = activity;
      deleteModal.show();
    });
  });

  // Handle confirm delete
  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    if (!currentDeleteActivity) return;

    const activityId = currentDeleteActivity._id;

    fetch(`/FitWell/activities/${activityId}`, {
      method: "DELETE"
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to delete activity");
        console.log("Activity deleted successfully");

        location.reload(); // reload to refresh list
      })
      .catch(err => {
        console.error(err);
        alert("Failed to delete activity");
      });

    deleteModal.hide();
  });

  function getDetailLabel(type) {
    switch (type) {
      case "Cycling": return "Distance";
      case "Running": return "Steps";
      case "Aerobic": return "Type";
      case "Yoga": return "Type";
      case "Zumba": return "Intensity";
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
});