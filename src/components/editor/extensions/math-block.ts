import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MathNodeView } from "./math-node-view";

/**
 * MathBlock — Block-level math node for Tiptap.
 *
 * Usage: type `$$latex$$` on a new line → renders block KaTeX (display mode).
 * Or use the toolbar button to insert a block math node.
 */
export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
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
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-type": "math-block",
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
    // Match $$...$$ at end of line
    return [
      new InputRule({
        find: /\$\$([^$]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          if (!latex) return;

          const { tr } = state;
          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ latex })
          );
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertMathBlock:
        (attrs?: { latex?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex: attrs?.latex || "\\frac{a}{b}" },
          });
        },
    };
  },
});

// Extend Tiptap Commands interface
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: (attrs?: { latex?: string }) => ReturnType;
    };
  }
}
