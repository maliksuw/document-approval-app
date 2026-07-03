const tabSignin = document.getElementById("tabSignin");
const tabSignup = document.getElementById("tabSignup");
const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");
const feedback = document.getElementById("feedback");

tabSignin.addEventListener("click", () => switchTab("signin"));
tabSignup.addEventListener("click", () => switchTab("signup"));

function switchTab(which) {
  const isSignin = which === "signin";
  tabSignin.classList.toggle("active", isSignin);
  tabSignup.classList.toggle("active", !isSignin);
  signinForm.classList.toggle("hidden", !isSignin);
  signupForm.classList.toggle("hidden", isSignin);
  feedback.textContent = "";
  feedback.className = "";
}

function showFeedback(text, isError) {
  feedback.textContent = text;
  feedback.className = isError ? "error" : "msg";
}

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signinEmail").value.trim();
  const password = document.getElementById("signinPassword").value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showFeedback(error.message, true);
    return;
  }
  window.location.href = "dashboard.html";
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const full_name = document.getElementById("signupName").value.trim();
  const role = document.getElementById("signupRole").value;
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name, role } },
  });

  if (error) {
    showFeedback(error.message, true);
    return;
  }

  if (data.session) {
    window.location.href = "dashboard.html";
  } else {
    switchTab("signin");
    showFeedback("สมัครสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (ถ้าเปิดใช้ email confirmation)", false);
  }
});

// if already logged in, skip straight to dashboard
sb.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = "dashboard.html";
});
