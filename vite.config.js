import { defineConfig } from "vite";
import { execFileSync } from "node:child_process";
import path from "node:path";
export default defineConfig({
  base: "./",
  server: { port: 4173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: "es2022" },
  plugins: [
    {
      name: "content-reload",
      configureServer(server) {
        const contentPath = path.resolve("content");
        server.watcher.add(contentPath);
        let timer;
        server.watcher.on("all", (event, file) => {
          if (
            !path.resolve(file).startsWith(contentPath + path.sep) ||
            !["change", "add", "unlink"].includes(event)
          )
            return;
          clearTimeout(timer);
          timer = setTimeout(() => {
            try {
              execFileSync(process.execPath, ["scripts/content.mjs"], {
                stdio: "inherit",
              });
              server.ws.send({ type: "full-reload" });
            } catch (e) {
              server.config.logger.error(e.message);
            }
          }, 120);
        });
      },
    },
  ],
});
