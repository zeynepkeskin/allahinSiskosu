"use client";

import {
  ArrowUp,
  Check,
  Dumbbell,
  History,
  MessageSquarePlus,
  Pencil,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToolActivity = {
  id: string;
  label: string;
  status: "running" | "done" | "error";
};
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolActivity[];
  error?: boolean;
};
type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
};

const STORAGE_KEY = "coach-chat-history-v1";
const starters = [
  {
    icon: Sparkles,
    label: "Review my last 7 days",
    prompt:
      "Review my meals and workouts from the last 7 days. What is going well, and what should I focus on next?",
  },
  {
    icon: Dumbbell,
    label: "Find neglected muscles",
    prompt:
      "Which muscle groups have I neglected lately? Recommend exercises using equipment I have.",
  },
  {
    icon: Utensils,
    label: "What should I eat now?",
    prompt:
      "Based on what I have eaten today and my goals, what would be a good meal or snack now?",
  },
  {
    icon: Dumbbell,
    label: "Build my next workout",
    prompt:
      "Create a balanced workout for my next session using my available equipment and recent training history.",
  },
];

function newConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

export function CoachChat({ displayName }: { displayName?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const active = conversations.find(
    (conversation) => conversation.id === activeId,
  );
  const messages = useMemo(() => active?.messages ?? [], [active?.messages]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      ) as Conversation[];
      const initial = stored.length ? stored : [newConversation()];
      setConversations(initial);
      setActiveId(initial[0].id);
    } catch {
      const initial = newConversation();
      setConversations([initial]);
      setActiveId(initial.id);
    }
  }, []);
  useEffect(() => {
    if (!conversations.length) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(conversations.slice(0, 30)),
      );
    } catch (error) {
      // Chat remains usable when storage is unavailable, full, or blocked by
      // the browser. Supabase is still the canonical conversation store.
      console.warn("Could not persist coach history locally", error);
    }
  }, [conversations]);
  useEffect(() => {
    const end = endRef.current;
    if (end && typeof end.scrollIntoView === "function")
      end.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function updateActive(
    transform: (conversation: Conversation) => Conversation,
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeId ? transform(conversation) : conversation,
      ),
    );
  }

  function startNew() {
    if (streaming) abortRef.current?.abort();
    const conversation = newConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setInput("");
    setHistoryOpen(false);
    setEditingId(null);
  }

  function openHistory() {
    setHistoryOpen(true);
    setEditingId(null);
  }

  function selectConversation(id: string) {
    setActiveId(id);
    setHistoryOpen(false);
    setEditingId(null);
  }

  function beginEditing(conversation: Conversation) {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  }

  function saveTitle(id: string) {
    const title = editingTitle.trim();
    if (title) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === id ? { ...conversation, title } : conversation,
        ),
      );
    }
    setEditingId(null);
  }

  function deleteConversation(id: string) {
    setConversations((current) => {
      const remaining = current.filter(
        (conversation) => conversation.id !== id,
      );
      if (!remaining.length) {
        const conversation = newConversation();
        setActiveId(conversation.id);
        return [conversation];
      }
      if (id === activeId) setActiveId(remaining[0].id);
      return remaining;
    });
    if (editingId === id) setEditingId(null);
  }

  async function send(value = input) {
    const text = value.trim();
    if (!text || streaming || !activeId) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantId = crypto.randomUUID();
    const priorMessages = messages;
    updateActive((conversation) => ({
      ...conversation,
      title: conversation.messages.length
        ? conversation.title
        : text.slice(0, 54),
      updatedAt: new Date().toISOString(),
      messages: [
        ...conversation.messages,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ],
    }));
    setInput("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          message: text,
          messages: [...priorMessages, userMessage].map(
            ({ role, content }) => ({ role, content }),
          ),
        }),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          (await response.text()) || "The coach could not respond.",
        );
      if (!response.body)
        throw new Error("The coach returned an empty response.");
      await consumeStream(response, (event) => {
        updateActive((conversation) => ({
          ...conversation,
          updatedAt: new Date().toISOString(),
          messages: conversation.messages.map((message) => {
            if (message.id !== assistantId) return message;
            if (event.type === "text")
              return { ...message, content: message.content + event.text };
            if (event.type === "tool") {
              const tools = [...(message.tools ?? [])];
              const index = tools.findIndex((tool) => tool.id === event.id);
              const tool = {
                id: event.id,
                label: event.label,
                status: event.status,
              };
              if (index >= 0) tools[index] = tool;
              else tools.push(tool);
              return { ...message, tools };
            }
            return message;
          }),
        }));
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        updateActive((conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  error: true,
                  content:
                    message.content ||
                    (error as Error).message ||
                    "Something went wrong. Please try again.",
                }
              : message,
          ),
        }));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function retry() {
    const lastUser = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    if (!lastUser) return;
    updateActive((conversation) => ({
      ...conversation,
      messages: conversation.messages.filter((message) => !message.error),
    }));
    void send(lastUser.content);
  }

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100dvh-5rem)] overflow-hidden sm:-mx-6 lg:-mx-8">
      <main className="relative flex min-h-[calc(100dvh-5rem)] min-w-0 flex-col">
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur sm:right-6">
          <button
            aria-label="New chat"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={startNew}
          >
            <MessageSquarePlus size={20} />
          </button>
          <button
            aria-label="Chat history"
            className={`rounded-lg p-2 hover:bg-slate-100 ${historyOpen ? "bg-emerald-50 text-emerald-700" : "text-slate-600"}`}
            onClick={openHistory}
          >
            <History size={20} />
          </button>
        </div>

        {historyOpen ? (
          <ChatHistory
            conversations={conversations}
            editingId={editingId}
            editingTitle={editingTitle}
            setEditingTitle={setEditingTitle}
            beginEditing={beginEditing}
            saveTitle={saveTitle}
            cancelEditing={() => setEditingId(null)}
            deleteConversation={deleteConversation}
            selectConversation={selectConversation}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!messages.length ? (
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-8">
                <div className="mb-8 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Sparkles size={24} />
                  </span>
                  <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                    {displayName
                      ? `What can I help with, ${displayName}?`
                      : "What can I help you with?"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Ask about your nutrition, training, progress, or next plan.
                  </p>
                </div>
                <Composer
                  input={input}
                  setInput={setInput}
                  send={send}
                  streaming={streaming}
                  stop={() => abortRef.current?.abort()}
                  autoFocus
                />
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {starters.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow"
                      onClick={() => void send(prompt)}
                    >
                      <Icon className="shrink-0 text-emerald-600" size={17} />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-center text-xs text-slate-400">
                  Your coach uses your logged meals, workouts, goals, and
                  available equipment. Advice is not medical care.
                </p>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl px-4 pb-36 pt-20 sm:px-8">
                {messages.map((message) => (
                  <Message key={message.id} message={message} retry={retry} />
                ))}
                {streaming && !messages.at(-1)?.content ? (
                  <div className="mb-7 flex items-center gap-2 text-sm text-slate-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{" "}
                    Thinking with your data…
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
            )}
          </div>
        )}
        {!historyOpen && messages.length ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent px-4 pb-4 pt-10 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <Composer
                input={input}
                setInput={setInput}
                send={send}
                streaming={streaming}
                stop={() => abortRef.current?.abort()}
              />
              <p className="mt-2 text-center text-[11px] text-slate-400">
                AI can make mistakes. Check important nutrition and health
                guidance.
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ChatHistory({
  conversations,
  editingId,
  editingTitle,
  setEditingTitle,
  beginEditing,
  saveTitle,
  cancelEditing,
  deleteConversation,
  selectConversation,
}: {
  conversations: Conversation[];
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  beginEditing: (conversation: Conversation) => void;
  saveTitle: (id: string) => void;
  cancelEditing: () => void;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string) => void;
}) {
  const chats = conversations.filter(
    (conversation) => conversation.messages.length,
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-20 sm:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Chat history</h1>
      <p className="mt-1 text-sm text-slate-500">
        Open a previous conversation or update its title.
      </p>
      {chats.length ? (
        <div className="mt-6 space-y-2">
          {chats.map((conversation) => (
            <div
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
              key={conversation.id}
            >
              {editingId === conversation.id ? (
                <input
                  aria-label="Chat title"
                  autoFocus
                  className="min-w-0 flex-1 rounded-lg border border-emerald-300 px-3 py-2 text-sm outline-none ring-2 ring-emerald-100"
                  maxLength={80}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveTitle(conversation.id);
                    if (event.key === "Escape") cancelEditing();
                  }}
                  value={editingTitle}
                />
              ) : (
                <button
                  className="min-w-0 flex-1 px-3 py-2 text-left"
                  onClick={() => selectConversation(conversation.id)}
                >
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {conversation.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {new Date(conversation.updatedAt).toLocaleString()}
                  </span>
                </button>
              )}
              {editingId === conversation.id ? (
                <>
                  <button
                    aria-label="Save title"
                    className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => saveTitle(conversation.id)}
                  >
                    <Check size={18} />
                  </button>
                  <button
                    aria-label="Cancel editing"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    onClick={cancelEditing}
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <button
                  aria-label={`Edit ${conversation.title}`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  onClick={() => beginEditing(conversation)}
                >
                  <Pencil size={17} />
                </button>
              )}
              <button
                aria-label={`Delete ${conversation.title}`}
                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => deleteConversation(conversation.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
          No previous chats yet.
        </div>
      )}
    </div>
  );
}

function Message({
  message,
  retry,
}: {
  message: ChatMessage;
  retry: () => void;
}) {
  if (message.role === "user")
    return (
      <div className="mb-7 flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-sm leading-6 text-white">
          {message.content}
        </div>
      </div>
    );
  return (
    <div className="mb-8 flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <Sparkles size={14} />
      </span>
      <div className="min-w-0 flex-1">
        {message.tools?.length ? (
          <div className="mb-3 space-y-1.5">
            {message.tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                {tool.status === "running" ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                ) : tool.status === "done" ? (
                  <span className="text-emerald-600">✓</span>
                ) : (
                  <span className="text-red-500">!</span>
                )}
                {tool.label}
              </div>
            ))}
          </div>
        ) : null}
        <div
          className={`text-[15px] leading-7 ${message.error ? "text-red-700" : "text-slate-700"}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 mt-5 text-xl font-bold first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 mt-5 text-lg font-bold first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 font-bold first:mt-0">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="my-3 first:mt-0 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-4 border-emerald-200 pl-4 text-slate-600">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                  href={href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {children}
                </a>
              ),
              code: ({ children, className }) =>
                className ? (
                  <code className={className}>{children}</code>
                ) : (
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]">
                    {children}
                  </code>
                ),
              pre: ({ children }) => (
                <pre className="my-3 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm leading-6 text-slate-100">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <table className="my-3 w-full border-collapse text-left text-sm">
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-slate-200 px-3 py-2 align-top">
                  {children}
                </td>
              ),
              hr: () => <hr className="my-5 border-slate-200" />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.error ? (
          <button
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            onClick={retry}
          >
            <RefreshCw size={15} /> Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Composer({
  input,
  setInput,
  send,
  streaming,
  stop,
  autoFocus = false,
}: {
  input: string;
  setInput: (value: string) => void;
  send: (value?: string) => Promise<void>;
  streaming: boolean;
  stop: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-2 shadow-lg shadow-slate-200/40">
      <textarea
        aria-label="Message your AI coach"
        autoFocus={autoFocus}
        className="max-h-40 min-h-12 w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void send();
          }
        }}
        placeholder="Ask your coach anything…"
        rows={1}
        value={input}
      />
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <History size={13} /> Uses your recent activity
        </span>
        {streaming ? (
          <button
            aria-label="Stop generating"
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-white"
            onClick={stop}
          >
            <Square fill="currentColor" size={12} />
          </button>
        ) : (
          <button
            aria-label="Send message"
            className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:bg-slate-200"
            disabled={!input.trim()}
            onClick={() => void send()}
          >
            <ArrowUp size={17} />
          </button>
        )}
      </div>
    </div>
  );
}

type StreamEvent =
  | { type: "text"; text: string }
  | {
      type: "tool";
      id: string;
      label: string;
      status: "running" | "done" | "error";
    };
async function consumeStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await response.json()) as {
      text?: string;
      response?: string;
      message?: string;
      error?: string;
    };
    onEvent({
      type: "text",
      text: data.text ?? data.response ?? data.message ?? data.error ?? "",
    });
    return;
  }
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let pendingEvent = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = done ? "" : (lines.pop() ?? "");
    for (const raw of lines) {
      if (raw.startsWith("event:")) {
        pendingEvent = raw.slice(6).trim();
        continue;
      }
      const line = raw.replace(/^data:\s?/, "").trim();
      if (!line || line === "[DONE]") continue;
      try {
        const data = JSON.parse(line) as Record<string, unknown>;
        const type = String(data.type ?? pendingEvent);
        pendingEvent = "";
        if (["tool", "tool_start", "tool_end", "tool_error"].includes(type)) {
          const rawStatus = String(data.status ?? "");
          onEvent({
            type: "tool",
            id: String(
              data.id ?? data.tool ?? data.name ?? crypto.randomUUID(),
            ),
            label: String(
              data.label ?? data.tool ?? data.name ?? "Checking your data",
            ),
            status:
              type === "tool_start"
                ? "running"
                : type === "tool_error"
                  ? "error"
                  : rawStatus === "started"
                    ? "running"
                    : rawStatus === "failed"
                      ? "error"
                      : "done",
          });
        } else {
          const text = data.delta ?? data.text ?? data.content;
          if (typeof text === "string") onEvent({ type: "text", text });
          else if (type === "error" && typeof data.error === "string")
            onEvent({ type: "text", text: data.error });
        }
      } catch {
        onEvent({
          type: "text",
          text:
            raw.replace(/^data:\s?/, "") +
            (contentType.includes("text/event-stream") ? "" : "\n"),
        });
      }
    }
    if (done) {
      if (buffer) onEvent({ type: "text", text: buffer });
      break;
    }
  }
}
