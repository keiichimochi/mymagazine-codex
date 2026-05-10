const { spawn } = require("node:child_process");
const readline = require("node:readline");

class CodexAppServerClient {
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
    this.model = options.model || process.env.CODEX_MODEL || "gpt-5.4";
    this.timeoutMs = options.timeoutMs || 240000;
    this.nextId = 1;
    this.pending = new Map();
    this.agentText = "";
    this.threadId = null;
    this.turnId = null;
  }

  async run(prompt, outputSchema = null) {
    this.child = spawn("codex", ["app-server"], {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.child.stderr.setEncoding("utf8");
    this.child.stderr.on("data", (chunk) => {
      this.lastStderr = `${this.lastStderr || ""}${chunk}`;
    });

    const rl = readline.createInterface({ input: this.child.stdout });
    rl.on("line", (line) => this.handleLine(line));

    try {
      await this.request("initialize", {
        clientInfo: {
          name: "mymagazine",
          title: "MyMagazine Worldline Engine",
          version: "0.2.0"
        },
        capabilities: {
          experimentalApi: false
        }
      });
      this.notify("initialized");

      const threadStart = await this.request("thread/start", {
        cwd: this.cwd,
        model: this.model,
        approvalPolicy: "never",
        sandbox: "read-only",
        baseInstructions: "英語でthinkして、日本語でoutputしてください。最終回答は要求されたJSONのみを返してください。",
        ephemeral: true,
        experimentalRawEvents: false,
        persistExtendedHistory: false
      });
      this.threadId = threadStart.thread.id;

      await this.request("turn/start", {
        threadId: this.threadId,
        input: [{ type: "text", text: prompt, text_elements: [] }],
        cwd: this.cwd,
        approvalPolicy: "never",
        sandboxPolicy: { type: "readOnly", access: { type: "fullAccess" }, networkAccess: false },
        model: this.model,
        outputSchema
      });

      await this.waitForTurnCompleted();
      return this.agentText.trim();
    } finally {
      rl.close();
      if (this.child && !this.child.killed) {
        this.child.kill();
      }
    }
  }

  request(method, params) {
    const id = this.nextId++;
    const payload = { method, id, params };
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Codex App Server request timed out: ${method}`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
    });
    this.write(payload);
    return promise;
  }

  notify(method, params) {
    this.write(params === undefined ? { method } : { method, params });
  }

  write(payload) {
    this.child.stdin.write(`${JSON.stringify(payload)}\n`);
  }

  handleLine(line) {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id") && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) {
        pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (message.method === "turn/started") {
      this.turnId = message.params?.turn?.id || this.turnId;
      return;
    }

    if (message.method === "item/agentMessage/delta") {
      this.agentText += message.params?.delta || "";
      return;
    }

    if (message.method === "item/completed" && message.params?.item?.type === "agentMessage") {
      this.agentText = message.params.item.text || this.agentText;
      return;
    }

    if (message.method === "turn/completed") {
      this.completed = true;
      if (this.completeTurn) this.completeTurn();
      return;
    }

    if (message.method === "error" && this.failTurn) {
      this.failTurn(new Error(message.params?.message || JSON.stringify(message.params) || "Codex App Server error"));
    }
  }

  waitForTurnCompleted() {
    if (this.completed) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Codex App Server turn timed out${this.lastStderr ? `: ${this.lastStderr}` : ""}`));
      }, this.timeoutMs);
      this.completeTurn = () => {
        clearTimeout(timer);
        resolve();
      };
      this.failTurn = (error) => {
        clearTimeout(timer);
        reject(error);
      };
    });
  }
}

module.exports = { CodexAppServerClient };
