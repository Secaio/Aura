const { createServer } = require("https");
const { readFileSync } = require("fs");
const next = require("next");

const app = next({ dev: true });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync("./certs/key.pem"),
  cert: readFileSync("./certs/cert.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(3001, () => {
    console.log("🚀 HTTPS Next.js rodando em https://192.168.2.11:3001");
  });
});
