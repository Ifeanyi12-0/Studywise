import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

app.use(express.json({ limit: "5mb" }));
app.use(express.static("."));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "." });
});

const baseInstructions = `
You are StudyWise AI, an academic study assistant for university students.
Use the student's supplied material as the primary source. Do not invent facts that are not supported by the material.
Make explanations clear, accurate and exam-focused. When the material is incomplete or ambiguous, say so.
Do not help students cheat during a live/proctored exam; instead provide study guidance and practice.
`;

async function ask(prompt) {
  const response = await client.responses.create({
    model: MODEL,
    instructions: baseInstructions,
    input: prompt
  });
  return response.output_text;
}

app.post("/api/summarise", async (req, res) => {
  try {
    const { material, level = "balanced" } = req.body;
    if (!material?.trim()) return res.status(400).json({ error: "Please provide course material." });

    const result = await ask(`
Create an exam-preparation summary from the material below.
Summary style: ${level}.
Return:
1. A concise overview
2. Key concepts and definitions
3. Important mechanisms/processes
4. Formulas or facts to memorise (if present)
5. Common exam traps/misconceptions
6. 5 likely exam questions
7. A final "last-minute revision" section

COURSE MATERIAL:
${material}
`);
    res.json({ result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI request failed. Check your API key and server logs." });
  }
});

app.post("/api/quiz", async (req, res) => {
  try {
    const { material, count = 10, difficulty = "mixed" } = req.body;
    if (!material?.trim()) return res.status(400).json({ error: "Please provide course material." });

    const result = await ask(`
Generate ${Math.min(Number(count) || 10, 20)} single-answer multiple-choice questions from the supplied material.
Difficulty: ${difficulty}.
Return valid JSON only in this shape:
{
  "questions": [
    {
      "question": "...",
      "options": ["A. ...","B. ...","C. ...","D. ..."],
      "answer": "A",
      "explanation": "..."
    }
  ]
}
Every question must have exactly one defensible answer. Ground questions in the supplied material.

COURSE MATERIAL:
${material}
`);
    res.json({ result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI request failed. Check your API key and server logs." });
  }
});

app.post("/api/study-plan", async (req, res) => {
  try {
    const { material, examDate, hoursPerDay = 2 } = req.body;
    if (!material?.trim()) return res.status(400).json({ error: "Please provide course material." });

    const result = await ask(`
Build a practical university exam-preparation plan from the material below.
Exam date: ${examDate || "not specified"}.
Available study time: ${hoursPerDay} hours/day.
Prioritise high-value concepts, active recall, spaced repetition, practice questions and weak-area review.
Return a day-by-day plan when a date is supplied; otherwise return a 7-day template.
Finish with a checklist of what the student should be able to explain before the exam.

COURSE MATERIAL:
${material}
`);
    res.json({ result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI request failed. Check your API key and server logs." });
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const type = req.file.mimetype;
    if (type !== "application/pdf") {
      return res.status(400).json({ error: "MVP upload supports PDF files. You can also paste text directly." });
    }
    const parsed = await pdfParse(req.file.buffer);
    res.json({ text: parsed.text, pages: parsed.numpages, name: req.file.originalname });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not read that PDF." });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`StudyWise AI running on http://localhost:${process.env.PORT || 3000}`);
});
