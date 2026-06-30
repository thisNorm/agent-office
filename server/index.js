import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";

const app = express();
app.use(cors());
app.use(express.json());

const HERMES_BIN = "C:\\Users\\invako\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\hermes.exe";

async function callOllama(prompt) {
  const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gemma3:4b", prompt, stream: false }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.response || "").trim() || null;
}

async function callHermes(prompt) {
  return await new Promise((resolve) => {
    const child = spawn(HERMES_BIN, ["-z", prompt]);
    let output = "";
    child.stdout.on("data", (c) => output += c);
    child.stderr.on("data", () => {});
    const timer = setTimeout(() => {
      child.kill();
      resolve(null);
    }, 120_000);
    child.on("close", () => {
      clearTimeout(timer);
      resolve(output.trim() || null);
    });
  });
}

app.post("/api/hermes", async (req, res) => {
  try {
    const { agentId, label, text } = req.body || {};
    if (!text) return res.status(400).json({ error: "text is required" });

    const prompt = [
      label ? `당신은 ${label}입니다.` : "",
      "한국어로 3문장 이내로만 답하세요.",
      "질문/지시에 역할에 맞게 직접 답변하세요.",
      `사용자 입력: ${text}`,
    ].filter(Boolean).join("\n");

    const response = await callOllama(prompt) || await callHermes(prompt) || "(응답 없음)";
    res.json({ response });
  } catch (err) {
    console.error("hermes api error:", err);
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
});

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => console.log(`AI server listening on ${PORT}`));
