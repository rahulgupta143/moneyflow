/* =====================================================
   MONEYFLOW - MONEY TRACKER
   EARNING & EXPENSE ARE COMPLETELY SEPARATE
===================================================== */

/* ================= DATABASE ================= */

const API_URL = "http://localhost:5000/api/money";

let data = {
  target: 0,
  earnings: [],
  expenses: [],
};

/* ================= LOAD FROM DATABASE ================= */

async function loadData() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load data");
    }

    const saved = await response.json();

    data = {
      target: Number(saved.target) || 0,

      earnings: Array.isArray(saved.earnings) ? saved.earnings : [],

      expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
    };

    console.log("Database data loaded ✅");

    renderAll();
  } catch (error) {
    console.error("Database load error:", error);

    alert("Database connect nahi ho raha.");
  }
}

/* ================= SAVE TO DATABASE ================= */

async function saveData() {
  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save data");
    }

    console.log("Data saved to MongoDB ✅", result);
  } catch (error) {
    console.error("Database save error:", error);
    alert("Data save nahi hua: " + error.message);
  }
}

async function deleteEntry(type, id) {
  const confirmed = confirm("Delete this entry?");

  if (!confirmed) return;

  if (type === "earning") {
    data.earnings = data.earnings.filter(
      (item) => Number(item.id) !== Number(id),
    );
  }

  if (type === "expense") {
    data.expenses = data.expenses.filter(
      (item) => Number(item.id) !== Number(id),
    );
  }

  await saveData();

  renderAll();
}

/* ================= HELPERS ================= */

function money(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHTML(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateID() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/* ================= TOTALS ================= */

function getTotalEarning() {
  return data.earnings.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );
}

function getTotalExpense() {
  return data.expenses.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );
}

function getTodayEarning() {
  const today = getToday();

  return data.earnings
    .filter((item) => item.date === today)
    .reduce((total, item) => total + Number(item.amount || 0), 0);
}

function getTodayExpense() {
  const today = getToday();

  return data.expenses
    .filter((item) => item.date === today)
    .reduce((total, item) => total + Number(item.amount || 0), 0);
}

/* ================= ELEMENTS ================= */

const navButtons = document.querySelectorAll(".nav-btn");

const pages = document.querySelectorAll(".page");

const menuBtn = document.getElementById("menuBtn");

const sidebar = document.querySelector(".sidebar");

/* ================= NAVIGATION ================= */

function showPage(pageName) {
  pages.forEach((page) => {
    page.classList.remove("active");
  });

  const selectedPage = document.getElementById(pageName);

  if (!selectedPage) return;

  selectedPage.classList.add("active");

  navButtons.forEach((button) => {
    button.classList.remove("active");

    if (button.dataset.page === pageName) {
      button.classList.add("active");
    }
  });

  /* Close mobile menu */

  if (window.innerWidth <= 700 && sidebar) {
    sidebar.classList.remove("mobile-open");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* Sidebar buttons */

navButtons.forEach((button) => {
  button.addEventListener("click", function () {
    showPage(this.dataset.page);
  });
});

/* Dashboard View All */

document.querySelectorAll("[data-page-link]").forEach((button) => {
  button.addEventListener("click", function () {
    showPage(this.dataset.pageLink);
  });
});

/* ================= BURGER MENU ================= */

if (menuBtn && sidebar) {
  menuBtn.addEventListener("click", function () {
    sidebar.classList.toggle("mobile-open");
  });
}

/* ================= DATE ================= */

function setDates() {
  const today = getToday();

  const earningDate = document.getElementById("earningDate");

  const expenseDate = document.getElementById("expenseDate");

  if (earningDate) {
    earningDate.value = today;
  }

  if (expenseDate) {
    expenseDate.value = today;
  }

  const currentDate = document.getElementById("currentDate");

  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
}

/* ================= TARGET ================= */

const targetBtn = document.getElementById("targetBtn");

if (targetBtn) {
  targetBtn.addEventListener("click", function () {
    const input = document.getElementById("targetInput");

    const amount = Number(input.value);

    if (!Number.isFinite(amount) || amount < 0) {
      alert("Please enter a valid target.");

      return;
    }

    data.target = amount;

    saveData();

    input.value = "";

    renderAll();
  });
}

/* ================= ADD EARNING ================= */

const earningForm = document.getElementById("earningForm");

if (earningForm) {
  earningForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const date = document.getElementById("earningDate").value;

    const amount = Number(document.getElementById("earningAmount").value);

    const note = document.getElementById("earningNote").value.trim();

    if (!date) {
      alert("Please select a date.");

      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid earning amount.");

      return;
    }

    /* Add earning */

    data.earnings.push({
      id: generateID(),

      date: date,

      amount: amount,

      note: note,
    });

    saveData();

    /* Reset form */

    earningForm.reset();

    document.getElementById("earningDate").value = getToday();

    renderAll();

    alert("Earning added successfully! 💰");
  });
}

/* ================= ADD EXPENSE ================= */

const expenseForm = document.getElementById("expenseForm");

if (expenseForm) {
  expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const date = document.getElementById("expenseDate").value;

    const amount = Number(document.getElementById("expenseAmount").value);

    const category = document.getElementById("expenseCategory").value;

    const note = document.getElementById("expenseNote").value.trim();

    if (!date) {
      alert("Please select a date.");

      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid expense amount.");

      return;
    }

    /* Add expense */

    data.expenses.push({
      id: generateID(),

      date: date,

      amount: amount,

      category: category,

      note: note,
    });

    saveData();

    /* Reset form */

    expenseForm.reset();

    document.getElementById("expenseDate").value = getToday();

    renderAll();

    alert("Expense added successfully! 💸");
  });
}

/* ================= SORT ================= */

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }

    return Number(b.id) - Number(a.id);
  });
}

/* ================= HISTORY ITEM ================= */

function createHistoryItem(item, type) {
  const isEarning = type === "earning";

  const title = isEarning ? "Earning" : item.category || "Expense";

  const icon = isEarning ? "↗" : "↘";

  const amount = isEarning
    ? "+" + money(item.amount)
    : "-" + money(item.amount);

  return `

    <div class="history-item">

      <div class="history-left">

        <div class="history-icon ${isEarning ? "income" : "expense"}">

          ${icon}

        </div>


        <div>

          <div class="history-title">

            ${escapeHTML(title)}

          </div>


          <div class="history-date">

            ${formatDate(item.date)}

            ${item.note ? " • " + escapeHTML(item.note) : ""}

          </div>

        </div>

      </div>


      <div>

        <span class="history-amount ${isEarning ? "income" : "expense"}">

          ${amount}

        </span>


        <button
          class="delete-btn"
          onclick="deleteEntry('${type}', ${item.id})"
        >

          Delete

        </button>

      </div>

    </div>

  `;
}

/* ================= EARNING HISTORY ================= */

function renderEarningHistory() {
  const container = document.getElementById("earningHistory");

  if (!container) return;

  const entries = sortEntries(data.earnings);

  if (!entries.length) {
    container.innerHTML = `

      <div class="empty-state">

        No earning records yet.

      </div>

    `;

    return;
  }

  container.innerHTML = entries
    .map((item) => createHistoryItem(item, "earning"))
    .join("");
}

/* ================= EXPENSE HISTORY ================= */

function renderExpenseHistory() {
  const container = document.getElementById("expenseHistory");

  if (!container) return;

  const entries = sortEntries(data.expenses);

  if (!entries.length) {
    container.innerHTML = `

      <div class="empty-state">

        No expense records yet.

      </div>

    `;

    return;
  }

  container.innerHTML = entries
    .map((item) => createHistoryItem(item, "expense"))
    .join("");
}

/* ================= RECENT ACTIVITY ================= */

function renderRecentActivity() {
  const container = document.getElementById("recentActivity");

  if (!container) return;

  const combined = [
    ...data.earnings.map((item) => ({
      ...item,
      type: "earning",
    })),

    ...data.expenses.map((item) => ({
      ...item,
      type: "expense",
    })),
  ];

  const recent = sortEntries(combined).slice(0, 6);

  if (!recent.length) {
    container.innerHTML = `

      <div class="empty-state">

        No activity yet.

      </div>

    `;

    return;
  }

  container.innerHTML = recent
    .map((item) => createHistoryItem(item, item.type))
    .join("");
}

/* ================= FULL HISTORY ================= */

let currentFilter = "all";

function renderFullHistory() {
  const container = document.getElementById("fullHistory");

  if (!container) return;

  let combined = [
    ...data.earnings.map((item) => ({
      ...item,
      type: "earning",
    })),

    ...data.expenses.map((item) => ({
      ...item,
      type: "expense",
    })),
  ];

  if (currentFilter !== "all") {
    combined = combined.filter((item) => item.type === currentFilter);
  }

  combined = sortEntries(combined);

  if (!combined.length) {
    container.innerHTML = `

      <div class="empty-state">

        No records found.

      </div>

    `;

    return;
  }

  container.innerHTML = combined
    .map((item) => createHistoryItem(item, item.type))
    .join("");
}

/* ================= FILTER ================= */

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", function () {
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));

    this.classList.add("active");

    currentFilter = this.dataset.filter;

    renderFullHistory();
  });
});

/* ================= DELETE ================= */

async function deleteEntry(type, id) {
  const confirmed = confirm("Delete this entry?");

  if (!confirmed) return;

  if (type === "earning") {
    data.earnings = data.earnings.filter(
      (item) => Number(item.id) !== Number(id),
    );
  }

  if (type === "expense") {
    data.expenses = data.expenses.filter(
      (item) => Number(item.id) !== Number(id),
    );
  }

  await saveData();

  renderAll();
}

/* ================= DASHBOARD ================= */

function renderDashboard() {
  const totalEarning = getTotalEarning();

  const totalExpense = getTotalExpense();

  const todayEarning = getTodayEarning();

  const todayExpense = getTodayExpense();

  const dashboardEarning = document.getElementById("dashboardEarning");

  if (dashboardEarning) {
    dashboardEarning.textContent = money(totalEarning);
  }

  const dashboardTarget = document.getElementById("dashboardTarget");

  if (dashboardTarget) {
    dashboardTarget.textContent = money(data.target);
  }

  const todayEarningElement = document.getElementById("todayEarning");

  if (todayEarningElement) {
    todayEarningElement.textContent = money(todayEarning);
  }

  const todayExpenseElement = document.getElementById("todayExpense");

  if (todayExpenseElement) {
    todayExpenseElement.textContent = money(todayExpense);
  }

  const totalExpenseElement = document.getElementById("totalExpense");

  if (totalExpenseElement) {
    totalExpenseElement.textContent = money(totalExpense);
  }

  const totalEntriesElement = document.getElementById("totalEntries");

  if (totalEntriesElement) {
    totalEntriesElement.textContent =
      data.earnings.length + data.expenses.length;
  }

  /* Target progress */

  let percentage = 0;

  if (data.target > 0) {
    percentage = (totalEarning / data.target) * 100;

    percentage = Math.min(percentage, 100);
  }

  const progress = document.getElementById("targetProgress");

  if (progress) {
    progress.style.width = percentage + "%";
  }

  const progressPercent = document.getElementById("progressPercent");

  if (progressPercent) {
    progressPercent.textContent = Math.round(percentage) + "%";
  }

  const remaining = data.target - totalEarning;

  const remainingElement = document.getElementById("targetRemaining");

  if (remainingElement) {
    if (!data.target) {
      remainingElement.textContent = "Set your target";
    } else if (remaining <= 0) {
      remainingElement.textContent = "Target reached 🎯";
    } else {
      remainingElement.textContent = money(remaining) + " remaining";
    }
  }

  renderRecentActivity();
}

/* ================= DAILY REWARD SYSTEM ================= */

function getEarningDays() {
  const days = [
    ...new Set(data.earnings.map((item) => item.date).filter(Boolean)),
  ];

  return days.sort();
}

function getCurrentStreak() {
  const earningDays = getEarningDays();

  if (!earningDays.length) {
    return 0;
  }

  const today = new Date(getToday() + "T00:00:00");

  const daySet = new Set(earningDays);

  let streak = 0;

  let checkDate = new Date(today);

  while (true) {
    const dateString = checkDate.toISOString().split("T")[0];

    if (!daySet.has(dateString)) {
      break;
    }

    streak++;

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

function getBestStreak() {
  const earningDays = getEarningDays();

  if (!earningDays.length) {
    return 0;
  }

  let best = 1;

  let current = 1;

  for (let i = 1; i < earningDays.length; i++) {
    const previous = new Date(earningDays[i - 1] + "T00:00:00");

    const currentDate = new Date(earningDays[i] + "T00:00:00");

    const difference = (currentDate - previous) / (1000 * 60 * 60 * 24);

    if (difference === 1) {
      current++;

      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function renderDailyReward() {
  const title = document.getElementById("rewardTitle");

  const message = document.getElementById("rewardMessage");

  const icon = document.getElementById("rewardIcon");

  const streakElement = document.getElementById("earningStreak");

  const bestElement = document.getElementById("bestStreak");

  const progress = document.getElementById("rewardProgress");

  const progressText = document.getElementById("rewardProgressText");

  if (
    !title ||
    !message ||
    !icon ||
    !streakElement ||
    !bestElement ||
    !progress ||
    !progressText
  ) {
    return;
  }

  const today = getToday();

  const earnedToday = data.earnings.some((item) => item.date === today);

  const streak = getCurrentStreak();

  const best = getBestStreak();

  streakElement.textContent = streak + " Day" + (streak === 1 ? "" : "s");

  bestElement.textContent = best + " Day" + (best === 1 ? "" : "s");

  /* Reward level */

  let nextGoal = 3;

  let rewardName = "Started";

  let rewardIcon = "🎁";

  if (streak >= 30) {
    rewardName = "Money Master";

    rewardIcon = "👑";

    nextGoal = 30;
  } else if (streak >= 15) {
    rewardName = "Consistent";

    rewardIcon = "💎";

    nextGoal = 30;
  } else if (streak >= 7) {
    rewardName = "1 Week Hustle";

    rewardIcon = "🏆";

    nextGoal = 15;
  } else if (streak >= 3) {
    rewardName = "3 Day Streak";

    rewardIcon = "🔥";

    nextGoal = 7;
  }

  title.textContent = rewardName;

  icon.textContent = rewardIcon;

  if (earnedToday) {
    message.textContent = "Today's earning added. Reward unlocked! 🎉";
  } else {
    message.textContent = "Add today's earning to unlock your reward.";
  }

  let previousGoal = 0;

  if (streak >= 30) {
    previousGoal = 30;
  } else if (streak >= 15) {
    previousGoal = 15;
  } else if (streak >= 7) {
    previousGoal = 7;
  } else if (streak >= 3) {
    previousGoal = 3;
  } else {
    previousGoal = 0;
  }

  let rewardPercentage = 0;

  if (streak >= 30) {
    rewardPercentage = 100;
  } else {
    rewardPercentage =
      ((streak - previousGoal) / (nextGoal - previousGoal)) * 100;
  }

  rewardPercentage = Math.max(0, Math.min(rewardPercentage, 100));

  progress.style.width = rewardPercentage + "%";

  if (streak >= 30) {
    progressText.textContent = "MAX LEVEL 👑";
  } else {
    progressText.textContent = streak + " / " + nextGoal + " days";
  }
}

/* ================= RENDER ALL ================= */

function renderAll() {
  renderDashboard();

  const earningTotal = document.getElementById("earningTotal");

  if (earningTotal) {
    earningTotal.textContent = money(getTotalEarning());
  }

  const expenseTotal = document.getElementById("expenseTotal");

  if (expenseTotal) {
    expenseTotal.textContent = money(getTotalExpense());
  }

  renderEarningHistory();

  renderExpenseHistory();

  renderFullHistory();

  renderDailyReward();
}

/* ================= START ================= */

loadData();

setDates();
