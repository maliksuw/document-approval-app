const tabSignin = document.getElementById("tabSignin");
const tabSignup = document.getElementById("tabSignup");
const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");
const forgotForm = document.getElementById("forgotForm");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const backToSigninLink = document.getElementById("backToSigninLink");
const feedback = document.getElementById("feedback");

tabSignin.addEventListener("click", () => switchTab("signin"));
tabSignup.addEventListener("click", () => switchTab("signup"));
forgotPasswordLink.addEventListener("click", () => switchTab("forgot"));
backToSigninLink.addEventListener("click", () => switchTab("signin"));

function switchTab(which) {
  tabSignin.classList.toggle("active", which === "signin");
  tabSignup.classList.toggle("active", which === "signup");
  signinForm.classList.toggle("hidden", which !== "signin");
  signupForm.classList.toggle("hidden", which !== "signup");
  forgotForm.classList.toggle("hidden", which !== "forgot");
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

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password.html",
  });

  if (error) {
    showFeedback(error.message, true);
    return;
  }

  showFeedback("ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องข้อความ", false);
  e.target.reset();
});

// if already logged in, skip straight to dashboard
sb.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = "dashboard.html";
});
