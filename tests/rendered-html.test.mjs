import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
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

test("renders the unlimited exercise laboratory from the shared catalogue", async () => {
  const response = await render("/exercises");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Laboratoire d’exercices/);
  assert.match(html, /Tester toutes les perturbations, sans limite/);
  assert.match(html, /Tout le catalogue/);
  assert.match(
    html,
    /Jusqu’à ℝ<sup class="math-superscript">2<\/sup>/,
  );
  assert.match(
    html,
    /Jusqu’à ℝ<sup class="math-superscript">3<\/sup>/,
  );
  assert.match(html, /Retour au jeu/);

  const laboratory = await readFile(
    new URL("../app/exercise-lab.tsx", import.meta.url),
    "utf8",
  );
  assert.match(laboratory, /EXERCISE_FAMILIES\.filter/);
  assert.match(
    laboratory,
    /generateQuestion\([\s\S]*Number\.POSITIVE_INFINITY/,
  );
  assert.doesNotMatch(laboratory, /SAVE_KEY|localStorage/);
});

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
  assert.match(html, /E<sub class="math-subscript">λ<\/sub>/);
  assert.match(html, /F<sup class="math-superscript">⊥<\/sup>/);
  assert.match(html, /S<sup class="math-superscript">\+\+<\/sup>/);
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

test("turns workshop milestones into compact purchased modules and infinite mastery", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const balance = await readFile(
    new URL("../app/game-balance.ts", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(balance, /threshold: 5/);
  assert.match(balance, /threshold: 100/);
  assert.match(balance, /FIRST_MASTERY_THRESHOLD = 200/);
  assert.match(balance, /workshopMasteryThreshold/);
  assert.match(page, /instrumentModules: number\[\]\[\]/);
  assert.match(page, /instrumentMasteries: number\[\]/);
  assert.match(page, /buyWorkshopModule/);
  assert.match(page, /buyWorkshopMastery/);
  assert.match(page, /PURCHASE_AMOUNTS.*\[1, 10, 25, "max"\]/);
  assert.match(page, /maxAffordableWorkshopQuantity/);
  assert.match(page, /className="purchase-amount-control"/);
  assert.match(page, /className="module-pips"/);
  assert.match(page, /className=\{`upgrade-toggle/);
  assert.match(page, /className=\{`workshop-mastery-row/);
  assert.match(page, /Les anciens paliers automatiques/);
  assert.match(styles, /\.workshop-grid \{[\s\S]*align-items: start/);
  assert.doesNotMatch(
    styles,
    /\.instrument-card\.expanded\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/,
  );
  assert.match(styles, /\.upgrade-panel/);
  assert.match(styles, /\.module-row/);
  assert.match(styles, /\.workshop-mastery-row/);
  assert.doesNotMatch(page, /INSTRUMENT_MILESTONES|milestoneMultiplier/);
  assert.doesNotMatch(html, /Exercices libres/);
  assert.doesNotMatch(page, /className="exercise-lab-link"/);
});

test("formats generated expressions and previews basis changes", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const questions = await readFile(
    new URL("../app/question-generator.ts", import.meta.url),
    "utf8",
  );

  assert.match(questions, /function formatLinearExpression/);
  assert.match(
    page,
    /generateExercise\(pool, spaceDimension, highestOwnedInstrument\)/,
  );
  assert.match(page, /Remis à zéro/);
  assert.match(page, /Multiplicateur actuel/);
  assert.match(page, /Après le changement/);
  assert.match(page, /question\.formula &&/);
  assert.doesNotMatch(questions, /D = \{ λ\$\{vector/);
  assert.doesNotMatch(questions, /\$\{[a-zA-Z]+\}x \+ \$\{[a-zA-Z]+\}y/);
  assert.doesNotMatch(questions, /\+ \$\{[a-zA-Z]+\}μ/);
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
  assert.match(page, /game\.instruments\[3\] > 0/);
  assert.match(page, /game\.instruments\[2\] > 0/);
  assert.match(page, /game\.instruments\[0\] > 0[\s\S]*\? 1/);
  assert.doesNotMatch(page, /game\.runTotal > 0 \?/);
  assert.match(page, /vector-one \$\{game\.instruments\[0\] > 0/);
  assert.match(page, /spaceDimension >= 2/);
  assert.match(page, /spaceDimension >= 3/);
  assert.match(page, /spaceDimension === 0/);
  assert.match(page, /E = \{"\{0\}"\}/);
  assert.match(page, /E = Vect\(\{spaceGeneratorList\}\)/);
  assert.doesNotMatch(page, /E\{spaceDimension\}/);
  assert.doesNotMatch(page, /ℬ\{spaceDimension\}/);
  assert.match(page, /className="space-indicator"/);
  assert.match(page, /<span>e₁<\/span>/);
  assert.match(page, /<span>e₂<\/span>/);
  assert.match(page, /<span>e₃<\/span>/);
  assert.match(page, /className=\{`vector-line vector-four/);
  assert.match(page, /<span>e₄<\/span>/);
  assert.match(page, /Projection visuelle du quatrième vecteur de base e 4/);
  assert.match(page, /className=\{`forged-vector dimension-\$\{spaceDimension\}`\}/);
  assert.match(page, /"--forge-angle": `\$\{emittedVector\.angle\}deg`/);
  assert.match(page, /"--forge-length": `\$\{emittedVector\.length\}%`/);
  assert.match(page, /spaceDimension === 1[\s\S]*previous\.angle === -28[\s\S]*\? 152[\s\S]*: -28/);
  assert.match(page, /randomInt\(-165, 194\)/);
  assert.match(page, /angularGap < 18/);
  assert.match(page, /"--map-angle": `\$\{emittedVector\.mappedAngle\}deg`/);
  assert.match(page, /Forger des coordonnées/);
  assert.match(page, /Forger un vecteur/);
  assert.match(page, /className="mapped-vector"/);
  assert.match(page, /<span>f\(u\)<\/span>/);
  assert.doesNotMatch(page, /vector-three[\s\S]{0,260}<span>f\(u\)<\/span>/);
  assert.match(page, /className=\{`kernel-space/);
  assert.match(page, /className=\{`image-space/);
  assert.doesNotMatch(page, /className="axis-label/);
  assert.match(styles, /\.network-stage::before[\s\S]*aspect-ratio: 1/);
  assert.match(styles, /@keyframes vectorGlow/);
  assert.match(styles, /@keyframes planeBreath/);
  assert.match(styles, /@keyframes forgedVector/);
  assert.match(styles, /@keyframes mappedVector/);
  assert.match(styles, /\.vector-four/);
  assert.match(styles, /width: var\(--forge-length\)/);
  assert.match(styles, /width: var\(--map-length\)/);
});

test("ships eight ordered workshop cycles through MPSI Euclidean foundations", async () => {
  const balance = await readFile(
    new URL("../app/game-balance.ts", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(balance, /name: "Transformateur linéaire"/);
  assert.match(balance, /name: "Chambre du noyau"/);
  assert.match(balance, /name: "Forge de l’image"/);
  assert.match(balance, /name: "Balance du rang"/);
  assert.match(balance, /chapter: "Applications linéaires"/);
  assert.match(balance, /name: "Encodeur matriciel"/);
  assert.match(balance, /name: "Composeur matriciel"/);
  assert.match(balance, /name: "Inverseur de Gauss"/);
  assert.match(balance, /name: "Chambre spectrale"/);
  assert.match(balance, /Ouvre la partie MP/);
  assert.match(balance, /chapter: "Matrices et réduction"/);
  assert.match(balance, /name: "Traceur caractéristique"/);
  assert.match(balance, /name: "Extracteur propre"/);
  assert.match(balance, /name: "Diagonaliseur"/);
  assert.match(balance, /name: "Trigonaliseur"/);
  assert.match(balance, /chapter: "Réduction spectrale · MP"/);
  assert.match(balance, /name: "Évaluateur polynomial"/);
  assert.match(balance, /name: "Extracteur minimal"/);
  assert.match(balance, /name: "Forge de Cayley-Hamilton"/);
  assert.match(balance, /name: "Décomposeur caractéristique"/);
  assert.match(balance, /chapter: "Calcul polynomial · MP"/);
  assert.match(balance, /name: "Chambre adjointe"/);
  assert.match(balance, /name: "Symétriseur spectral"/);
  assert.match(balance, /name: "Diagonaliseur orthogonal"/);
  assert.match(balance, /name: "Analyseur de positivité"/);
  assert.match(balance, /chapter: "Réduction euclidienne · MP"/);
  assert.match(balance, /name: "Accordeur scalaire"/);
  assert.match(balance, /name: "Orthogonalisateur de Schmidt"/);
  assert.match(balance, /name: "Chambre orthogonale"/);
  assert.match(balance, /name: "Projecteur métrique"/);
  assert.match(balance, /chapter: "Fondations euclidiennes · MPSI"/);
  assert.match(balance, /resonanceDecayRate/);
  assert.match(balance, /correctAnomalyRewardMultiplier/);
  assert.match(page, /const WORKSHOP_CHAPTERS/);
  assert.match(page, /game\.instruments\[8\] > 0/);
  assert.match(page, /game\.instruments\[12\] > 0/);
  assert.match(page, /workshop-cycle-navigation/);
  assert.match(page, /Balayez pour parcourir les 8 cycles/);
  assert.match(page, /activeWorkshopChapter/);
  assert.match(page, /className=\{`reduction-sequence/);
  assert.match(page, />χA<\/span>/);
  assert.match(page, /<MathExpression text="E_λ" \/>/);
  assert.match(page, /className=\{`polynomial-sequence/);
  assert.match(page, />P\(u\)<\/span>/);
  assert.match(page, />χ\(u\)<\/span>/);
  assert.match(page, /className=\{`euclidean-sequence/);
  assert.match(page, />u\*<\/span>/);
  assert.match(page, />PDPᵀ<\/span>/);
  assert.match(page, /<MathExpression text="S\^\{\+\+\}" \/>/);
  assert.match(page, /className=\{`geometry-sequence/);
  assert.match(page, />⟨·,·⟩<\/span>/);
  assert.match(page, /<MathExpression text="F\^\{⊥\}" \/>/);
  assert.match(styles, /grid-template-columns: repeat\(8/);
  assert.match(styles, /\.reduction-sequence/);
  assert.match(styles, /\.polynomial-sequence/);
  assert.match(styles, /\.euclidean-sequence/);
  assert.match(styles, /\.geometry-sequence/);
  assert.match(styles, /\.network-stage\.has-projection/);
});

test("renders matrices as responsive grids instead of flattened text", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const renderer = await readFile(
    new URL("../app/math-expression.tsx", import.meta.url),
    "utf8",
  );
  const questions = await readFile(
    new URL("../app/question-generator.ts", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(page, /<MathExpression text=\{question\.formula\}/);
  assert.match(page, /<MathExpression text=\{choice\.text\}/);
  assert.match(page, /<MathExpression text=\{question\.geometry\}/);
  assert.match(page, /<MathExpression text=\{question\.trap\}/);
  assert.match(page, /<MathExpression text=\{instrument\.mark\}/);
  assert.match(renderer, /className="math-matrix-grid"/);
  assert.match(renderer, /className="math-column-vector"/);
  assert.match(renderer, /className="math-subscript"/);
  assert.match(renderer, /className="math-superscript"/);
  assert.match(renderer, /className="math-atomic"/);
  assert.match(renderer, /className="math-fraction"/);
  assert.match(renderer, /className="math-square-root"/);
  assert.match(renderer, /className="math-expression-line"/);
  assert.match(renderer, /text\.split\("\\n"\)/);
  assert.match(renderer, /SQUARE_ROOT_PATTERN/);
  assert.match(renderer, /INLINE_SCRIPT_PATTERN/);
  assert.match(renderer, /ATOMIC_MATH_PATTERN/);
  assert.match(renderer, /\[A-Zℬ\]\\s\*=\\s\*\\\(/);
  assert.match(renderer, /\(\?:\\s\*\[\?\!\.\:\,\;\]\)\?/);
  assert.match(renderer, /SUPERSCRIPT_CHARACTERS/);
  assert.match(renderer, /"ᵀ": "T"/);
  assert.match(renderer, /\\\^\(\\\{\[\^\}\]\+\\\}/);
  assert.match(questions, /F\^\{⊥\}/);
  assert.doesNotMatch(questions, /F⊥|\)⊥|v⊥/);
  assert.match(renderer, /rawSubscript\.replace\("-", "−"\)/);
  assert.match(renderer, /Vecteur colonne/);
  assert.match(renderer, /<ScriptedText source=\{coordinate\} \/>/);
  assert.match(renderer, /--matrix-columns/);
  assert.match(questions, /Déterminant d’ordre 3/);
  assert.match(questions, /⟦\$\{rows/);
  assert.match(questions, /u = \$\{columnVector\(value\)\}/);
  assert.doesNotMatch(questions, /u = \$\{vector\(value\)\}/);
  assert.match(styles, /\.math-matrix::before/);
  assert.match(styles, /\.math-column-vector::before/);
  assert.match(styles, /\.math-subscript/);
  assert.match(styles, /\.math-superscript/);
  assert.match(styles, /\.math-atomic/);
  assert.match(styles, /\.math-fraction-numerator/);
  assert.match(styles, /\.math-fraction-denominator/);
  assert.match(
    styles,
    /\.math-fraction[\s\S]*vertical-align: middle/,
  );
  assert.match(styles, /\.math-radicand/);
  assert.match(styles, /\.math-expression\.has-lines/);
  assert.match(styles, /\.formula-card \.math-expression/);
  assert.match(styles, /\.lab-formula \.math-expression/);
  assert.match(styles, /\.correction-columns > div > span/);
  assert.match(styles, /\.lab-correction-notes > div > span/);
  assert.doesNotMatch(styles, /\.correction-columns span \{/);
  assert.doesNotMatch(styles, /\.lab-correction-notes span \{/);
  assert.match(styles, /\.matrix-operator/);
  assert.match(styles, /\.spectral-marker/);
});

test("turns invariants into a permanent post-basis progression", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const balance = await readFile(
    new URL("../app/game-balance.ts", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(page, /Principes permanents/);
  assert.match(page, /buyProtocol/);
  assert.match(page, /protocols: previous\.protocols/);
  assert.match(page, /inheritedStructuralWorkshops/);
  assert.match(balance, /name: "Principe d’homogénéité"/);
  assert.match(balance, /name: "Base héritée"/);
  assert.match(styles, /\.protocol-grid/);
  assert.match(styles, /\.protocol-card/);
});

test("keeps vertical scrolling while blocking selection and zoom gestures", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const layout = await readFile(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const sourceHtml = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const guards = await readFile(
    new URL("../app/use-interaction-guards.ts", import.meta.url),
    "utf8",
  );
  const laboratory = await readFile(
    new URL("../app/exercise-lab.tsx", import.meta.url),
    "utf8",
  );

  assert.match(layout, /maximumScale: 1/);
  assert.match(layout, /userScalable: false/);
  assert.match(sourceHtml, /maximum-scale=1\.0, user-scalable=no/);
  assert.match(styles, /touch-action: pan-x pan-y/);
  assert.match(styles, /\.workshop-cycle-navigation button[\s\S]*touch-action: pan-x/);
  assert.match(styles, /user-select: none/);
  assert.match(guards, /gesturestart/);
  assert.match(guards, /event\.touches\.length > 1/);
  assert.match(guards, /event\.ctrlKey/);
  assert.match(guards, /"wheel", preventTrackpadZoom/);
  assert.match(guards, /"dblclick", preventGesture/);
  assert.match(page, /useInteractionGuards\(\)/);
  assert.match(laboratory, /useInteractionGuards\(\)/);
});

test("defaults to a persistent light theme and keeps mobile resources visible", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const laboratory = await readFile(
    new URL("../app/exercise-lab.tsx", import.meta.url),
    "utf8",
  );
  const layout = await readFile(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const toggle = await readFile(
    new URL("../app/theme-toggle.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const sourceHtml = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );

  assert.match(html, /data-theme="light"/);
  assert.match(html, /Activer le thème sombre/);
  assert.match(page, /<ThemeToggle \/>/);
  assert.match(laboratory, /<ThemeToggle \/>/);
  assert.match(layout, /themeColor: "#edf2ee"/);
  assert.match(layout, /data-theme="light"/);
  assert.match(layout, /themeBootstrap/);
  assert.match(toggle, /const THEME_KEY = "eigenforge-theme"/);
  assert.match(toggle, /useState<Theme>\("light"\)/);
  assert.match(toggle, /document\.documentElement\.dataset\.theme = theme/);
  assert.match(toggle, /window\.localStorage\.setItem\(THEME_KEY, nextTheme\)/);
  assert.match(styles, /:root\[data-theme="light"\]/);
  assert.match(styles, /html\[data-theme="light"\] \.network-stage/);
  assert.match(
    styles,
    /html\[data-theme="light"\] \.star-field[\s\S]*?opacity: 0\.76/,
  );
  assert.match(
    styles,
    /html\[data-theme="light"\] \.coordinate-grid[\s\S]*?opacity: 0\.4/,
  );
  assert.match(
    styles,
    /html\[data-theme="light"\] \.plane[\s\S]*?border-color: rgba\(38, 122, 116, 0\.7\)/,
  );
  assert.match(styles, /\.star-field[\s\S]*?opacity: 0\.76/);
  assert.match(styles, /\.coordinate-grid[\s\S]*?opacity: 0\.34/);
  assert.match(styles, /\.plane\.visible[\s\S]*?opacity: 0\.7/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  const mobileResourcesStart = styles.lastIndexOf(
    "  .topbar-actions .resource-strip {",
  );
  const mobileResourcesEnd = styles.indexOf("  }", mobileResourcesStart);
  assert.ok(mobileResourcesStart >= 0);
  assert.match(
    styles.slice(mobileResourcesStart, mobileResourcesEnd),
    /display: grid/,
  );
  assert.match(sourceHtml, /<html lang="fr" data-theme="light">/);
  assert.match(sourceHtml, /localStorage\.getItem\("eigenforge-theme"\)/);
  assert.equal(manifest.background_color, "#edf2ee");
  assert.equal(manifest.theme_color, "#edf2ee");
});

test("exports a GitHub Pages build under the repository path", async () => {
  const html = await readFile(
    new URL("../docs/index.html", import.meta.url),
    "utf8",
  );
  const exercisesHtml = await readFile(
    new URL("../docs/exercises/index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /<title>EIGENFORGE<\/title>/);
  assert.match(html, /\/eigenforge\/assets\/game-[^"]+\.js/);
  assert.match(html, /\/eigenforge\/assets\/globals-[^"]+\.css/);
  assert.match(
    exercisesHtml,
    /<title>Laboratoire d’exercices · EIGENFORGE<\/title>/,
  );
  assert.match(
    exercisesHtml,
    /\/eigenforge\/assets\/exercises-[^"]+\.js/,
  );
  assert.match(
    exercisesHtml,
    /\/eigenforge\/assets\/globals-[^"]+\.css/,
  );
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
  assert.match(serviceWorker, /\/eigenforge\/exercises\/index\.html/);

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
