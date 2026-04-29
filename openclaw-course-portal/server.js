const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const requestedPort = Number(process.env.PORT || process.argv[2] || 4173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded === "/" ? "/index.html" : decoded);
  const filePath = path.join(root, normalized);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

function createServer(port) {
  const server = http.createServer((req, res) => {
    const filePath = safePath(req.url || "/");
    if (!filePath) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        if (error.code === "ENOENT") {
          send(res, 404, "Not Found");
        } else {
          send(res, 500, "Server Error");
        }
        return;
      }

      const type = mimeTypes[path.extname(filePath)] || "application/octet-stream";
      send(res, 200, data, type);
    });
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < requestedPort + 20) {
      createServer(port + 1);
      return;
    }
    console.error(error);
    process.exit(1);
  });

  server.listen(port, host, () => {
    console.log(`Openclaw course portal running at http://${host}:${port}/`);
  });
}

createServer(requestedPort);
