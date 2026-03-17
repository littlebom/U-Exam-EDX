"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import katex from "katex";

/**
 * MathNodeView — Shared React NodeView for both mathInline and mathBlock.
 *
 * - View mode: renders KaTeX formula
 * - Edit mode (on click): shows a textarea to edit LaTeX source
 */
export function MathNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const latex = (node.attrs.latex as string) || "";
  const isBlock = node.type.name === "mathBlock";

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(latex);
  const katexRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Render KaTeX
  useEffect(() => {
    if (!editing && katexRef.current) {
      try {
        katex.render(latex || "\\text{...}", katexRef.current, {
          throwOnError: false,
          displayMode: isBlock,
          output: "htmlAndMathml",
        });
      } catch {
        if (katexRef.current) {
          katexRef.current.textContent = latex || "...";
        }
      }
    }
  }, [latex, editing, isBlock]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = useCallback(() => {
    setEditValue(latex);
    setEditing(true);
  }, [latex]);

  const finishEditing = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed !== latex) {
      updateAttributes({ latex: trimmed });
    }
    setEditing(false);
  }, [editValue, latex, updateAttributes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        finishEditing();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setEditValue(latex);
        setEditing(false);
      }
    },
    [finishEditing, latex]
  );

  // ── Inline wrapper ──
  if (!isBlock) {
    return (
      <NodeViewWrapper
        as="span"
        className={`math-node math-node-inline ${selected ? "selected" : ""}`}
      >
        {editing ? (
          <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-muted px-1.5 py-0.5">
            <span className="text-xs font-mono text-muted-foreground">$</span>
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-w-[80px] max-w-[300px] resize-none bg-transparent font-mono text-sm outline-none"
              style={{ width: `${Math.max(80, editValue.length * 8)}px` }}
            />
            <span className="text-xs font-mono text-muted-foreground">$</span>
          </span>
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={startEditing}
            onKeyDown={(e) => e.key === "Enter" && startEditing()}
            className="cursor-pointer rounded px-0.5 transition-colors hover:bg-primary/10"
            title="คลิกเพื่อแก้ไขสูตร"
          >
            <span ref={katexRef} />
          </span>
        )}
      </NodeViewWrapper>
    );
  }

  // ── Block wrapper ──
  return (
    <NodeViewWrapper
      className={`math-node math-node-block ${selected ? "selected" : ""}`}
    >
      {editing ? (
        <div className="my-2 rounded-lg border border-primary/30 bg-muted p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Block Math (LaTeX)
          </div>
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full resize-y rounded border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="\\frac{a}{b}"
          />
          <div className="mt-1.5 flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEditValue(latex);
                setEditing(false);
              }}
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-background"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={finishEditing}
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              ตกลง
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={startEditing}
          onKeyDown={(e) => e.key === "Enter" && startEditing()}
          className="my-2 cursor-pointer rounded-lg border border-transparent p-4 text-center transition-colors hover:border-primary/20 hover:bg-primary/5"
          title="คลิกเพื่อแก้ไขสูตร"
        >
          <span ref={katexRef} />
        </div>
      )}
    </NodeViewWrapper>
  );
}
