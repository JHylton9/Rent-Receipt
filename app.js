(function initReceiptApp() {
  const form = document.getElementById("receiptForm");
  const receiptCard = document.getElementById("receiptCard");
  const statusEl = document.getElementById("status");

  const btnGenerate = document.getElementById("generateBtn");
  const btnPrint = document.getElementById("printBtn");
  const btnDownload = document.getElementById("downloadBtn");

  function setDefaultDates() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const first = new Date(yyyy, today.getMonth(), 1);
    const last = new Date(yyyy, today.getMonth() + 1, 0);

    const firstStr = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(first.getDate()).padStart(2, "0")}`;
    const lastStr = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;

    document.getElementById("paymentDate").value = todayStr;
    document.getElementById("rentFrom").value = firstStr;
    document.getElementById("rentTo").value = lastStr;
  }

  function setStatus(message) {
    statusEl.textContent = message || "";
    statusEl.classList.toggle("show", Boolean(message));
  }

  function markValidity(el, ok) {
    el.setAttribute("aria-invalid", ok ? "false" : "true");
  }

  function validateForm() {
    setStatus("");

    Array.from(form.querySelectorAll("input, select, textarea")).forEach((el) =>
      markValidity(el, true)
    );

    const required = [
      document.getElementById("tenantName"),
      document.getElementById("landlordName"),
      document.getElementById("propertyAddress"),
      document.getElementById("amount"),
      document.getElementById("paymentDate"),
      document.getElementById("rentFrom"),
      document.getElementById("rentTo"),
      document.getElementById("method"),
      document.getElementById("receiptId"),
    ];

    let ok = true;

    for (const el of required) {
      if (!el.checkValidity()) {
        markValidity(el, false);
        ok = false;
      }
    }

    const rentFrom = document.getElementById("rentFrom");
    const rentTo = document.getElementById("rentTo");
    if (rentFrom.value && rentTo.value && rentFrom.value > rentTo.value) {
      markValidity(rentFrom, false);
      markValidity(rentTo, false);
      ok = false;
      setStatus("Rent period 'from' must be on or before 'to'.");
    }

    const amount = document.getElementById("amount");
    const amt = Number(amount.value);
    if (!Number.isFinite(amt) || amt <= 0) {
      markValidity(amount, false);
      ok = false;
      setStatus("Amount must be a positive number.");
    }

    if (!ok && !statusEl.textContent) {
      setStatus("Please fill all required fields correctly.");
    }

    return ok;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function prettyDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function formatMoneyUSD(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    });
  }

  function readFormData() {
    return {
      tenantName: document.getElementById("tenantName").value.trim(),
      landlordName: document.getElementById("landlordName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      propertyAddress: document.getElementById("propertyAddress").value.trim(),
      unit: document.getElementById("unit").value.trim(),
      amount: document.getElementById("amount").value,
      paymentDate: document.getElementById("paymentDate").value,
      rentFrom: document.getElementById("rentFrom").value,
      rentTo: document.getElementById("rentTo").value,
      method: document.getElementById("method").value,
      receiptId: document.getElementById("receiptId").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      signature: document.getElementById("signature").value.trim(),
    };
  }

  function buildReceiptHtml(data) {
    const lines = [
      ["Tenant:", data.tenantName || "—"],
      ["Landlord:", data.landlordName || "—"],
      ["Address:", data.propertyAddress || "—"],
      ["Unit:", data.unit || "—"],
      ["Amount:", formatMoneyUSD(data.amount)],
      ["Payment Method:", data.method || "—"],
      ["Date:", prettyDate(data.paymentDate)],
      ["Receipt No:", data.receiptId || "—"],
    ];

    return `
      <section class="reveal" aria-label="Generated receipt">
        <div class="receipt-note">
          <h3>Receipt</h3>
          <ul class="receipt-lines">
            ${lines
              .map(
                ([k, v]) =>
                  `<li><b>${escapeHtml(k)}</b><span>${escapeHtml(v)}</span></li>`
              )
              .join("")}
          </ul>
        </div>
      </section>
    `;
  }

  function renderReceipt() {
    const data = readFormData();
    receiptCard.innerHTML = buildReceiptHtml(data);
    receiptCard.classList.remove("hidden");
  }

  function getDownloadDocument() {
    const receiptOnly = receiptCard.innerHTML.replaceAll("receipt-note", "note");
    return [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      "<title>Rent Receipt</title>",
      '<link rel="preconnect" href="https://fonts.googleapis.com" />',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
      '<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet" />',
      "<style>",
      "  *{box-sizing:border-box}",
      '  body{margin:0;padding:16px;font-family:"Courier Prime",monospace;color:#000;background:#fff;line-height:1.35}',
      "  .card{border:2px solid #000}",
      "  .note{margin:10px;border:2px dotted #000;padding:12px}",
      "  h3{margin:0 0 8px 0;text-transform:uppercase;letter-spacing:.7px;font-size:14px}",
      "  ul{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:13px}",
      "  li{display:grid;grid-template-columns:120px 1fr;gap:10px}",
      "</style>",
      "</head>",
      "<body>",
      `  <div class="card">${receiptOnly}</div>`,
      "</body>",
      "</html>",
    ].join("\n");
  }

  btnGenerate.addEventListener("click", () => {
    if (!validateForm()) return;
    renderReceipt();
    setStatus("Receipt generated.");
  });

  btnPrint.addEventListener("click", () => {
    if (!validateForm()) return;
    if (receiptCard.classList.contains("hidden")) {
      renderReceipt();
      setStatus("Receipt generated.");
    }
    window.print();
  });

  btnDownload.addEventListener("click", () => {
    if (!validateForm()) return;
    if (receiptCard.classList.contains("hidden")) {
      renderReceipt();
    }

    const doc = getDownloadDocument();
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `rent-receipt-${(document.getElementById("receiptId").value || "RCPT").trim()}.html`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setStatus("Saved (download started).");
  });

  setDefaultDates();
})();
index.html
index.html
