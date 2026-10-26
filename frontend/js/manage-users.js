// ===============================
// IMPORTS
// ===============================
import api from "../utils/axiosInstance.js";
import { API_PATHS } from "../utils/apiPaths.js";

// ===============================
// GLOBAL STATE
// ===============================
let users = [];
let currentHospitalId = null;

// ===============================
// INIT (AFTER LAYOUT LOADS)
// ===============================
window.addEventListener("layoutLoaded", async () => {
  checkAuth();
  loadUserData();
  await loadUsers();
  setupEventListeners();
});

// ===============================
// AUTH CHECK
// ===============================
function checkAuth() {
  const loggedIn = localStorage.getItem("icds_logged_in");
  if (loggedIn !== "true") {
    window.location.href = "login.html";
  }
}

// ===============================
// LOAD USER DATA (HEADER)
// ===============================
function loadUserData() {
  currentHospitalId = localStorage.getItem("icds_hospital_id");

  const name = localStorage.getItem("icds_user_name") || "--";
  const email = localStorage.getItem("icds_user_email") || "--";
  const hospital = localStorage.getItem("icds_hospital") || "--";

  // Safe DOM updates
  const nameEl = document.getElementById("doctorName");
  const emailEl = document.getElementById("doctorEmail");
  const hospitalEl = document.getElementById("hospitalName");
  const avatarEl = document.getElementById("userAvatar");

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (hospitalEl) hospitalEl.textContent = hospital;

  if (avatarEl) {
    const initials = name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    avatarEl.textContent = initials;
  }
}

// ===============================
// LOAD USERS FROM FLASK API
// ===============================
async function loadUsers() {
  if (!currentHospitalId) {
    console.error("No hospital ID found");
    return;
  }

  try {
    const res = await api.get(
      API_PATHS.HOSPITAL.GET_STAFF(currentHospitalId)
    );

    users = res.data.data || [];

    renderUsers();
    updateStats();

  } catch (error) {
    console.error("Error loading users:", error);

    document.getElementById("usersList").innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load users</p>
      </div>
    `;
  }
}

// ===============================
// RENDER USERS (CARD STYLE)
// ===============================
function renderUsers() {
  const container = document.getElementById("usersList");

  if (!users.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-plus"></i>
        <p>No staff found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="user-item">
      <div class="user-info">
        <h4><i class="fas fa-user-md"></i> ${user.name}</h4>
        <p>${user.email} | ${user.position}</p>
      </div>

      <div class="user-actions">
        <button onclick="deleteUser(${user.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join("");
}

// ===============================
// UPDATE STATS
// ===============================
function updateStats() {
  document.getElementById("totalUsers").textContent = users.length;

  document.getElementById("totalDoctors").textContent =
    users.filter(u => u.position === "doctor").length;

  document.getElementById("totalNurses").textContent =
    users.filter(u => u.position === "nurse").length;
}

// ===============================
// ADD USER
// ===============================
async function addUser() {
  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const phone = document.getElementById("userPhone").value.trim();
  const role = document.getElementById("userRole").value;

  if (!name || !email || !role) {
    alert("Please fill all required fields");
    return;
  }

  try {
    await api.post(
      API_PATHS.HOSPITAL.ADD_STAFF(currentHospitalId),
      {
        name,
        email,
        phone,
        position: role
      }
    );

    alert("User added successfully");

    closeModal();
    await loadUsers();

  } catch (error) {
    console.error(error);
    alert("Error adding user");
  }
}

// ===============================
// DELETE USER
// ===============================
window.deleteUser = async function (id) {
  if (!confirm("Delete this user?")) return;

  try {
    await api.delete(
      API_PATHS.HOSPITAL.REMOVE_STAFF(currentHospitalId, id)
    );

    alert("User deleted");
    await loadUsers();

  } catch (error) {
    console.error(error);
    alert("Error deleting user");
  }
};

// ===============================
// MODAL CONTROLS
// ===============================
function openModal() {
  document.getElementById("addUserModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("addUserModal").style.display = "none";
}

// ===============================
// EVENTS
// ===============================
function setupEventListeners() {
  document.getElementById("addUserBtn").addEventListener("click", openModal);

  document.getElementById("cancelUserBtn").addEventListener("click", closeModal);

  document.getElementById("saveUserBtn").addEventListener("click", addUser);

  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", closeModal);
  });
}