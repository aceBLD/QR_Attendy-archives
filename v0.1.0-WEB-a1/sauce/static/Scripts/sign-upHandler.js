/*
QR Attendy base on Website and WebApp lol
Develop by BELDAD-Ace on Github with the team group 1 for PR2
aka Jhon Benedict Belad

all rights reserved 2025

*/
//for SIGN UP form at main and main_mobil
document.getElementById("signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const fullName = document.getElementById("signup-fullname").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm").value;
    const role = document.querySelector("input[name='role']:checked").value;

    const msg = document.getElementById("signup-msg");

    if (password !== confirmPassword) {
        msg.textContent = "Passwords do not match!";
        msg.style.color = "red";
        return;
    }

    try {
        const response = await fetch("/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password, role })
        });

        const text = await response.text();
        msg.textContent = text;
        msg.style.color = response.ok ? "green" : "red";

        if (response.ok) {
            setTimeout(() => window.location.href = "index.html", 1500);
        }
    } catch (err) {
        msg.textContent = "Error: " + err.message;
        msg.style.color = "red";
    }
});

