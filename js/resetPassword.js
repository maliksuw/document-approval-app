const resetForm = document.getElementById("resetForm");
const invalidLinkMsg = document.getElementById("invalidLinkMsg");
const feedback = document.getElementById("feedback");

function showFeedback(text, isError) {
  feedback.textContent = text;
  feedback.className = isError ? "error" : "msg";
}

// supabase-js parses the recovery token from the URL and fires this event
// once it has established a temporary recovery session.
sb.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY" && session) {
    resetForm.classList.remove("hidden");
  }
});

// fallback: if a recovery session already exists by the time this script runs
sb.auth.getSession().then(({ data: { session } }) => {
  if (session) resetForm.classList.remove("hidden");
  else invalidLinkMsg.classList.remove("hidden");
});

resetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    showFeedback("รหัสผ่านทั้งสองช่องไม่ตรงกัน", true);
    return;
  }

  const { error } = await sb.auth.updateUser({ password: newPassword });

  if (error) {
    showFeedback(error.message, true);
    return;
  }

  showFeedback("ตั้งรหัสผ่านใหม่สำเร็จ กำลังพาไปหน้าแดชบอร์ด...", false);
  setTimeout(() => (window.location.href = "dashboard.html"), 1500);
});
