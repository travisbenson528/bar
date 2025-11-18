import { mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const publicDir = join(root, "public");
const distDir = join(root, "dist");

function clean() {
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
  }
  mkdirSync(distDir, { recursive: true });
}

function copyStatic() {
  cpSync(publicDir, distDir, { recursive: true });
  cpSync(join(root, "sigma-manifest.json"), join(distDir, "sigma-manifest.json"));
}

clean();
copyStatic();

console.log(`Copied plugin assets to ${distDir}`);
