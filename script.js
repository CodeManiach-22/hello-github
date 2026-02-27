// Footer year
const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();
const y2 = document.getElementById("year2");
if (y2) y2.textContent = new Date().getFullYear();

// LOGIN PAGE LOGIC (demo only)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const error = document.getElementById("error");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const eVal = email.value.trim().toLowerCase();
    const pVal = password.value;

    // Demo credentials (change if you want)
    const ok = eVal.length > 3 && pVal.length >= 4;

    if (!ok) {
      error.textContent = "Invalid email or password (use the demo credentials).";
      return;
    }

    // Store session (demo only)
    localStorage.setItem("finpro_user", eVal);
    window.location.href = "dashboard.html";
  });

  // Small UX links
  document.getElementById("forgot").addEventListener("click", (e) => {
    e.preventDefault();
    alert("Demo only: password reset needs a real backend.");
  });

  document.getElementById("create").addEventListener("click", (e) => {
    e.preventDefault();
    alert("Demo only: sign-up needs a real backend.");
  });
}

// DASHBOARD LOGIC
const userEmail = document.getElementById("userEmail");
if (userEmail) {
  const user = localStorage.getItem("finpro_user");
  if (!user) window.location.href = "index.html";
  userEmail.textContent = user;

  const logout = document.getElementById("logout");
  logout.addEventListener("click", () => {
    localStorage.removeItem("finpro_user");
    window.location.href = "index.html";
  });
}const showPass = document.getElementById("showPass");
showPass.addEventListener("change", () => {
  password.type = showPass.checked ? "text" : "password";
});