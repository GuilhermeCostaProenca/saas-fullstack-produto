import { existsSync, copyFileSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const useShell = process.platform === "win32";
const args = new Set(process.argv.slice(2));

const options = {
  prepareOnly: args.has("--prepare-only"),
  skipInstall: args.has("--skip-install"),
  skipDocker: args.has("--skip-docker"),
  skipMigrate: args.has("--skip-migrate"),
  forceGenerate: args.has("--force-generate"),
};

function log(step, message) {
  // Keep logs compact and readable for daily usage.
  process.stdout.write(`[${step}] ${message}\n`);
}

function run(command, commandArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: opts.cwd ?? rootDir,
      env: process.env,
      stdio: "inherit",
      shell: useShell,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${command} ${commandArgs.join(" ")}) with code ${code}`));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry(command, commandArgs, opts = {}) {
  const attempts = opts.attempts ?? 1;
  const waitMs = opts.waitMs ?? 0;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await run(command, commandArgs, opts);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        log("retry", `attempt ${attempt}/${attempts} failed, retrying in ${waitMs}ms`);
        await delay(waitMs);
      }
    }
  }

  throw lastError;
}

function ensureEnvFile(target, example) {
  if (existsSync(target)) return;
  if (!existsSync(example)) throw new Error(`Missing template file: ${example}`);
  copyFileSync(example, target);
  log("env", `created ${path.relative(rootDir, target)} from example`);
}

async function ensureDeps(packageDir) {
  const nodeModules = path.join(packageDir, "node_modules");
  if (existsSync(nodeModules)) return;
  log("deps", `installing ${path.relative(rootDir, packageDir)} dependencies`);
  await run(npmCmd, ["install"], { cwd: packageDir });
}

async function prepare() {
  const apiDir = path.join(rootDir, "apps", "api");
  const webDir = path.join(rootDir, "apps", "web");

  ensureEnvFile(path.join(apiDir, ".env"), path.join(apiDir, ".env.example"));
  ensureEnvFile(path.join(webDir, ".env.local"), path.join(webDir, ".env.example"));

  if (!options.skipInstall) {
    await ensureDeps(apiDir);
    await ensureDeps(webDir);
  }

  if (!options.skipDocker) {
    log("docker", "starting postgres container");
    await run("docker", ["compose", "-f", "infra/docker-compose.yml", "up", "-d"], { cwd: rootDir });
  }

  if (!options.skipMigrate) {
    const generatedClient = path.join(apiDir, "node_modules", ".prisma", "client", "index.js");
    if (options.forceGenerate || !existsSync(generatedClient)) {
      log("prisma", "running generate");
      await runWithRetry(npmCmd, ["run", "prisma:generate"], { cwd: apiDir, attempts: 3, waitMs: 1500 });
    } else {
      log("prisma", "generate skipped (client already present)");
    }
    log("prisma", "applying migrations");
    await runWithRetry(npmCmd, ["run", "prisma:deploy"], { cwd: apiDir, attempts: 8, waitMs: 2000 });
  }
}

function cleanupNextCache() {
  const nextDir = path.join(rootDir, "apps", "web", ".next");
  if (!existsSync(nextDir)) return;

  try {
    rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    log("web", "cleaned .next cache");
    return;
  } catch (_error) {
    log("web", "failed to clean .next with fs.rm, trying fallback");
  }

  if (process.platform === "win32") {
    // Fallback for OneDrive/Windows reparse point edge cases.
    const out = spawnSync("cmd.exe", ["/c", "rmdir", "/s", "/q", nextDir], {
      cwd: rootDir,
      env: process.env,
      stdio: "pipe",
      shell: false,
    });
    if (out.status === 0) log("web", "cleaned .next cache (fallback)");
  }
}

function startDevServers() {
  const apiDir = path.join(rootDir, "apps", "api");
  const webDir = path.join(rootDir, "apps", "web");

  log("dev", "starting api + web");
  const api = spawn(npmCmd, ["run", "dev"], { cwd: apiDir, env: process.env, stdio: "inherit", shell: useShell });
  const web = spawn(npmCmd, ["run", "dev"], { cwd: webDir, env: process.env, stdio: "inherit", shell: useShell });

  let stopping = false;
  const stopAll = () => {
    if (stopping) return;
    stopping = true;
    api.kill("SIGINT");
    web.kill("SIGINT");
  };

  process.on("SIGINT", stopAll);
  process.on("SIGTERM", stopAll);

  api.on("exit", (code) => {
    if (!stopping) {
      stopping = true;
      web.kill("SIGINT");
      process.exit(code ?? 1);
    }
  });

  web.on("exit", (code) => {
    if (!stopping) {
      stopping = true;
      api.kill("SIGINT");
      process.exit(code ?? 1);
    }
  });
}

async function main() {
  log("setup", "preparing environment");
  await prepare();
  cleanupNextCache();

  if (options.prepareOnly) {
    log("setup", "environment ready");
    return;
  }

  startDevServers();
}

main().catch((error) => {
  process.stderr.write(`\n[startup-error] ${error.message}\n`);
  process.stderr.write("Tip: check Docker Desktop and database port 5432.\n");
  process.exit(1);
});
