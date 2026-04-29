const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const root = __dirname;
const requestedPort = Number(process.argv[2] || process.env.PORT || 4173);
const host = process.argv[3] || process.env.HOST || "127.0.0.1";
const pidFile = path.join(root, "server.pid");
const stdoutPath = path.join(root, "server.stdout.log");
const stderrPath = path.join(root, "server.stderr.log");

function makeUrl(port) {
  return `http://${host}:${port}/`;
}

function checkUrl(port) {
  return new Promise((resolve) => {
    const req = http.get(makeUrl(port), (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve(res.statusCode === 200 && body.includes("从大模型到智能体"));
      });
    });

    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function findRunningPortal() {
  for (let port = requestedPort; port < requestedPort + 20; port += 1) {
    if (await checkUrl(port)) return port;
  }
  return null;
}

async function findFreePort() {
  for (let port = requestedPort; port < requestedPort + 20; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free local port found from ${requestedPort} to ${requestedPort + 19}.`);
}

function waitForReady(port, attempts = 18) {
  return new Promise((resolve) => {
    let count = 0;
    const timer = setInterval(async () => {
      count += 1;
      if (await checkUrl(port)) {
        clearInterval(timer);
        resolve(true);
      } else if (count >= attempts) {
        clearInterval(timer);
        resolve(false);
      }
    }, 250);
  });
}

(async () => {
  const runningPort = await findRunningPortal();
  if (runningPort) {
    console.log(`Openclaw course portal is already running at ${makeUrl(runningPort)}`);
    return;
  }

  const port = await findFreePort();
  const stdout = fs.openSync(stdoutPath, "w");
  const stderr = fs.openSync(stderrPath, "w");
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    detached: true,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host
    },
    stdio: ["ignore", stdout, stderr],
    windowsHide: true
  });

  child.unref();
  fs.writeFileSync(pidFile, String(child.pid), "ascii");

  const ready = await waitForReady(port);
  if (!ready) {
    console.error(`Local deployment started PID ${child.pid}, but ${makeUrl(port)} did not become ready in time.`);
    process.exit(1);
  }

  console.log("Openclaw course portal deployed locally.");
  console.log(`URL: ${makeUrl(port)}`);
  console.log(`PID: ${child.pid}`);
})();
