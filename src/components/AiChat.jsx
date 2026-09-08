import { useState } from "react";
import { IoClose, IoSend, IoSparklesOutline } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { buildApiUrl } from "../utils/apiUrl";
import MobilesXLogo from "./ui/MobileX";

const domainForRoute = (pathname) => {
  if (/^\/news(?:\/|$)/i.test(pathname)) return "news";
  if (/^\/tvs?(?:\/|$)/i.test(pathname)) return "tv";
  return "smartphone";
};

const compactItemName = (item) =>
  item?.name || item?.product_name || item?.title || item?.model || "Result";

const QUICK_PROMPTS = [
  { label: "Find a smartphone", prompt: "Help me find a smartphone." },
  { label: "Compare devices", prompt: "Help me compare two smartphones." },
  { label: "Latest launches", prompt: "Show me the latest smartphones." },
  { label: "Tech news", prompt: "Show me the latest technology news." },
];
const AgentProfile = ({ label = "Madh, the MobilesX assistant" }) => (
  <span
    aria-label={label}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f172a] p-1.5 shadow-sm"
  >
    <MobilesXLogo
      title=""
      aria-label={label}
      className="h-4 w-6 object-contain"
    />
  </span>
);
const AiChat = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [currentResults, setCurrentResults] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const submitMessage = async (rawMessage) => {
    const message = String(rawMessage || "").trim();
    if (!message || isSending) return;

    setDraft("");
    setMessages((previous) => [...previous, { role: "user", message }]);
    setIsSending(true);
    try {
      // TODO: AI chat backend integration and production response handling are still pending.
      const response = await fetch(buildApiUrl("/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId,
          context: {
            route: location.pathname,
            domain: domainForRoute(location.pathname),
            page:
              location.pathname.split("/").filter(Boolean).join("/") || "home",
            currentResults,
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "Chat request failed");
      setSessionId(body.sessionId || sessionId);
      setCurrentResults(Array.isArray(body.items) ? body.items : []);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          message: body.message || "I couldn't complete that request.",
          title: body.title,
          items: Array.isArray(body.items) ? body.items.slice(0, 4) : [],
          responseType: body.responseType,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          message: error.message || "The assistant is unavailable right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };
  const sendMessage = (event) => {
    event.preventDefault();
    submitMessage(draft);
  };

  return (
    <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] right-4 z-[80] sm:right-6 lg:bottom-5">
      {isOpen ? (
        <section className="flex h-[min(620px,calc(100vh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-none border border-blue-100 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-blue-950 bg-[#0f172a] px-4 py-3 text-white">
            <div>
              <h2 className="text-base font-semibold">Ask Madh</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-2 text-slate-300 hover:bg-blue-500/20 hover:text-white"
            >
              <IoClose size={20} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7faff] p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!messages.length && (
              <div className="mr-6">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5">
                    <AgentProfile label="Madh, the MobilesX assistant" />
                  </span>
                  <div className="max-w-[calc(100%-2.75rem)] rounded-2xl rounded-tl-md border border-slate-200 bg-white p-3.5 text-sm leading-5 text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <p className="font-semibold text-slate-900">
                      Welcome to Ask Madh
                    </p>
                    <p className="mt-1">
                      I can help you find a device, compare options, or catch up
                      on the latest technology news.
                    </p>
                  </div>
                </div>
                <div className="ml-[42px] mt-2 grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => submitMessage(option.prompt)}
                      disabled={isSending}
                      className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={
                  item.role === "user"
                    ? "ml-12 flex justify-end"
                    : "mr-6 flex items-start gap-2.5"
                }
              >
                {item.role === "assistant" ? (
                  <span className="mt-0.5">
                    <AgentProfile />
                  </span>
                ) : null}
                <div
                  className={
                    item.role === "user"
                      ? "w-fit max-w-full rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2.5 text-sm leading-5 text-white shadow-sm"
                      : "max-w-[calc(100%-2.75rem)] rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-3 text-sm leading-5 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  }
                >
                  {item.title && (
                    <p className="mb-1.5 font-semibold text-slate-900">
                      {item.title}
                    </p>
                  )}
                  <p className="break-words">{item.message}</p>
                  {item.items?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {item.items.map((result, resultIndex) => (
                        <div
                          key={`${compactItemName(result)}-${resultIndex}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/30 px-2.5 py-2"
                        >
                          <span className="min-w-0 truncate text-xs font-medium text-slate-800">
                            {compactItemName(result)}
                          </span>
                          {result.price != null && (
                            <span className="shrink-0 text-xs text-slate-500">
                              ₹{Number(result.price).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div
                className="mr-12 flex items-start gap-2.5"
                aria-live="polite"
                aria-label="Madh is typing"
              >
                <span className="mt-0.5">
                  <AgentProfile label="Madh, the MobilesX assistant" />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <span className="font-medium text-slate-600">
                    Madh is typing
                  </span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-blue-100 bg-white p-3"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Madh..."
              aria-label="Ask Madh"
              className="min-w-0 flex-1 rounded-xl border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              aria-label="Send message"
              className="rounded-xl bg-blue-600 p-2.5 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IoSend size={18} />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Ask Madh chat"
          className="flex items-center gap-2 rounded-full border border-blue-500/40 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:border-blue-400 hover:bg-slate-900"
        >
          <IoSparklesOutline size={18} className="text-blue-400" />
          <span>Ask Madh</span>
        </button>
      )}
    </div>
  );
};

export default AiChat;
