const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const OLLAMA_CHAT    = "http://127.0.0.1:11434/api/chat";
const DEFAULT_MODEL = process.env.AGENT_OFFICE_MODEL || "hermes3";
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TERMINAL_OUTPUT = 24 * 1024;
const TERMINAL_TIMEOUT_MS = 30_000;

const CORS = { "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const defaultAllowedRoot = process.cwd();
const ALLOW_ALL = (process.env.AGENT_OFFICE_ALLOW_ALL_ROOTS || "1") === "1";
const ALLOWED_ROOTS = ALLOW_ALL
  ? [process.platform === "win32" ? "C:\\" : "/"]
  : (process.env.AGENT_OFFICE_ALLOWED_ROOTS || defaultAllowedRoot)
  .split(path.delimiter)
  .map((root) => path.resolve(root.trim() || defaultAllowedRoot));
const HAN_CHARACTER_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/;
const BLOCKED_COMMAND_RE = /\b(format|shutdown|restart-computer)\b|rm\s+-rf|remove-item\s+[^|;&]*-recurse|del\s+\/[fsq]/i;

function ollamaPost(endpoint, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

const AGENT_INSTRUCTIONS = {
  pm: "당신은 제품 관리자입니다. 목표, 범위, 우선순위, 담당자, 위험, 다음 행동을 중심으로 답하세요.",
  designer: "당신은 화면 사용자 경험 디자이너입니다. 앱 화면, 정보 구조, 시각 계층, 사용 흐름, 접근성을 중심으로 답하세요. 모니터나 하드웨어 화질 이야기는 하지 마세요.",
  senior: "당신은 시니어 개발자입니다. 구조, 데이터 흐름, 구현 순서, 검증 방법을 중심으로 답하세요.",
  qa: "당신은 품질 담당자입니다. 테스트 기준, 실패 흐름, 회귀 위험, 확인 방법을 중심으로 답하세요.",
  scribe: "당신은 기록 담당자입니다. 결정사항, 근거, 할 일, 담당자를 중심으로 정리하세요.",
};

function agentInstruction(agentId) {
  return AGENT_INSTRUCTIONS[agentId] || "역할에 맞는 실무 관점으로 답하세요.";
}

function fallbackReply(agentId, label, text) {
  const prompt = String(text || "").replace(/@\S+\s*/g, "").trim() || "현재 요청";
  const replies = {
    pm: `먼저 "${prompt}"의 목표와 범위를 정리하겠습니다. 그다음 담당자별 작업, 확인 기준, 예상 위험을 나눠서 진행하면 됩니다. 지금은 핵심 흐름을 작게 완성하고 바로 검증하는 순서가 맞습니다.`,
    designer: `"${prompt}"는 화면의 정보 우선순위부터 정리하는 것이 좋습니다. 사용자가 먼저 봐야 할 상태, 다음 행동, 피드백을 분명히 나누겠습니다. 장식보다 읽기 쉬운 구조와 일관된 간격을 우선하겠습니다.`,
    senior: `"${prompt}"는 데이터 흐름과 상태 변경 지점을 먼저 고정하겠습니다. 작은 단위로 구현하고 빌드와 실제 동작 확인을 같이 묶겠습니다.`,
    qa: `"${prompt}"는 정상 흐름, 실패 흐름, 회귀 가능성이 있는 흐름으로 나눠 검증하겠습니다. 눈에 보이는 결과와 서버 응답을 함께 확인하겠습니다.`,
    scribe: `"${prompt}"에 대한 결정사항과 후속 작업을 정리하겠습니다. 누가 무엇을 맡는지와 다음 확인 시점을 남기겠습니다.`,
  };
  return replies[agentId] || `${label || "에이전트"}가 요청을 확인했습니다. 필요한 작업을 한국어로 정리해서 바로 진행하겠습니다.`;
}

function extractOllamaReply(data) {
  if (data?.error) throw new Error(data.error);
  const reply = (data?.message?.content || data?.response || "").trim();
  if (!reply) throw new Error("empty ollama response");
  return reply;
}

async function chatKoreanOnly(body, fallback) {
  let reply;
  try {
    reply = extractOllamaReply(await ollamaPost(OLLAMA_CHAT, body));
  } catch {
    return fallback;
  }
  if (!HAN_CHARACTER_RE.test(reply)) return reply;

  try {
    return extractOllamaReply(await ollamaPost(OLLAMA_CHAT, {
      ...body,
      messages: [
        ...body.messages,
        {
          role: "user",
          content: "방금 답변에 중국어 또는 한자가 섞였습니다. 의미는 유지하되 한글 한국어 문장으로만 다시 작성하세요. 한자와 중국어 표현은 절대 쓰지 마세요.",
        },
      ],
      options: { temperature: 0.2 },
    }));
  } catch {
    return fallback;
  }
}

function setCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin && LOCAL_ORIGIN_RE.test(origin) ? origin : "http://127.0.0.1:5173");
  res.setHeader("Vary", "Origin");
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function isInsideRoot(candidate, root) {
  const normalizedCandidate = path.resolve(candidate).toLowerCase();
  const normalizedRoot = path.resolve(root).toLowerCase();
  const rootWithSeparator = normalizedRoot.endsWith(path.sep) ? normalizedRoot : normalizedRoot + path.sep;
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(rootWithSeparator);
}

function resolveAllowedPath(inputPath = "") {
  const target = path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(ALLOWED_ROOTS[0], inputPath || ".");
  if (!ALLOWED_ROOTS.some((root) => isInsideRoot(target, root))) {
    const error = new Error("path is outside allowed roots");
    error.statusCode = 403;
    throw error;
  }
  return target;
}

async function handleFiles(req, res, url) {
  try {
    if (url.pathname === "/api/files/roots" && req.method === "GET") {
      sendJson(res, 200, { roots: ALLOWED_ROOTS });
      return true;
    }

    if (url.pathname === "/api/files/list" && req.method === "GET") {
      const target = resolveAllowedPath(url.searchParams.get("path") || ".");
      const stat = await fs.stat(target);
      if (!stat.isDirectory()) {
        sendJson(res, 400, { error: "path is not a directory" });
        return true;
      }

      const entries = await fs.readdir(target, { withFileTypes: true });
      const items = await Promise.all(entries.map(async (entry) => {
        const itemPath = path.join(target, entry.name);
        const itemStat = await fs.stat(itemPath);
        return {
          name: entry.name,
          path: itemPath,
          type: entry.isDirectory() ? "directory" : "file",
          size: itemStat.size,
          modifiedAt: itemStat.mtime.toISOString(),
        };
      }));

      sendJson(res, 200, {
        path: target,
        items: items.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1),
      });
      return true;
    }

    if (url.pathname === "/api/files/read" && req.method === "GET") {
      const target = resolveAllowedPath(url.searchParams.get("path") || "");
      const stat = await fs.stat(target);
      if (!stat.isFile()) {
        sendJson(res, 400, { error: "path is not a file" });
        return true;
      }
      if (stat.size > MAX_FILE_BYTES) {
        sendJson(res, 413, { error: "file is too large", maxBytes: MAX_FILE_BYTES, size: stat.size });
        return true;
      }

      sendJson(res, 200, {
        path: target,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        content: await fs.readFile(target, "utf8"),
      });
      return true;
    }
  } catch (e) {
    sendJson(res, e.statusCode || 500, { error: String(e?.message ?? e) });
    return true;
  }

  return false;
}

async function handleTerminal(req, res, url) {
  if (url.pathname !== "/api/terminal/run" || req.method !== "POST") return false;
  try {
    const { command, cwd = "." } = await readBody(req);
    if (typeof command !== "string" || command.trim().length === 0) {
      sendJson(res, 400, { error: "command is required" });
      return true;
    }
    if (BLOCKED_COMMAND_RE.test(command)) {
      sendJson(res, 403, { error: "blocked terminal command" });
      return true;
    }

    const workingDirectory = resolveAllowedPath(String(cwd));
    const shell = process.platform === "win32" ? "powershell.exe" : "sh";
    const args = process.platform === "win32"
      ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command]
      : ["-lc", command];

    const child = spawn(shell, args, { cwd: workingDirectory, windowsHide: true });
    let stdout = "";
    let stderr = "";
    const trim = (value) => value.length > MAX_TERMINAL_OUTPUT ? value.slice(-MAX_TERMINAL_OUTPUT) : value;
    const timer = setTimeout(() => child.kill(), TERMINAL_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => { stdout = trim(stdout + chunk); });
    child.stderr.on("data", (chunk) => { stderr = trim(stderr + chunk); });
    child.on("close", (code) => {
      clearTimeout(timer);
      sendJson(res, 200, { code, cwd: workingDirectory, stdout, stderr });
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      sendJson(res, 500, { error: String(e?.message ?? e) });
    });
  } catch (e) {
    sendJson(res, e.statusCode || 500, { error: String(e?.message ?? e) });
  }
  return true;
}

http.createServer(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url || "/", "http://127.0.0.1:7002");
  if (url.pathname.startsWith("/api/files/") && await handleFiles(req, res, url)) return;
  if (url.pathname.startsWith("/api/terminal/") && await handleTerminal(req, res, url)) return;
  if (req.method !== "POST" || url.pathname !== "/api/chat") {
    sendJson(res, 404, { error: "not found" }); return;
  }

  try {
    const { agentId, label, text, history = [] } = await readBody(req);

    const messages = [
      {
        role: "system",
        content: [
          `당신은 ${label}입니다.`,
          agentInstruction(agentId),
          "오직 한글 한국어 문장만 사용하세요. 중국어, 한자, 일본어, 영어 문장을 절대 섞지 마세요.",
          "이전 대화에 다른 언어가 있어도 따라 하지 말고 한국어로 번역해서 답하세요.",
          "3~4문장으로 간결하게 답하세요. 역할에 맞는 관점으로 의견을 명확히 밝히세요.",
        ].join(" "),
      },
      ...history,
      { role: "user", content: text },
      { role: "user", content: "최종 답변은 반드시 한글 한국어로만 작성하세요. 중국어와 한자는 금지입니다." },
    ];

    const reply = await chatKoreanOnly({
      model: DEFAULT_MODEL,
      messages,
      stream: false,
      options: { temperature: 0.35 },
    }, fallbackReply(agentId, label, text));

    sendJson(res, 200, { response: reply });
  } catch (e) {
    sendJson(res, 500, { error: String(e?.message ?? e) });
  }
}).listen(7002, () => console.log("ollama proxy :7002"));
