document.addEventListener("DOMContentLoaded", function () {
    // Function to clean up modal styles
    function cleanModalBackdrop() {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
    }

    // Listen for modal close events and clean up backdrop
    const modals = ['updateProfileModal', 'changePasswordModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('hidden.bs.modal', cleanModalBackdrop);
        }
    });

    // Check if the user is logged in
    const isLoggedIn = localStorage.getItem("loggedIn");
    if (isLoggedIn === "true") {
        document.body.classList.add("logged-in");

        const showIds = [
            "nav_tracker", "nav_nutrition", "nav_progress", "nav_reminder", "nav_profile",
            "quicklink_tracker", "quicklink_progress", "quicklink_nutrition", "quicklink_reminder"
        ];
        showIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("d-none");
        });

        const btn_login = document.querySelector("#btn_login");
        const btn_signup = document.querySelector("#btn_signup");
        const btn_get_started = document.querySelector("#btn_get_started");

        if (btn_login) btn_login.classList.add("d-none");
        if (btn_signup) btn_signup.classList.add("d-none");
        if (btn_get_started) btn_get_started.classList.add("d-none");
    }

    // Retrieve profile info from localStorage
    const username = localStorage.getItem("userUsername") || "User";
    const email = localStorage.getItem("userEmail") || "user@gmail.com";
    const age = localStorage.getItem("userAge") || "20";
    const gender = localStorage.getItem("userGender") || "Male";
    const height = localStorage.getItem("userHeight") || "168"; // Numeric value only, no "m"
    const weight = localStorage.getItem("userWeight") || "55"; // Numeric value only, no "kg"
    const targetWeight = localStorage.getItem("userTargetWeight") || "50"; // Numeric value only, no "kg"

    // Populate profile info on page
    const usernameHeading = document.querySelector(".profile h2");
    const profileFields = document.querySelectorAll(".profile .info-row span:last-child");
    if (usernameHeading) {
        usernameHeading.textContent = username; // Set username in <h2>
    }
    if (profileFields.length >= 6) {
        profileFields[0].textContent = email;
        profileFields[1].textContent = age;
        profileFields[2].textContent = gender;
        profileFields[3].textContent = `${height} m`;
        profileFields[4].textContent = `${weight} kg`;
        profileFields[5].textContent = `${targetWeight} kg`;
    }

    // Load profile picture
    const profilePic = document.getElementById("profilePic");
    const savedProfilePic = localStorage.getItem("userProfilePic");
    if (profilePic) {
        profilePic.src = savedProfilePic || "/images/signup&login.jpg";
    }

    // Show the update profile modal and populate with existing profile data
    const updateProfileButton = document.querySelector("#updateProfile");
    if (updateProfileButton) {
        updateProfileButton.addEventListener("click", () => {
            const modal = new bootstrap.Modal(document.getElementById("updateProfileModal"));
            document.getElementById("modalUsername").value = username;
            document.getElementById("modalEmail").value = email;
            document.getElementById("modalAge").value = age;
            document.getElementById("modalGender").value = gender;
            document.getElementById("modalHeight").value = height; // Numeric value
            document.getElementById("modalWeight").value = weight; // Numeric value
            document.getElementById("modalTargetWeight").value = targetWeight; // Numeric value
            
            const modalProfilePicInput = document.getElementById("modalProfilePic");
            const modalProfilePicPreview = document.getElementById("modalProfilePicPreview");

            if (modalProfilePicInput && modalProfilePicPreview) {
                // Show existing profile picture
                modalProfilePicPreview.src = savedProfilePic || "/images/signup&login.jpg";

                // Update preview when a new image is selected
                modalProfilePicInput.addEventListener("change", function () {
                    const file = this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            modalProfilePicPreview.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            modal.show();
        });
    }

    // Save the profile changes after the modal is closed
    const saveProfileChangesButton = document.getElementById("saveProfileChanges");
    if (saveProfileChangesButton) {
        saveProfileChangesButton.addEventListener("click", () => {
            const newUsername = document.getElementById("modalUsername").value;
            const newAge = document.getElementById("modalAge").value;
            const newGender = document.getElementById("modalGender").value;
            const newHeight = parseFloat(document.getElementById("modalHeight").value);
            const newWeight = parseFloat(document.getElementById("modalWeight").value);
            const newTargetWeight = parseFloat(document.getElementById("modalTargetWeight").value);
            const file = document.getElementById("modalProfilePic").files[0];

            // Save the updated values to localStorage
            localStorage.setItem("userUsername", newUsername);
            localStorage.setItem("userAge", newAge);
            localStorage.setItem("userGender", newGender);
            localStorage.setItem("userHeight", newHeight);
            localStorage.setItem("userWeight", newWeight);
            localStorage.setItem("userTargetWeight", newTargetWeight);

            // Save profile picture if selected
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    localStorage.setItem("userProfilePic", e.target.result);
                    location.reload(); // Reload after setting the image
                };
                reader.readAsDataURL(file);
            } else {
                location.reload();
            }

            // Close the modal and clean up the backdrop
            const modal = bootstrap.Modal.getInstance(document.getElementById("updateProfileModal"));
            modal.hide();

            // Reload to reflect the changes
            location.reload();
        });
    }

    // Change password functionality
    const changePasswordButton = document.getElementById("changePassword");
    if (changePasswordButton) {
        changePasswordButton.addEventListener("click", () => {
            const changePasswordModal = new bootstrap.Modal(document.getElementById("changePasswordModal"));
            changePasswordModal.show();
        });
    }

    // Validate the password change form
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmPassword");
    const newPasswordError = document.getElementById("newPasswordError");
    const confirmNewPasswordError = document.getElementById("confirmNewPasswordError");

    function validatePassword() {
        const password = newPasswordInput.value;
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordPattern.test(password)) {
            newPasswordError.classList.remove("d-none");
        } else {
            newPasswordError.classList.add("d-none");
        }
    }

    function validateConfirmPassword() {
        const password = newPasswordInput.value;
        const confirmPassword = confirmNewPasswordInput.value;
        if (password !== confirmPassword) {
            confirmNewPasswordError.classList.remove("d-none");
        } else {
            confirmNewPasswordError.classList.add("d-none");
        }
    }

    newPasswordInput.addEventListener("input", validatePassword);
    confirmNewPasswordInput.addEventListener("input", validateConfirmPassword);

    // Save new password
    const saveNewPasswordButton = document.getElementById("saveNewPassword");
    if (saveNewPasswordButton) {
        saveNewPasswordButton.addEventListener("click", () => {
            validatePassword();
            validateConfirmPassword();

            // If no errors, save the new password
            if (newPasswordError.classList.contains("d-none") && confirmNewPasswordError.classList.contains("d-none")) {
                const newPassword = newPasswordInput.value;
                localStorage.setItem("userPassword", newPassword);

                // Close the modal and clean up the backdrop
                const changePasswordModal = bootstrap.Modal.getInstance(document.getElementById("changePasswordModal"));
                changePasswordModal.hide();

                // Optionally reload to reflect the changes
                location.reload();
            }
        });
    }

});

// Log out
const btn_logout = document.querySelector("#btn_logout");
btn_logout.addEventListener("click", logout);

function logout() {
  // Retain the 'mealFavorites' in localStorage, clear other data
  const favorites = localStorage.getItem('mealFavourites');

  // Clear all other data in localStorage
  localStorage.clear();

  // Restore the 'mealFavorites' back to localStorage
  if (favorites) {
    localStorage.setItem('mealFavourites', favorites);
  }

  // Redirect after a slight delay
  setTimeout(function () {
    window.location.href = "Login.html";
  }, 500);
}
