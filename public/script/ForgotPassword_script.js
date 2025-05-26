// Animation: slide out welcome message when hover
const leftSide = document.getElementById('left_side');
const overlay = document.getElementById('hover_overlay');
const message = document.getElementById('welcome_message');

leftSide.addEventListener('mouseenter', () => {
    overlay.style.transform = 'translateX(0)';
    message.style.opacity = '1';
    message.style.transform = 'translateX(0)';
});

leftSide.addEventListener('mouseleave', () => {
    overlay.style.transform = 'translateX(-100%)';
    message.style.opacity = '0';
    message.style.transform = 'translateX(-50px)';
});


// Validate the password
const passwordInput = document.getElementById("password");
const passwordError = document.getElementById("passwordError");


function validatePassword() {
    const password = passwordInput.value;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordPattern.test(password)) {
        passwordError.classList.remove("d-none");
    } else {
        passwordError.classList.add("d-none");
    }
}

if(passwordInput && passwordError){
    passwordInput.addEventListener("input", validatePassword);
}

const params = new URLSearchParams(window.location.search);
if (params.get("error") === "usernotfound") {
    Swal.fire({
        icon: "error",
        title: "Email not found",
        text: "No account with this email. Please sign up.",
    });
}
else if (params.get("success") === "resetSent") {
        Swal.fire({
            icon: "success",
            title: "Reset Link Sent",
            text: "Please check your email for the password reset link.",
        });
}
else if (params.get("error") === "expired") {
        Swal.fire({
            icon: "error",
            title: "Reset Link Expired",
            text: "Password reset link is invalid or has expired.Please try again.",
        });
}
else if (params.get("success") === "resetSuccess") {
        Swal.fire({
            icon: "success",
            title: "Password Reset Successfully",
            text: "Your password has been successfully updated. You can now login.",
        });
}
