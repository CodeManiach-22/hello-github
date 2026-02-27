// ===== Helpers
function money(n) {
  const x = Number(n || 0);
  return "$" + x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function loadTx() {
  const raw = localStorage.getItem("finpro_tx");
  if (!raw) return seedTx();
  try { return JSON.parse(raw); } catch { return seedTx(); }
}

function saveTx(tx) {
  localStorage.setItem("finpro_tx", JSON.stringify(tx));
}

function seedTx() {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0,10);
  const tx = [
    { id: crypto.randomUUID(), date: iso(today), type:"Income", category:"Consulting", party:"Client A", amount: 4500, note:"Retainer" },
    { id: crypto.randomUUID(), date: iso(today), type:"Expense", category:"Internet", party:"Safaricom", amount: 80, note:"Monthly" },
    { id: crypto.randomUUID(), date: iso(today), type:"Expense", category:"Transport", party:"Fuel", amount: 120, note:"Site visit" },
  ];
  saveTx(tx);
  return tx;
}

function calcMTD(tx) {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  let inc = 0, exp = 0;
  tx.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() === m && d.getFullYear() === y) {
      if (t.type === "Income") inc += Number(t.amount);
      else exp += Number(t.amount);
    }
  });
  return { inc, exp, net: inc - exp };
}

// ===== Footer year
const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();
const y2 = document.getElementById("year2");
if (y2) y2.textContent = new Date().getFullYear();

// ===== LOGIN PAGE LOGIC (demo)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
 // ===== Simple account store (DEMO ONLY)
function loadUsers() {
  try { return JSON.parse(localStorage.getItem("finpro_users") || "{}"); }
  catch { return {}; }
}
function saveUsers(users) {
  localStorage.setItem("finpro_users", JSON.stringify(users));
}

// Very simple hash (DEMO ONLY). Not secure like a real backend.
async function hash(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ===== LOGIN PAGE
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const error = document.getElementById("error");

  // SIGNUP
  const signupForm = document.getElementById("signupForm");
  const suEmail = document.getElementById("suEmail");
  const suPassword = document.getElementById("suPassword");
  const suMsg = document.getElementById("suMsg");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    suMsg.textContent = "";

    const eVal = suEmail.value.trim().toLowerCase();
    const pVal = suPassword.value;

    if (pVal.length < 6) {
      suMsg.textContent = "Password must be at least 6 characters.";
      return;
    }

    const users = loadUsers();
    if (users[eVal]) {
      suMsg.textContent = "That email is already registered. Please log in.";
      return;
    }

    users[eVal] = { passHash: await hash(pVal), createdAt: new Date().toISOString() };
    saveUsers(users);

    suMsg.style.color = "#34d399";
    suMsg.textContent = "Account created! You can log in now.";
    signupForm.reset();
    setTimeout(() => { suMsg.textContent = ""; suMsg.style.color = ""; }, 1500);
  });

  // LOGIN
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.textContent = "";

    const eVal = email.value.trim().toLowerCase();
    const pVal = password.value;

    const users = loadUsers();
    const user = users[eVal];

    if (!user) {
      error.textContent = "No account found. Please sign up first.";
      return;
    }

    const pHash = await hash(pVal);
    if (pHash !== user.passHash) {
      error.textContent = "Wrong password.";
      return;
    }

    localStorage.setItem("finpro_user", eVal);
    window.location.href = "dashboard.html";
  });

  // Make sure demo transactions exist (optional)
  if (!localStorage.getItem("finpro_tx")) {
    localStorage.setItem("finpro_tx", JSON.stringify([]));
  }
}
}

// ===== AUTH GUARD + header user email
function requireAuth() {
  const user = localStorage.getItem("finpro_user");
  if (!user) window.location.href = "index.html";
  const userEmail = document.getElementById("userEmail");
  if (userEmail) userEmail.textContent = user;

  const logout = document.getElementById("logout");
  if (logout) {
    logout.addEventListener("click", () => {
      localStorage.removeItem("finpro_user");
      window.location.href = "index.html";
    });
  }
  return user;
}

// If we are on an inside page, require auth:
if (document.getElementById("logout") || document.getElementById("userEmail")) {
  requireAuth();
}

// ===== TRANSACTIONS PAGE
const txBody = document.getElementById("txBody");
if (txBody) {
  const tx = loadTx();
  const search = document.getElementById("search");
  const exportCsv = document.getElementById("exportCsv");

  const incomeMTD = document.getElementById("incomeMTD");
  const expenseMTD = document.getElementById("expenseMTD");
  const netMTD = document.getElementById("netMTD");

  function render(list) {
    txBody.innerHTML = "";
    list.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${t.party}</td>
        <td>${money(t.amount)}</td>
        <td>${t.note || ""}</td>
        <td><button class="miniBtn" data-id="${t.id}">Delete</button></td>
      `;
      txBody.appendChild(tr);
    });

    const m = calcMTD(list);
    incomeMTD.textContent = money(m.inc);
    expenseMTD.textContent = money(m.exp);
    netMTD.textContent = money(m.net);
    netMTD.classList.toggle("good", m.net >= 0);
  }

  function filtered() {
    const q = (search.value || "").trim().toLowerCase();
    if (!q) return tx;
    return tx.filter(t =>
      [t.date, t.type, t.category, t.party, String(t.amount), t.note]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  render(filtered());

  search.addEventListener("input", () => render(filtered()));

  txBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const idx = tx.findIndex(x => x.id === id);
    if (idx >= 0) {
      tx.splice(idx, 1);
      saveTx(tx);
      render(filtered());
    }
  });

  // Add transaction form
  const form = document.getElementById("txForm");
  const msg = document.getElementById("txMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const t = {
      id: crypto.randomUUID(),
      date: document.getElementById("txDate").value,
      type: document.getElementById("txType").value,
      category: document.getElementById("txCategory").value.trim(),
      party: document.getElementById("txParty").value.trim(),
      amount: Number(document.getElementById("txAmount").value),
      note: document.getElementById("txNote").value.trim(),
    };

    if (!t.date || !t.category || !t.party || !(t.amount >= 0)) {
      msg.textContent = "Please fill all required fields correctly.";
      return;
    }

    tx.unshift(t);
    saveTx(tx);
    form.reset();
    msg.textContent = "Added!";
    render(filtered());
    setTimeout(() => (msg.textContent = ""), 1200);
  });

  // Export CSV
  exportCsv.addEventListener("click", () => {
    const rows = [["Date","Type","Category","Vendor/Client","Amount","Note"], ...tx.map(t => [
      t.date, t.type, t.category, t.party, t.amount, t.note || ""
    ])];

    const csv = rows.map(r =>
      r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ===== REPORTS PAGE
const plIncome = document.getElementById("plIncome");
if (plIncome) {
  const tx = loadTx();
  let inc = 0, exp = 0;
  tx.forEach(t => (t.type === "Income" ? inc += Number(t.amount) : exp += Number(t.amount)));
  const net = inc - exp;

  document.getElementById("plIncome").textContent = money(inc);
  document.getElementById("plExpense").textContent = money(exp);
  document.getElementById("plNet").textContent = money(net);
  document.getElementById("plNet2").textContent = money(net);

  // demo cash flow = net
  document.getElementById("cashFlow").textContent = money(net);

  // run rate = net * (30 / day_of_month) approx
  const day = new Date().getDate();
  const rr = day > 0 ? (calcMTD(tx).net * (30 / day)) : net;
  document.getElementById("runRate").textContent = money(rr);
}

// ===== SETTINGS PAGE
const toggleTheme = document.getElementById("toggleTheme");
if (toggleTheme) {
  const root = document.documentElement;
  const saved = localStorage.getItem("finpro_theme");
  if (saved === "dark") root.classList.add("dark");

  toggleTheme.addEventListener("click", () => {
    root.classList.toggle("dark");
    localStorage.setItem("finpro_theme", root.classList.contains("dark") ? "dark" : "light");
  });

  const resetData = document.getElementById("resetData");
  resetData.addEventListener("click", () => {
    if (!confirm("Reset all demo transactions?")) return;
    localStorage.removeItem("finpro_tx");
    seedTx();
    alert("Transactions reset.");
  });
}