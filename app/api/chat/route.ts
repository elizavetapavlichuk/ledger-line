import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import {
  addTransaction,
  deleteLastTransaction,
  getCurrency,
  listTransactions,
  upsertMessages,
} from "@/lib/db/queries";
import { CATEGORIES, computeSummary, monthPrefix, round2, todayISO } from "@/lib/ledger";

export const maxDuration = 60;

function buildSystemPrompt(currency: string) {
  return (
    `You are the user's personal bookkeeper inside "Ledger Line," a running ledger they keep ` +
    `by texting you what they spend or earn. Today is ${todayISO()} and the ledger currency is ${currency}. ` +
    `When a message describes spending or income, call record_transaction — infer the amount, pick the ` +
    `closest category from [${CATEGORIES.join(", ")}], and write a short clear note. ` +
    `When asked about totals, spending by category, or "how much," call get_ledger_summary rather than ` +
    `estimating. If asked to undo, remove, or void the last entry, call void_last_transaction. ` +
    `After using a tool, reply in one or two short sentences like a calm, precise bookkeeper: state the ` +
    `number plainly in ${currency}, no filler, no emoji, don't restate raw tool output. ` +
    `If a message isn't about money, answer briefly and steer back to the ledger.`
  );
}

function buildTools(currency: string) {
  return {
    record_transaction: tool({
      description:
        "Log one spending or income entry to the ledger. Returns the running month-to-date expense total after logging.",
      inputSchema: z.object({
        amount: z.number().positive().describe("Positive amount, in the ledger's currency."),
        type: z.enum(["expense", "income"]),
        category: z.enum(CATEGORIES),
        note: z.string().min(1).max(140).describe("Short description, a few words."),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("YYYY-MM-DD; omit to use today."),
      }),
      execute: async ({ amount, type, category, note, date }) => {
        const record = await addTransaction({
          amount,
          type,
          category,
          note,
          date: date ?? todayISO(),
        });
        const all = await listTransactions();
        const monthTotal = all
          .filter((t) => t.type === "expense" && t.date.slice(0, 7) === monthPrefix())
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          ok: true,
          logged: record,
          runningMonthExpenseTotal: round2(monthTotal),
          currency,
        };
      },
    }),

    get_ledger_summary: tool({
      description:
        "Get totals and a category breakdown for a period, to answer questions like how much was spent. Does not modify anything.",
      inputSchema: z.object({
        period: z.enum(["today", "week", "month", "all"]),
      }),
      execute: async ({ period }) => {
        const all = await listTransactions();
        return computeSummary(all, period, currency);
      },
    }),

    void_last_transaction: tool({
      description:
        "Remove the most recently logged entry, in case it was a mistake or the user asks to undo/void it.",
      inputSchema: z.object({}),
      execute: async () => {
        const voided = await deleteLastTransaction();
        if (!voided) return { ok: false, message: "There is nothing to void." };
        return {
          ok: true,
          voided: {
            amount: voided.amount,
            category: voided.category,
            note: voided.note,
            date: voided.date,
          },
        };
      },
    }),
  };
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const currency = await getCurrency();

  const result = streamText({
    model: anthropic("claude-sonnet-5"),
    system: buildSystemPrompt(currency),
    messages: await convertToModelMessages(messages),
    tools: buildTools(currency),
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: updated, outcome }) => {
      // On a failed or aborted turn, drop a trailing assistant message that
      // never received any text — otherwise a blank turn gets saved and
      // resent as context on the next request.
      const toSave =
        outcome.status === "completed"
          ? updated
          : updated.filter(
              (m, i) =>
                !(i === updated.length - 1 && m.role === "assistant" && m.parts.length === 0),
            );
      await upsertMessages(toSave);
    },
  });
}
