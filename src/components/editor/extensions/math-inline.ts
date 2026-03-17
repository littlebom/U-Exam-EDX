import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MathNodeView } from "./math-node-view";

/**
 * MathInline — Inline math node for Tiptap.
 *
 * Usage: type `$latex$` (e.g. `$x^2 + 1$`) → renders inline KaTeX.
 * Or use the toolbar button to insert a math node.
 */
export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math-inline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "math-inline",
          "data-latex": HTMLAttributes.latex || "",
        },
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView);
  },

  addInputRules() {
    // Match $...$ but NOT $$...$$ (block math)
    // Pattern: non-$, then $, then content (no $), then $
    return [
      new InputRule({
        find: /(?:^|[^$])\$([^$]+)\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          if (!latex) return;

          // Adjust range to not include the char before $
          const start =
            match[0].startsWith("$") ? range.from : range.from + 1;

          const { tr } = state;
          tr.replaceWith(
            start,
            range.to,
            this.type.create({ latex })
          );
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertMathInline:
        (attrs?: { latex?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex: attrs?.latex || "x^2" },
          });
        },
    };
  },
});

// Extend Tiptap Commands interface
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      insertMathInline: (attrs?: { latex?: string }) => ReturnType;
    };
  }
}
