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
 const confirmPasswordInput = document.getElementById("confirm_password");
 const passwordError = document.getElementById("passwordError");
 const confirmPasswordError = document.getElementById("confirmPasswordError");

 function validatePassword() {
     const password = passwordInput.value;
     const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
     if (!passwordPattern.test(password)) {
        passwordError.classList.remove("d-none");
     } else {
        passwordError.classList.add("d-none");
     }
 }

 function validateConfirmPassword() {
     const password = passwordInput.value;
     const confirmPassword = confirmPasswordInput.value;
     if (password !== confirmPassword) {
        confirmPasswordError.classList.remove("d-none");
     } else {
        confirmPasswordError.classList.add("d-none");
     }
 }

 passwordInput.addEventListener("input", validatePassword);
 confirmPasswordInput.addEventListener("input", validateConfirmPassword);

 const params = new URLSearchParams(window.location.search);
 if(params.get("error") === "exists"){
    Swal.fire({
            icon: 'error',
            title: 'Email already registered',
            text: 'Please use a different email/login to your account.',
        });
 }