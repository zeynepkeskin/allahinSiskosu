import { NextResponse } from "next/server";
import { z } from "zod";
import {
  coachInstructions,
  coachTools,
  executeCoachTool,
  parsePreparedMeal,
  responseText,
  type CoachToolContext,
} from "@/lib/coach-agent";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
});
type JsonObject = Record<string, unknown>;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request: Request) {
  const conversationId = new URL(request.url).searchParams.get(
    "conversationId",
  );
  if (!z.string().uuid().safeParse(conversationId).success)
    return jsonError("Invalid conversation.", 400);
  const { supabase, user } = await signedIn();
  if (!user) return jsonError("Sign in to use your coach.", 401);
  const { data: conversation } = await supabase
    .from("coach_conversations")
    .select("id, title, created_at, updated_at")
    .eq("id", conversationId!)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!conversation) return jsonError("Conversation not found.", 404);
  const { data: messages, error } = await supabase
    .from("coach_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });
  if (error) return jsonError("Could not load this conversation.", 500);
  return NextResponse.json({ conversation, messages: messages ?? [] });
}

export async function POST(request: Request) {
  const requestStartedAt = new Date().toISOString();
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return jsonError("Enter a message up to 4,000 characters.", 400);
  const { supabase, user } = await signedIn();
  if (!user) return jsonError("Sign in to use your coach.", 401);
  if (!process.env.OPENAI_API_KEY)
    return jsonError(
      "Coaching is not configured. Add OPENAI_API_KEY to the server environment.",
      503,
    );

  let conversation: { id: string; title: string } | null = null;
  if (parsed.data.conversationId) {
    const { data } = await supabase
      .from("coach_conversations")
      .select("id, title")
      .eq("id", parsed.data.conversationId)
      .eq("profile_id", user.id)
      .maybeSingle();
    conversation = data;
    if (!conversation) {
      const title = parsed.data.message.replace(/\s+/g, " ").slice(0, 72);
      const { data: created, error } = await supabase
        .from("coach_conversations")
        .insert({ id: parsed.data.conversationId, profile_id: user.id, title })
        .select("id, title")
        .single();
      if (error || !created)
        return jsonError("Could not start a conversation.", 500);
      conversation = created;
    }
  } else {
    const title = parsed.data.message.replace(/\s+/g, " ").slice(0, 72);
    const { data, error } = await supabase
      .from("coach_conversations")
      .insert({ profile_id: user.id, title })
      .select("id, title")
      .single();
    if (error || !data)
      return jsonError("Could not start a conversation.", 500);
    conversation = data;
  }

  const { data: previousMessages, error: historyError } = await supabase
    .from("coach_messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(30);
  if (historyError)
    return jsonError("Could not load conversation history.", 500);
  const { error: messageError } = await supabase.from("coach_messages").insert({
    conversation_id: conversation.id,
    role: "user",
    content: parsed.data.message,
  });
  if (messageError) return jsonError("Could not save your message.", 500);

  const toolContext: CoachToolContext = {};
  if (isExplicitMealConfirmation(parsed.data.message)) {
    const { data: proposals, error: proposalError } = await supabase
      .from("coach_tool_runs")
      .select("id, arguments, result_summary")
      .eq("conversation_id", conversation.id)
      .eq("tool_name", "prepare_meal_log")
      .eq("status", "completed")
      .lt("created_at", requestStartedAt)
      .order("created_at", { ascending: false })
      .limit(10);
    if (proposalError)
      return jsonError("Could not verify the meal confirmation.", 500);
    const pending = (proposals ?? []).find((proposal) => {
      const summary = proposal.result_summary;
      return !(
        summary &&
        typeof summary === "object" &&
        "consumedAt" in summary
      );
    });
    if (pending) {
      try {
        toolContext.confirmedMeal = {
          proposal: parsePreparedMeal(pending.arguments as JsonObject),
          proposalToolRunId: pending.id,
        };
      } catch {
        // The model will explain that a fresh proposal is needed.
      }
    }
  }

  const encoder = new TextEncoder();
  const send = (
    controller: ReadableStreamDefaultController,
    event: string,
    data: unknown,
  ) =>
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
    );
  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, "status", {
          status: "thinking",
          conversationId: conversation.id,
        });
        let response = await callOpenAI(
          {
            input: [
              ...(previousMessages ?? [])
                .filter(
                  (item) => item.role === "user" || item.role === "assistant",
                )
                .map((item) => ({ role: item.role, content: item.content })),
              { role: "user", content: parsed.data.message },
            ],
          },
          request.signal,
        );
        for (let round = 0; round < 6; round++) {
          const calls = (
            Array.isArray(response.output) ? response.output : []
          ).filter(
            (item): item is JsonObject =>
              (item as JsonObject).type === "function_call",
          );
          if (!calls.length) break;
          const outputs = [];
          for (const call of calls) {
            const name = String(call.name ?? "");
            let args: JsonObject = {};
            try {
              args = JSON.parse(String(call.arguments ?? "{}")) as JsonObject;
            } catch {
              /* strict tools should prevent this */
            }
            send(controller, "tool", {
              status: "started",
              name,
              label: coachToolLabel(name),
            });
            const { data: toolRun } = await supabase
              .from("coach_tool_runs")
              .insert({
                conversation_id: conversation.id,
                tool_name: name.slice(0, 100),
                arguments: args,
                status: "running",
              })
              .select("id")
              .maybeSingle();
            try {
              const result = await executeCoachTool(
                name,
                args,
                supabase,
                user.id,
                toolContext,
              );
              outputs.push({
                type: "function_call_output",
                call_id: String(call.call_id),
                output: JSON.stringify(result),
              });
              if (toolRun)
                await supabase
                  .from("coach_tool_runs")
                  .update({
                    status: "completed",
                    result_summary:
                      result && typeof result === "object"
                        ? result
                        : { result },
                  })
                  .eq("id", toolRun.id);
              send(controller, "tool", {
                status: "completed",
                name,
                label: coachToolLabel(name),
              });
            } catch (error) {
              console.error("Coach tool failed", name, error);
              outputs.push({
                type: "function_call_output",
                call_id: String(call.call_id),
                output: JSON.stringify({
                  error: "This data could not be loaded.",
                }),
              });
              if (toolRun)
                await supabase
                  .from("coach_tool_runs")
                  .update({
                    status: "failed",
                    error_message: "Tool data could not be loaded.",
                  })
                  .eq("id", toolRun.id);
              send(controller, "tool", {
                status: "failed",
                name,
                label: coachToolLabel(name),
              });
            }
          }
          response = await callOpenAI(
            {
              input: [
                ...(Array.isArray(response.output) ? response.output : []),
                ...outputs,
              ],
            },
            request.signal,
          );
        }
        const answer = responseText(response).trim();
        if (!answer) throw new Error("Coach response was empty");
        const { error: saveError } = await supabase
          .from("coach_messages")
          .insert({
            conversation_id: conversation.id,
            role: "assistant",
            content: answer,
          });
        if (saveError) throw saveError;
        await supabase
          .from("coach_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversation.id)
          .eq("profile_id", user.id);
        send(controller, "message", { content: answer });
        send(controller, "done", { conversationId: conversation.id });
      } catch (error) {
        console.error("Coach agent failed", error);
        send(controller, "error", {
          error: "Your coach is unavailable right now. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function isExplicitMealConfirmation(message: string) {
  return /^(?:yes(?:,? please)?(?:,? (?:add|log|save) it)?|sure(?:,? (?:add|log|save) it)?|add it|log it|save it|confirm(?:ed)?|do it|go ahead|looks good|evet(?:,? ekle)?|ekle)[.!]?$/i.test(
    message.trim(),
  );
}

function coachToolLabel(name: string) {
  if (name === "prepare_meal_log") return "Checking nutrition values";
  if (name === "add_prepared_meal") return "Adding to today's eats";
  return name.replaceAll("_", " ");
}

async function callOpenAI(extra: JsonObject, signal: AbortSignal) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_COACH_MODEL ?? "gpt-5.6-sol",
      instructions: coachInstructions,
      tools: coachTools,
      tool_choice: "auto",
      reasoning: { effort: "medium" },
      max_output_tokens: 1800,
      store: false,
      ...extra,
    }),
  });
  if (!response.ok) {
    console.error(
      "Coach provider error",
      response.status,
      (await response.text()).slice(0, 1000),
    );
    throw new Error("Provider request failed");
  }
  return (await response.json()) as JsonObject;
}
