import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { WORKSHOP_EXERCISE_FAMILIES } from "../app/question-generator.ts";
import { INSTRUMENTS } from "../app/game-balance.ts";

test("renders all workshop tasks and nested mathematical notation without raw markers", async () => {
  // Compile components in memory; this test needs neither a browser nor a port.
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    oxc: { jsx: { runtime: "automatic" } },
  });
  try {
    const { default: MathExpression } = await server.ssrLoadModule("/app/math-expression.tsx");
    const render = text => renderToStaticMarkup(React.createElement(MathExpression, { text }));
    const visibleMarkup = html => html.replace(/aria-label="[^"]*"/g, "");
    const nested = render("Vect(⟪⟬1¦2⟭,3⟫)");
    assert.match(nested, /class="math-atomic">Vect\(/);
    assert.match(nested, /class="math-column-vector"/);
    assert.match(nested, /class="math-fraction"/);
    assert.doesNotMatch(visibleMarkup(nested), /[⟪⟫⟬⟭¦]/);
    const matrix = render("⟦⟬1¦2⟭,0;0,⟬1¦√2⟭⟧");
    assert.equal((matrix.match(/class="math-fraction"/g) ?? []).length, 2);
    assert.match(matrix, /class="math-square-root"/);
    assert.match(render("u^{*}"), /class="math-superscript is-star">∗<\/sup>/);
    const forgeMark = INSTRUMENTS.find(workshop => workshop.id === "isometry-forge").mark;
    const reducerMark = INSTRUMENTS.find(workshop => workshop.id === "isometry-reducer").mark;
    assert.match(render(forgeMark), /u<sup class="math-superscript is-star">∗<\/sup>=u<sup class="math-superscript">−1<\/sup>/);
    assert.match(render(reducerMark), /R<sub class="math-subscript">θ<\/sub>/);
    assert.doesNotMatch(render(reducerMark), /R_|\{θ\}/);
    // A following tuple must not be mistaken for a separate "B = (...)" atom,
    // which would split the subscript marker away from its base label.
    const coordinates = render("B = (e₁, e₂), e₁ = (1 ; 0), e₂ = (3 ; 1) et [x]_B = (-3 ; -3)");
    assert.match(coordinates, /class="math-atomic">\[x\]<sub class="math-subscript">B<\/sub><\/span>/);
    assert.doesNotMatch(visibleMarkup(coordinates), /\[x\]_/);
    for (const base of ["B", "C", "D", "ℬ", "{B}", "can", "{can}"]) {
      const html = render(`[x]_${base} = (2 ; -1)`);
      assert.match(html, new RegExp(`\\[x\\]<sub class="math-subscript">${base.replace(/[{}]/g, "")}<\\/sub>`));
      assert.doesNotMatch(visibleMarkup(html), /\[x\]_|_\{/);
    }
    assert.match(render("[f(x)]_B = P[x]_can"), /\[f\(x\)\]<sub class="math-subscript">B<\/sub>/);
    assert.match(render("x = -1.25 et y = 0.5."), /-1,25 et y.*0,5\./);
    const decimalMatrix = render("A = ⟦1.5,-2.25;0.5,3⟧");
    assert.match(decimalMatrix, /--matrix-columns:2/);
    assert.match(decimalMatrix, />1,5</);
    assert.match(decimalMatrix, />-2,25</);
    assert.match(decimalMatrix, />0,5</);
    assert.match(render("⟪1.5,-0.25⟫"), />-0,25</);
    assert.match(render("⟬1.5¦√2.5⟭"), /math-radicand[^>]*>2,5</);
    for (const family of WORKSHOP_EXERCISE_FAMILIES) {
      for (const task of family.tasks) {
        for (let draw = 0; draw < 3; draw++) {
          const q = family.generateTask(task.id);
          for (const text of [q.prompt, q.formula, q.explanation, ...q.choices.map(c => c.text)]) {
            const html = visibleMarkup(render(text));
            assert.doesNotMatch(html, /[⟦⟧⟪⟫⟬⟭¦]|\^\{|_\{|\bNaN\b/, `${family.id}/${task.id}: ${text}`);
          }
        }
      }
    }
  } finally {
    await server.close();
  }
});
