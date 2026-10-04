// Keep complete mathematical expressions together while prose may wrap normally.
export function protectMathSpacing(source: string) {
  const nbsp = "\u00a0";
  const spaced = source
    .replace(/ \+ [−-]/g, " − ")
    .replace(/ [−-] [−-]/g, " + ")
    .replace(/\bf[ \t]+:[ \t]+(?=ℝ)/g, "f" + nbsp + ":" + nbsp)
    .replace(/[ \t\u00a0]+([=+−×÷→∈≤≥≠|∘⊂⊆∩∪⊥∥<>⇔-])[ \t\u00a0]+/g, (_match, operator: string) =>
      `${nbsp}${operator}${nbsp}`,
    )
    .replace(/⟭[ \t]+([⟪⟦])/g, (_match, next: string) => `⟭${nbsp}${next}`);

  // Nested tuples, sets and scalar products must remain whole as well.
  const closing: Record<string, string> = { "(": ")", "[": "]", "{": "}", "⟨": "⟩" };
  const stack: string[] = [];
  let result = "";
  for (let index = 0; index < spaced.length; index += 1) {
    const character = spaced[index];
    if (closing[character]) stack.push(closing[character]);
    if (stack.length && /[ \t\u00a0]/.test(character)) {
      result += nbsp;
    } else {
      result += character;
      if (stack.length && /[,;]/.test(character)) {
        while (/[ \t\u00a0]/.test(spaced[index + 1] ?? "")) index += 1;
        result += nbsp;
      }
    }
    if (character === stack.at(-1)) stack.pop();
  }
  return result;
}
