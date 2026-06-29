import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/hermes", async (req, res) => {
  try {
    const { agentId, label, text } = req.body || {};
    if (!text) return res.status(400).json({ error: "text is required" });

    const role = agentId || "assistant";
    const persona = label ? `당신은 ${label}입니다.\n` : "";

    const prompt = [
      persona,
      "한국어로 3문장 이내로만 답하세요.",
      "질문/지시에 역할에 맞게 직접 답변하세요.",
      `사용자 입력: ${text}`,
    ]
      .filter(Boolean)
      .join("\n");

    const child = spawn("C:\\Users\\invako\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\hermes.exe", [
      "--oneshot",
      prompt,
    ]);

    const chunks = [];
    child.stdout.on("data", (d) => chunks.push(d));
    child.stderr.on("data", () => {});

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        try { child.kill(); } catch {}
        reject(new Error("hermes timeout"));
      }, 30000);

      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error("hermes exit " + code));
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const response = Buffer.concat(chunks).toString("utf8").trim() || "(응답 없음)";
    res.json({ response });
  } catch (err) {
    console.error("hermes api error:", err);
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
});

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => console.log(`AI server listening on ${PORT}`));
