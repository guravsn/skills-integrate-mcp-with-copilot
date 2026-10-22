document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const teacherLoginToggle = document.getElementById("teacher-login-toggle");
  const teacherLoginForm = document.getElementById("teacher-login-form");
  const teacherLogout = document.getElementById("teacher-logout");
  const teacherLoginPrompt = document.getElementById("teacher-login-prompt");
  let teacherAuthorization = null;

  function updateTeacherControls() {
    const isTeacher = teacherAuthorization !== null;
    signupForm.classList.toggle("hidden", !isTeacher);
    teacherLoginPrompt.classList.toggle("hidden", isTeacher);
    teacherLoginToggle.classList.toggle("hidden", isTeacher);
    teacherLoginForm.classList.add("hidden");
    teacherLogout.classList.toggle("hidden", !isTeacher);
  }

  function showMessage(message, className) {
    messageDiv.textContent = message;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  function makeAuthorizationHeader(username, password) {
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    const encoded = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return `Basic ${btoa(encoded)}`;
  }

  teacherLoginToggle.addEventListener("click", () => {
    teacherLoginForm.classList.toggle("hidden");
  });

  teacherLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("teacher-username").value;
    const password = document.getElementById("teacher-password").value;
    const authorization = makeAuthorizationHeader(username, password);

    try {
      const response = await fetch("/teacher/login", {
        method: "POST",
        headers: { Authorization: authorization },
      });
      const result = await response.json();
      if (!response.ok) {
        showMessage(result.detail || "Unable to log in.", "error");
        return;
      }

      teacherAuthorization = authorization;
      teacherLoginForm.reset();
      updateTeacherControls();
      showMessage(result.message, "success");
      fetchActivities();
    } catch (error) {
      showMessage("Failed to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  teacherLogout.addEventListener("click", () => {
    teacherAuthorization = null;
    updateTeacherControls();
    fetchActivities();
    showMessage("Logged out.", "info");
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.options.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `<li><span class="participant-email">${email}</span>${
                      teacherAuthorization
                        ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">Remove</button>`
                        : ""
                    }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: { Authorization: teacherAuthorization },
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Authorization: teacherAuthorization },
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  updateTeacherControls();
  fetchActivities();
});
