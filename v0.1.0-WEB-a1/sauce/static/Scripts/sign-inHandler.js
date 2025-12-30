/*
QR Attendy base on Website and WebApp lol
Develop by BELDAD-Ace on Github with the team group 1 for PR2
aka Jhon Benedict Belad

all rights reserved 2025

*/

document.getElementById("signin-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;
    const msg = document.getElementById("signin-msg");

    try {
        const response = await fetch("/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const text = await response.text();
        msg.textContent = text;
        msg.style.color = response.ok ? "green" : "red";

        if (response.ok && text.includes("Login successful")) {
            // redirect based on role
            const res = await fetch("/dashboard");
            const dashText = await res.text();

            if (dashText.includes("teacher")) {
                window.location.href = "/dashboard/teacher.html";
            } else if (dashText.includes("student")) {
                window.location.href = "/dashboard/student.html";
            } else {
                window.location.href = "/dashboard/core.html";
            }
        }
    } catch (err) {
        msg.textContent = "Error: " + err.message;
        msg.style.color = "red";
    }
});
