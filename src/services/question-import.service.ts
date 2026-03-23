import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import * as XLSX from "xlsx";

// ─── Types ──────────────────────────────────────────────────────────

export interface ImportRow {
  rowNum: number;
  type: string;
  difficulty: string;
  content: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  correctAnswer: string;
  explanation?: string;
  points: number;
  subjectCode?: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

// ─── Helpers ────────────────────────────────────────────────────────

const VALID_TYPES = ["MC", "MULTIPLE_CHOICE", "TF", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK", "MATCHING", "ORDERING", "IMAGE_BASED"];
const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

function normalizeType(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (upper === "MC") return "MULTIPLE_CHOICE";
  if (upper === "TF") return "TRUE_FALSE";
  if (upper === "SA" || upper === "SHORT") return "SHORT_ANSWER";
  if (upper === "FIB" || upper === "FILL") return "FILL_IN_BLANK";
  return upper;
}

function normalizeDifficulty(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (["ง่าย", "EASY", "E"].includes(upper)) return "EASY";
  if (["ปานกลาง", "MEDIUM", "M"].includes(upper)) return "MEDIUM";
  if (["ยาก", "HARD", "H"].includes(upper)) return "HARD";
  return "MEDIUM";
}

function textToTiptapJson(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

function buildOptions(row: ImportRow) {
  const options: Array<{ id: string; text: string; isCorrect: boolean }> = [];
  const labels = ["A", "B", "C", "D", "E"];
  const values = [row.optionA, row.optionB, row.optionC, row.optionD, row.optionE];
  const correctUpper = row.correctAnswer.toUpperCase().trim();

  for (let i = 0; i < values.length; i++) {
    const val = values[i]?.trim();
    if (!val) continue;
    options.push({
      id: `opt_${i}`,
      text: val,
      isCorrect: correctUpper === labels[i],
    });
  }
  return options;
}

// ─── Parse Excel/CSV Buffer ─────────────────────────────────────────

export function parseImportFile(buffer: Buffer, filename: string): ImportRow[] {
  // For CSV files, decode as UTF-8 string first to preserve Thai characters
  const isCsv = filename.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(buffer.toString("utf-8"), { type: "string" })
    : XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw errors.validation("ไฟล์ไม่มี sheet");

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rawRows.map((raw, idx) => ({
    rowNum: idx + 2, // +2 for header row + 0-index
    type: String(raw.type ?? raw.Type ?? raw.ประเภท ?? "MC"),
    difficulty: String(raw.difficulty ?? raw.Difficulty ?? raw.ระดับ ?? "MEDIUM"),
    content: String(raw.content ?? raw.Content ?? raw.คำถาม ?? raw.question ?? ""),
    optionA: String(raw.option_a ?? raw.optionA ?? raw.ตัวเลือกA ?? raw["ตัวเลือก A"] ?? ""),
    optionB: String(raw.option_b ?? raw.optionB ?? raw.ตัวเลือกB ?? raw["ตัวเลือก B"] ?? ""),
    optionC: String(raw.option_c ?? raw.optionC ?? raw.ตัวเลือกC ?? raw["ตัวเลือก C"] ?? ""),
    optionD: String(raw.option_d ?? raw.optionD ?? raw.ตัวเลือกD ?? raw["ตัวเลือก D"] ?? ""),
    optionE: String(raw.option_e ?? raw.optionE ?? raw.ตัวเลือกE ?? raw["ตัวเลือก E"] ?? ""),
    correctAnswer: String(raw.correct_answer ?? raw.correctAnswer ?? raw.คำตอบ ?? raw.answer ?? ""),
    explanation: String(raw.explanation ?? raw.Explanation ?? raw.อธิบาย ?? ""),
    points: Number(raw.points ?? raw.Points ?? raw.คะแนน ?? 1) || 1,
    subjectCode: String(raw.subject_code ?? raw.subjectCode ?? raw.รหัสวิชา ?? ""),
  }));
}

// ─── Validate Rows ──────────────────────────────────────────────────

export function validateRows(rows: ImportRow[]): {
  valid: ImportRow[];
  errors: Array<{ row: number; message: string }>;
} {
  const valid: ImportRow[] = [];
  const errs: Array<{ row: number; message: string }> = [];

  for (const row of rows) {
    const type = normalizeType(row.type);
    if (!VALID_TYPES.includes(type)) {
      errs.push({ row: row.rowNum, message: `ประเภทไม่ถูกต้อง: "${row.type}"` });
      continue;
    }
    if (!row.content.trim()) {
      errs.push({ row: row.rowNum, message: "ไม่มีคำถาม" });
      continue;
    }
    if (type === "MULTIPLE_CHOICE" && !row.optionA) {
      errs.push({ row: row.rowNum, message: "ปรนัยต้องมีตัวเลือกอย่างน้อย 2 ข้อ" });
      continue;
    }
    if (!row.correctAnswer.trim() && type !== "ESSAY") {
      errs.push({ row: row.rowNum, message: "ไม่มีคำตอบที่ถูกต้อง" });
      continue;
    }

    row.type = type;
    row.difficulty = normalizeDifficulty(row.difficulty);
    valid.push(row);
  }

  return { valid, errors: errs };
}

// ─── Import to Database ─────────────────────────────────────────────

export async function importQuestions(
  tenantId: string,
  createdById: string,
  rows: ImportRow[],
  defaultSubjectId?: string
): Promise<ImportResult> {
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [] };

  // Resolve subject codes to IDs
  const subjectCodes = [...new Set(rows.map((r) => r.subjectCode).filter(Boolean))];
  const subjects = subjectCodes.length > 0
    ? await prisma.subject.findMany({
        where: { tenantId, code: { in: subjectCodes as string[] } },
        select: { id: true, code: true },
      })
    : [];
  const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));

  for (const row of rows) {
    try {
      const subjectId = row.subjectCode
        ? subjectMap.get(row.subjectCode) ?? defaultSubjectId
        : defaultSubjectId;

      let options = null;
      let correctAnswer = null;

      switch (row.type) {
        case "MULTIPLE_CHOICE": {
          const opts = buildOptions(row);
          options = opts.map((o) => ({ id: o.id, text: o.text }));
          correctAnswer = opts.find((o) => o.isCorrect)?.id ?? null;
          break;
        }
        case "TRUE_FALSE": {
          options = [
            { id: "true", text: "ถูก" },
            { id: "false", text: "ผิด" },
          ];
          const ans = row.correctAnswer.toLowerCase().trim();
          correctAnswer = ["true", "ถูก", "t", "1"].includes(ans) ? "true" : "false";
          break;
        }
        case "SHORT_ANSWER": {
          correctAnswer = row.correctAnswer.split("|").map((a) => a.trim());
          break;
        }
        case "FILL_IN_BLANK": {
          correctAnswer = row.correctAnswer.split("|").map((a) => a.trim());
          break;
        }
        default: {
          correctAnswer = row.correctAnswer || null;
          break;
        }
      }

      await prisma.question.create({
        data: {
          tenantId,
          createdById,
          subjectId: subjectId ?? null,
          type: row.type,
          difficulty: row.difficulty,
          content: textToTiptapJson(row.content),
          searchText: row.content,
          options: options ?? undefined,
          correctAnswer: correctAnswer ?? undefined,
          explanation: row.explanation || null,
          points: row.points,
          status: "DRAFT",
        },
      });
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        row: row.rowNum,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}
