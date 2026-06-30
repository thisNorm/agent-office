const http = require("http");
const url = "http://127.0.0.1:11434/api/generate";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function request(body) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== "POST" || req.url !== "/api/chat") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.writeHead(404);
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", async () => {
    try {
      const { agentId, label, text } = JSON.parse(body);
      const prompt = [
        label ? `당신은 ${label}입니다.` : "",
        "한국어로 3문장 이내로만 답하세요.",
        "질문/지시에 역할에 맞게 직접 답변하세요.",
        `사용자 입력: ${text}`
      ].filter(Boolean).join("\n");

      const data = await request({ model: pickModel(agentId || ""), prompt, stream: false, options: { temperature: 0.7 } });
      const reply = (data && data.response ? data.response : "").trim() || "(응답 없음)";

      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ response: reply }));
    } catch (e) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e && e.message ? e.message : e) }));
    }
  });
}).listen(7002, () => console.log("ollama chat proxy listening on 7002"));
