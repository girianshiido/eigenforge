import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the game shell and finished metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>EIGENFORGE<\/title>/i);
  assert.match(html, /EIGENFORGE/);
  assert.match(html, /Forger des coordonnées/);
  assert.match(html, /Architecture productive/);
  assert.match(html, /Anomalies mathématiques/);
  assert.match(html, /Maîtrise et invariants/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-controls="panel-network"/);
  assert.match(html, /aria-controls="panel-instruments"/);
  assert.match(html, /aria-controls="panel-anomalies"/);
  assert.match(html, /aria-controls="panel-atlas"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("ships the animated forge controls", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(page, /className=\{`core-button \$\{isEmitting/);
  assert.match(page, /className="core-impact"/);
  assert.match(page, /className=\{`workshop-buy/);
  assert.match(styles, /@keyframes coreKick/);
  assert.match(styles, /@keyframes coreRipple/);
  assert.match(styles, /\.workshop-buy\.ready/);
});

test("formats generated expressions and previews basis changes", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /function formatLinearExpression/);
  assert.match(page, /Remis à zéro/);
  assert.match(page, /Multiplicateur actuel/);
  assert.match(page, /Après le changement/);
  assert.match(page, /question\.formula &&/);
  assert.doesNotMatch(page, /D = \{ λ\$\{vector/);
  assert.doesNotMatch(page, /\$\{[a-zA-Z]+\}x \+ \$\{[a-zA-Z]+\}y/);
  assert.doesNotMatch(page, /\+ \$\{[a-zA-Z]+\}μ/);
});

test("keeps the network diagram consistent with its displayed dimension", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(page, /const spaceDimension/);
  assert.match(page, /game\.instruments\[0\] > 0 \? 1 : 0/);
  assert.doesNotMatch(page, /game\.runTotal > 0 \?/);
  assert.match(page, /vector-one \$\{game\.instruments\[0\] > 0/);
  assert.match(page, /spaceDimension >= 2/);
  assert.match(page, /spaceDimension === 0/);
  assert.match(page, /E = \{"\{0\}"\}/);
  assert.match(page, /B = \(u, v\)/);
  assert.match(page, /Forger des coordonnées/);
  assert.doesNotMatch(page, /className="axis-label/);
  assert.match(styles, /\.network-stage::before[\s\S]*aspect-ratio: 1/);
  assert.match(styles, /@keyframes vectorGlow/);
  assert.match(styles, /@keyframes planeBreath/);
});

test("exports a GitHub Pages build under the repository path", async () => {
  const html = await readFile(
    new URL("../docs/index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /<title>EIGENFORGE<\/title>/);
  assert.match(html, /\/eigenforge\/assets\/index-[^"]+\.js/);
  assert.match(html, /\/eigenforge\/assets\/index-[^"]+\.css/);
  await readFile(new URL("../docs/.nojekyll", import.meta.url), "utf8");
});

test("exports an installable Android and iOS application", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../docs/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  const serviceWorker = await readFile(
    new URL("../docs/sw.js", import.meta.url),
    "utf8",
  );
  const html = await readFile(
    new URL("../docs/index.html", import.meta.url),
    "utf8",
  );

  assert.equal(manifest.name, "EIGENFORGE");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/eigenforge/");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.match(html, /rel="manifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(serviceWorker, /cache\.addAll\(PRECACHE\)/);

  for (const [file, expectedSize] of [
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["apple-touch-icon.png", 180],
  ]) {
    const image = await readFile(new URL(`../docs/${file}`, import.meta.url));
    assert.equal(image.readUInt32BE(16), expectedSize);
    assert.equal(image.readUInt32BE(20), expectedSize);
  }
});
