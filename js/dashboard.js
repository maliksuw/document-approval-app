let profile = null;

const STATUS_LABEL = {
  pending_supervisor: "รอ Supervisor อนุมัติ",
  pending_manager: "รอ Manager อนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ถูกปฏิเสธ",
};

init();

async function init() {
  const session = await requireSession();
  if (!session) return;

  profile = await loadProfile(session.user.id);
  document.getElementById("userName").textContent = profile.full_name;
  document.getElementById("userRole").textContent = profile.role;

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    window.location.href = "login.html";
  });

  if (profile.role === "sales") {
    document.getElementById("createSection").classList.remove("hidden");
    document.getElementById("createForm").addEventListener("submit", onCreateDocument);
  }

  if (profile.role === "supervisor" || profile.role === "manager") {
    document.getElementById("pendingSection").classList.remove("hidden");
    document.getElementById("pendingTitle").textContent =
      profile.role === "supervisor" ? "รายการรอฉันอนุมัติ (Supervisor)" : "รายการรอฉันอนุมัติ (Manager)";
  }

  await loadPending();
  await loadAll();
}

async function onCreateDocument(e) {
  e.preventDefault();
  const title = document.getElementById("docTitle").value.trim();
  const description = document.getElementById("docDescription").value.trim();
  const fileInput = document.getElementById("docFile");
  const feedbackEl = document.getElementById("createFeedback");
  feedbackEl.textContent = "";
  feedbackEl.className = "";

  let file_url = null;
  const file = fileInput.files[0];
  if (file) {
    const path = `${profile.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await sb.storage.from("documents").upload(path, file);
    if (uploadError) {
      feedbackEl.textContent = "อัปโหลดไฟล์ไม่สำเร็จ: " + uploadError.message;
      feedbackEl.className = "error";
      return;
    }
    file_url = path;
  }

  const { error } = await sb.from("documents").insert({
    title,
    description,
    file_url,
    created_by: profile.id,
    status: "pending_supervisor",
  });

  if (error) {
    feedbackEl.textContent = "ส่งเอกสารไม่สำเร็จ: " + error.message;
    feedbackEl.className = "error";
    return;
  }

  feedbackEl.textContent = "ส่งเอกสารสำเร็จ รอ Supervisor อนุมัติ";
  feedbackEl.className = "msg";
  e.target.reset();
  await loadAll();
}

async function loadPending() {
  if (profile.role !== "supervisor" && profile.role !== "manager") return;

  const targetStatus = profile.role === "supervisor" ? "pending_supervisor" : "pending_manager";

  const { data, error } = await sb
    .from("documents")
    .select("id, title, description, status, created_at, profiles!documents_created_by_fkey(full_name)")
    .eq("status", targetStatus)
    .order("created_at", { ascending: true });

  const tbody = document.querySelector("#pendingTable tbody");
  tbody.innerHTML = "";

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("pendingEmpty").classList.toggle("hidden", data.length > 0);

  for (const doc of data) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(doc.title)}</td>
      <td>${escapeHtml(doc.description || "-")}</td>
      <td>${escapeHtml(doc.profiles?.full_name || "-")}</td>
      <td>${formatDate(doc.created_at)}</td>
      <td class="actions-cell">
        <button class="btn-approve" data-id="${doc.id}" data-action="approved">อนุมัติ</button>
        <button class="btn-reject" data-id="${doc.id}" data-action="rejected">ปฏิเสธ</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => onDecision(btn.dataset.id, btn.dataset.action));
  });
}

async function onDecision(documentId, action) {
  let comment = null;
  if (action === "rejected") {
    comment = window.prompt("เหตุผลที่ปฏิเสธ (ไม่บังคับ):") || null;
  }

  const nextStatus =
    action === "rejected" ? "rejected" : profile.role === "supervisor" ? "pending_manager" : "approved";

  const { error: updateError } = await sb
    .from("documents")
    .update({ status: nextStatus })
    .eq("id", documentId);

  if (updateError) {
    alert("ดำเนินการไม่สำเร็จ: " + updateError.message);
    return;
  }

  await sb.from("approval_logs").insert({
    document_id: documentId,
    approver_id: profile.id,
    role: profile.role,
    action,
    comment,
  });

  await loadPending();
  await loadAll();
}

async function loadAll() {
  const { data, error } = await sb
    .from("documents")
    .select("id, title, status, updated_at, profiles!documents_created_by_fkey(full_name)")
    .order("updated_at", { ascending: false });

  const tbody = document.querySelector("#allTable tbody");
  tbody.innerHTML = "";

  if (error) {
    console.error(error);
    return;
  }

  for (const doc of data) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(doc.title)}</td>
      <td>${escapeHtml(doc.profiles?.full_name || "-")}</td>
      <td><span class="badge badge-${doc.status}">${STATUS_LABEL[doc.status]}</span></td>
      <td>${formatDate(doc.updated_at)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("th-TH");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
