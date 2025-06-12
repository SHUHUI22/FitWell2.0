document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".notification-toggle").forEach(toggle => {
    toggle.addEventListener("change", async function () {
        const category = this.dataset.category;
        const isEnabled = this.checked;

        try {
            const response = await fetch("/FitWell/toggleNotification", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category,
                    isNotificationEnabled: isEnabled
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Update failed");
            console.log("Notification setting updated:", result);
        } catch (error) {
            console.error("Error updating notification setting:", error);
            alert("Failed to update notification setting.");
        }
    });
});

    function cleanModalBackdrop() {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
    }

    const modals = ['updateProfileModal', 'changePasswordModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('hidden.bs.modal', cleanModalBackdrop);
        }
    });
    
        const modal = new bootstrap.Modal(document.getElementById("updateProfileModal"));
        const openBtn = document.querySelector("#updateProfile");
        const fileInput = document.getElementById("modalProfilePic");
        const previewImg = document.getElementById("modalProfilePicPreview");

        if (openBtn) {
            openBtn.addEventListener("click", () => {
            modal.show();
            });
        }

        if (fileInput && previewImg) {
            fileInput.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                previewImg.src = e.target.result; // ⚡ Live preview!
                };
                reader.readAsDataURL(file);
            }
            });
        }

    const originalProfileData = {
        username: document.getElementById("modalUsername").value,
        age: document.getElementById("modalAge").value,
        gender: document.getElementById("modalGender").value,
        height: document.getElementById("modalHeight").value,
        weight: document.getElementById("modalWeight").value,
        targetWeight: document.getElementById("modalTargetWeight").value,
        profilePicSrc: document.getElementById("modalProfilePicPreview").src
    };

    document.getElementById("updateProfileModal").addEventListener("hidden.bs.modal", function () {
    document.getElementById("modalUsername").value = originalProfileData.username;
    document.getElementById("modalAge").value = originalProfileData.age;
    document.getElementById("modalGender").value = originalProfileData.gender;
    document.getElementById("modalHeight").value = originalProfileData.height;
    document.getElementById("modalWeight").value = originalProfileData.weight;
    document.getElementById("modalTargetWeight").value = originalProfileData.targetWeight;
    document.getElementById("modalProfilePicPreview").src = originalProfileData.profilePicSrc;

    // Clear file input
    document.getElementById("modalProfilePic").value = "";
    });


    const changePasswordButton = document.getElementById("changePassword");
    if (changePasswordButton) {
        changePasswordButton.addEventListener("click", () => {
            const modal = new bootstrap.Modal(document.getElementById("changePasswordModal"));
            modal.show();
        });
    }

    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmPassword");

    const newPasswordError = document.getElementById("newPasswordError");
    const confirmNewPasswordError = document.getElementById("confirmNewPasswordError");
    const saveNewPasswordButton = document.getElementById("saveNewPassword");

    function validatePasswordStrength(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
    }

    function validateForm() {
        const current = currentPasswordInput.value.trim();
        const newPass = newPasswordInput.value.trim();
        const confirm = confirmNewPasswordInput.value.trim();

        const isNewPassValid = validatePasswordStrength(newPass);
        const isMatch = newPass === confirm;
        const isCurrentValid = current.length > 0;

        newPasswordError.classList.toggle("d-none", isNewPassValid || newPass === "");
        confirmNewPasswordError.classList.toggle("d-none", isMatch || confirm === "");

        saveNewPasswordButton.disabled = false;
    }

    currentPasswordInput.addEventListener("input", validateForm);
    newPasswordInput.addEventListener("input", validateForm);
    confirmNewPasswordInput.addEventListener("input", validateForm);

    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", function (e) {
            // Perform custom validation (password strength and matching)
            const newPass = newPasswordInput.value.trim();
            const confirm = confirmNewPasswordInput.value.trim();
            const isNewPassValid = validatePasswordStrength(newPass);
            const isMatch = newPass === confirm;

            if (!isNewPassValid || !isMatch) {
                e.preventDefault(); // prevent submission if invalid
                // Show error
                newPasswordError.classList.toggle("d-none", isNewPassValid);
                confirmNewPasswordError.classList.toggle("d-none", isMatch);
            } else {
                // If everything is valid, allow browser validation to do its thing
                newPasswordError.classList.add("d-none");
                confirmNewPasswordError.classList.add("d-none");
            }
        });

    }

        // Show modal if server sent password error
        const showModalTrigger = document.getElementById("showChangePasswordModal");
        if (showModalTrigger && showModalTrigger.value === "true") {
            const modal = new bootstrap.Modal(document.getElementById("changePasswordModal"));
            modal.show();
        }

        // Hide current password error on input
        const currentPasswordError = document.getElementById("currentPasswordError");
        if (currentPasswordInput && currentPasswordError) {
            currentPasswordInput.addEventListener("input", () => {
                currentPasswordError.classList.add("d-none");
            });
        }

        const flagElement = document.getElementById("profile-flags");
        const passwordError = flagElement?.dataset.passwordError === "true";
        const passwordChangedSuccess = flagElement?.dataset.passwordSuccess === "true";

        if (passwordError) {
            const modal = new bootstrap.Modal(document.getElementById("changePasswordModal"));
            modal.show();
        }

        
        if (passwordChangedSuccess) {
            alert("Password successfully updated!");
        }


    const resetChangePasswordModal = () => {
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmNewPasswordInput.value = '';
    newPasswordError.classList.add("d-none");
    confirmNewPasswordError.classList.add("d-none");
    saveNewPasswordButton.disabled = true;
    };

    const passwordModal = document.getElementById("changePasswordModal");
    if (passwordModal) {
        passwordModal.addEventListener("hidden.bs.modal", resetChangePasswordModal);
    }

    const btn_logout = document.querySelector("#btn_logout");
    if (btn_logout) {
        btn_logout.addEventListener("click", () => {
            window.location.href = "/FitWell/Logout";
        });
    }

    const deleteAccountBtn = document.getElementById("deleteAccount");
    if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => {
        const modal = new bootstrap.Modal(document.getElementById("deleteAccountModal"));
        modal.show();
    });
    }

});