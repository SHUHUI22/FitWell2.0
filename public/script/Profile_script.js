document.addEventListener("DOMContentLoaded", function () {
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

    const updateProfileButton = document.querySelector("#updateProfile");
    if (updateProfileButton) {
        updateProfileButton.addEventListener("click", () => {
            const modal = new bootstrap.Modal(document.getElementById("updateProfileModal"));
            const profilePic = document.getElementById("profilePic").src;
            const preview = document.getElementById("modalProfilePicPreview");
            if (preview) preview.src = profilePic;

            const fileInput = document.getElementById("modalProfilePic");
            if (fileInput && preview) {
                fileInput.addEventListener("change", function () {
                    const file = this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            preview.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            modal.show();
        });
    }

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
            // Perform your custom validation (password strength and matching)
            const newPass = newPasswordInput.value.trim();
            const confirm = confirmNewPasswordInput.value.trim();
            const isNewPassValid = validatePasswordStrength(newPass);
            const isMatch = newPass === confirm;

            if (!isNewPassValid || !isMatch) {
                e.preventDefault(); // prevent submission if invalid
                // Show your custom errors if needed
                newPasswordError.classList.toggle("d-none", isNewPassValid);
                confirmNewPasswordError.classList.toggle("d-none", isMatch);
            } else {
                // If everything is valid, allow browser validation to do its thing (e.g. for required fields)
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