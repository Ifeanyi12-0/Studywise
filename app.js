const SUPABASE_URL = "https://lenqzthtsizizhtdlxif.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_m-xOGuu-z4y01pTuY0nEWQ_cp60tRJI";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = s => document.querySelector(s);

let tool = "summary";

document.querySelectorAll(".tool").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool").forEach(x => x.classList.remove("active"));

    btn.classList.add("active");
    tool = btn.dataset.tool;

    $(".quiz-options").classList.toggle("hidden", tool !== "quiz");
    $(".plan-options").classList.toggle("hidden", tool !== "plan");
    $(".summary-options").classList.toggle("hidden", tool !== "summary");
  });
});

$("#material").addEventListener("input", () => {
  $("#chars").textContent = $("#material").value.length;
});

$("#file").addEventListener("change", async e => {
  const file = e.target.files[0];

  if (!file) return;

  $("#fileStatus").textContent = `Reading ${file.name}…`;

  const fd = new FormData();
  fd.append("file", file);

  try {
    const r = await fetch("/api/upload", {
      method: "POST",
      body: fd
    });

    const data = await r.json();

    if (!r.ok) {
      throw new Error(data.error || "Unable to read this PDF.");
    }

    $("#material").value = data.text;
    $("#chars").textContent = data.text.length;

    $("#fileStatus").textContent =
      `${data.name} loaded · ${data.pages} page${data.pages === 1 ? "" : "s"}.`;

  } catch (err) {
    $("#fileStatus").textContent = err.message;
  }
});

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function renderText(text) {
  const safe = escapeHtml(text);

  return safe
    .split(/\n\n+/)
    .map(p => {

      if (/^#{1,3}\s/.test(p)) {
        return `<h3>${p.replace(/^#{1,3}\s/, "")}</h3>`;
      }

      if (/^\d+\.\s/.test(p)) {
        return `<p>${p.replace(/\n/g, "<br>")}</p>`;
      }

      if (p.split("\n").every(x => /^[-*]\s/.test(x))) {
        return `
          <ul>
            ${p.split("\n")
              .map(x => `<li>${x.replace(/^[-*]\s/, "")}</li>`)
              .join("")}
          </ul>
        `;
      }

      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

function renderQuiz(raw) {
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    return renderText(raw);
  }

  if (!data.questions || !Array.isArray(data.questions)) {
    return renderText(raw);
  }

  return data.questions
    .map((q, i) => `
      <div class="quiz-card">
        <h3>${i + 1}. ${escapeHtml(q.question)}</h3>

        ${q.options
          .map(o => `<div class="option">${escapeHtml(o)}</div>`)
          .join("")}

        <div class="answer">
          Answer: ${escapeHtml(q.answer)}
          — ${escapeHtml(q.explanation)}
        </div>
      </div>
    `)
    .join("");
}

function setLoading(message) {
  $("#output").classList.remove("hidden");

  $("#result").className = "";

  $("#result").innerHTML = `
    <div class="loading">
      <span class="dot"></span>
      <span>${message}</span>
    </div>
  `;

  window.scrollTo({
    top: $("#output").offsetTop - 20,
    behavior: "smooth"
  });
}

$("#generate").addEventListener("click", async () => {

  const material = $("#material").value.trim();

  if (!material) {
    $("#error").textContent =
      "Add some course material first.";

    $("#error").classList.remove("hidden");

    return;
  }

  $("#error").classList.add("hidden");

  setLoading(
    tool === "summary"
      ? "StudyWise is creating your summary…"
      : tool === "quiz"
        ? "StudyWise is preparing your quiz…"
        : "StudyWise is building your revision plan…"
  );

  const endpoint =
    tool === "summary"
      ? "/api/summarise"
      : tool === "quiz"
        ? "/api/quiz"
        : "/api/study-plan";

  const body =
    tool === "summary"
      ? {
          material,
          level: $("#summaryLevel").value
        }
      : tool === "quiz"
        ? {
            material,
            count: $("#count").value,
            difficulty: $("#difficulty").value
          }
        : {
            material,
            examDate: $("#examDate").value,
            hoursPerDay: $("#hours").value
          };

  try {

    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();

    if (!r.ok) {
      throw new Error(
        data.error || "The AI request could not be completed."
      );
    }

    $("#outputTitle").textContent =
      tool === "summary"
        ? "Smart Summary"
        : tool === "quiz"
          ? "Practice Quiz"
          : "Exam Preparation Plan";

    $("#result").className = "output-body";

    $("#result").innerHTML =
      tool === "quiz"
        ? renderQuiz(data.result)
        : renderText(data.result);

    window.scrollTo({
      top: $("#output").offsetTop - 20,
      behavior: "smooth"
    });

  } catch (err) {

    $("#result").innerHTML = "";

    $("#error").textContent =
      err.message || "Something went wrong.";

    $("#error").classList.remove("hidden");

    window.scrollTo({
      top: $(".tools-panel").offsetTop - 20,
      behavior: "smooth"
    });
  }
});

$("#copy").addEventListener("click", async () => {

  try {
    await navigator.clipboard.writeText(
      $("#result").innerText
    );

    $("#copy").innerHTML = "✓ Copied";

    setTimeout(() => {
      $("#copy").innerHTML = "⧉ Copy";
    }, 1200);

  } catch {
    $("#copy").textContent = "Copy failed";

    setTimeout(() => {
      $("#copy").innerHTML = "⧉ Copy";
    }, 1200);
  }
});
