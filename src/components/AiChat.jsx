import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoClose, IoSend, IoSparklesOutline } from "react-icons/io5";
import MobilesXLogo from "./ui/MobileX";
import { buildApiUrl } from "../utils/apiUrl";
import { createProductPath } from "../utils/slugGenerator";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  title: "Welcome to MobilesX Assistant",
  content:
    "I can help you find and compare smartphones and TVs using the latest product details on MobilesX. Tell me your budget, a feature you need, or choose a category below.",
  suggestions: ["Find a smartphone", "Find a TV"],
};
const CHAT_SESSION_STORAGE_KEY = "mobilesx-ask-madh-browser-session-v1";
const CHAT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CHAT_MESSAGES = 40;

const sanitizeStoredProduct = (product) => {
  if (!product || typeof product !== "object") return null;
  const id = Number(product.id);
  const name = typeof product.name === "string" ? product.name.slice(0, 160) : "";
  if (!Number.isInteger(id) || id < 1 || !name) return null;

  const productType = product.productType === "tv" ? "tv" : "smartphone";
  const url = createProductPath(productType === "tv" ? "tvs" : "smartphones", name);
  const image = typeof product.image === "string" &&
    (/^https?:\/\//i.test(product.image) || (product.image.startsWith("/") && !product.image.startsWith("//")))
    ? product.image.slice(0, 1000)
    : null;
  const price = product.price == null ? null : Number(product.price);

  return {
    id,
    name,
    brand: typeof product.brand === "string" ? product.brand.slice(0, 80) : null,
    productType,
    price: Number.isFinite(price) ? price : null,
    image,
    url,
    specs: Array.isArray(product.specs)
      ? product.specs.slice(0, 3).flatMap((spec) =>
          spec && typeof spec.label === "string" && typeof spec.value === "string"
            ? [{ label: spec.label.slice(0, 60), value: spec.value.slice(0, 120) }]
            : [],
        )
      : [],
  };
};

const sanitizeStoredMessage = (message) => {
  if (!message || typeof message !== "object" || !["user", "assistant"].includes(message.role)) return null;
  const content = typeof message.content === "string" ? message.content.slice(0, 3000) : "";
  return {
    id: typeof message.id === "string" ? message.id.slice(0, 100) : `stored-${Date.now()}`,
    role: message.role,
    ...(typeof message.title === "string"
      ? { title: message.title.replace(/Ask Madh/gi, "MobilesX Assistant").slice(0, 140) }
      : {}),
    content,
    items: Array.isArray(message.items)
      ? message.items.slice(0, 2).map(sanitizeStoredProduct).filter(Boolean)
      : [],
    suggestions: Array.isArray(message.suggestions)
      ? message.suggestions.filter((suggestion) => typeof suggestion === "string").slice(0, 6).map((suggestion) => suggestion.slice(0, 120))
      : [],
    comparison: Array.isArray(message.comparison)
      ? message.comparison.slice(0, 2).map(sanitizeStoredProduct).filter(Boolean)
      : null,
  };
};

const sanitizeStoredContext = (context, pathname = "/") => {
  const source = context && typeof context === "object" ? context : {};
  const sourceFilters = source.filters && typeof source.filters === "object" ? source.filters : {};
  const filters = {};
  for (const key of ["maxPrice", "minPrice", "minScreenSize"]) {
    if (sourceFilters[key] == null || sourceFilters[key] === "") continue;
    const value = Number(sourceFilters[key]);
    if (Number.isFinite(value) && value >= 0) filters[key] = value;
  }
  for (const key of ["brand", "excludedBrand", "feature"]) {
    if (typeof sourceFilters[key] === "string") filters[key] = sourceFilters[key].slice(0, 80);
  }
  if (["gaming", "camera", "movies"].includes(sourceFilters.useCase)) filters.useCase = sourceFilters.useCase;
  const ids = (value, limit) => Array.isArray(value)
    ? [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, limit)
    : [];
  const selectedProductId = Number(source.selectedProductId);

  return {
    domain: ["smartphone", "tv"].includes(source.domain) ? source.domain : categoryFromPath(pathname),
    page: typeof source.page === "string" ? source.page.slice(0, 240) : pathname,
    filters,
    currentResultIds: ids(source.currentResultIds, 12),
    shownProductIds: ids(source.shownProductIds, 50),
    selectedProductId: Number.isInteger(selectedProductId) && selectedProductId > 0 ? selectedProductId : null,
  };
};

const removeStoredChatSession = () => {
  try {
    window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
  } catch {
    // Browser storage may be disabled; the in-memory chat can still run.
  }
};

const readStoredChatSession = (pathname) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (
      saved?.version !== 1 ||
      !Number.isFinite(saved.expiresAt) ||
      saved.expiresAt <= Date.now()
    ) {
      removeStoredChatSession();
      return null;
    }
    const messages = Array.isArray(saved.messages)
      ? saved.messages.slice(-MAX_CHAT_MESSAGES).map(sanitizeStoredMessage).filter(Boolean)
      : [];
    return {
      messages: messages.length ? messages : [WELCOME_MESSAGE],
      context: sanitizeStoredContext(saved.context, pathname),
    };
  } catch {
    removeStoredChatSession();
    return null;
  }
};

const categoryFromPath = (pathname = "") => {
  const path = String(pathname).toLowerCase();
  if (/\/(tvs?|televisions?)(?:\/|$)/.test(path)) return "tv";
  if (/\/(smartphones?|mobiles?)(?:\/|$)/.test(path)) return "smartphone";
  return null;
};

const formatPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return "Price not listed";
  return `From ₹${price.toLocaleString("en-IN")}`;
};

const AgentAvatar = () => (
  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 p-1.5 shadow-sm">
    <MobilesXLogo title="MobilesX Assistant" aria-label="MobilesX Assistant" className="h-4 w-6 object-contain" />
  </span>
);

const ProductCard = ({ product, onAsk, onViewProduct }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const productUrl = createProductPath(
    product.productType === "tv" ? "tvs" : "smartphones",
    product.name,
  );

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
    <div className="flex gap-2.5 p-2.5">
      <div className="flex h-[60px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
        {product.image && !imageFailed ? (
          <img src={product.image} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-contain" />
        ) : (
          <IoSparklesOutline aria-hidden="true" className="text-xl text-slate-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{product.name}</p>
        <p className="mt-1 text-sm font-semibold text-blue-700">{formatPrice(product.price)}</p>
        {Array.isArray(product.specs) && product.specs.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {product.specs.slice(0, 2).map((spec) => (
              <span key={`${product.id}-${spec.label}`} className="max-w-full truncate rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] leading-4 text-slate-600">
                {spec.label}: {spec.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
    <div className="flex items-center border-t border-slate-100 px-2.5 py-1.5">
      <button
        type="button"
        onClick={() => onAsk(product)}
        className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        Ask about this
      </button>
      <Link
        to={productUrl}
        onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onViewProduct(productUrl);
        }}
        className="ml-auto rounded-md bg-blue-700 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-800"
      >
        View product
      </Link>
    </div>
  </article>
  );
};

const AiChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialSession] = useState(() => readStoredChatSession(location.pathname));
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => initialSession?.messages || [WELCOME_MESSAGE]);
  const [context, setContext] = useState(() => initialSession?.context || ({
    domain: categoryFromPath(location.pathname),
    page: location.pathname,
    filters: {},
    currentResultIds: [],
    shownProductIds: [],
    selectedProductId: null,
  }));
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sessionExpiryTimerRef = useRef(null);
  const productNavigationTimerRef = useRef(null);

  useEffect(() => () => {
    if (productNavigationTimerRef.current) window.clearTimeout(productNavigationTimerRef.current);
  }, []);

  useEffect(() => {
    setContext((current) => ({
      ...current,
      domain: categoryFromPath(location.pathname) || current.domain,
      page: location.pathname,
    }));
  }, [location.pathname]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || (messages.length === 1 && messages[0]?.id === WELCOME_MESSAGE.id)) return;
    const lastActivityAt = Date.now();
    const expiresAt = lastActivityAt + CHAT_SESSION_TTL_MS;
    try {
      window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({
        version: 1,
        lastActivityAt,
        expiresAt,
        messages: messages.slice(-MAX_CHAT_MESSAGES).map(sanitizeStoredMessage).filter(Boolean),
        context: sanitizeStoredContext(context, location.pathname),
      }));
    } catch {
      // Storage quota/privacy settings should not prevent a live conversation.
    }
    if (sessionExpiryTimerRef.current) window.clearTimeout(sessionExpiryTimerRef.current);
    sessionExpiryTimerRef.current = window.setTimeout(() => {
      removeStoredChatSession();
      setMessages([WELCOME_MESSAGE]);
      setContext({
        domain: categoryFromPath(location.pathname),
        page: location.pathname,
        filters: {},
        currentResultIds: [],
        shownProductIds: [],
        selectedProductId: null,
      });
    }, CHAT_SESSION_TTL_MS);
    return () => {
      if (sessionExpiryTimerRef.current) window.clearTimeout(sessionExpiryTimerRef.current);
    };
  }, [messages, context, location.pathname]);

  const addMessage = (message) => {
    setMessages((current) => [...current.slice(-39), message]);
  };

  const sendMessage = async (rawMessage, selectedProductId = null) => {
    const message = String(rawMessage || "").trim();
    if (!message || isSending) return;

    const requestContext = {
      ...context,
      page: location.pathname,
      ...(selectedProductId ? { selectedProductId } : {}),
    };
    addMessage({ id: `user-${Date.now()}`, role: "user", content: message });
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(buildApiUrl("/chat/message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context: requestContext }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "I couldn't send that message. Please try again.");
      }
      if (payload.context && typeof payload.context === "object") setContext(payload.context);
      addMessage({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        title: payload.title || "MobilesX Assistant",
        content: payload.message || "I couldn't find an answer in the current product catalog.",
        items: Array.isArray(payload.items) ? payload.items : [],
        suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
        comparison: payload.comparison || null,
      });
    } catch (error) {
      addMessage({
        id: `error-${Date.now()}`,
        role: "assistant",
        content: error.message || "The chat service is unavailable right now. Please try again shortly.",
        suggestions: [],
      });
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSuggestion = (suggestion) => {
    if (suggestion.toLowerCase().includes("first result") && context.currentResultIds?.[0]) {
      const latestProducts = [...messages]
        .reverse()
        .find((message) => message.role === "assistant" && message.items?.length)?.items;
      const product = latestProducts?.find((item) => item.id === context.currentResultIds[0]);
      return sendMessage(
        product ? `Tell me about ${product.name}` : "Tell me about the first result",
        context.currentResultIds[0],
      );
    }
    if (suggestion.toLowerCase().includes("compare the top two") && context.currentResultIds?.length >= 2) {
      return sendMessage(suggestion);
    }
    return sendMessage(suggestion);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleProductNavigation = (path) => {
    if (isClosing) return;
    setIsClosing(true);
    productNavigationTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      productNavigationTimerRef.current = null;
      navigate(path);
    }, 220);
  };

  return (
    <div className={isOpen
      ? "fixed inset-0 z-[80] sm:inset-auto sm:bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] sm:right-6 lg:bottom-5"
      : "fixed bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] right-4 z-[80] sm:right-6 lg:bottom-5"}>
      {isOpen ? (
        <section
          aria-label="MobilesX Assistant shopping chat"
          className={`flex h-dvh w-full flex-col overflow-hidden overscroll-none rounded-none border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.28)] transition-[transform,opacity] duration-200 ease-in-out sm:h-[min(700px,calc(100dvh-110px))] sm:w-[min(410px,calc(100vw-32px))] ${isClosing ? "pointer-events-none translate-x-full opacity-0" : "translate-x-0 opacity-100"}`}
        >
          <header className="flex min-h-[68px] shrink-0 items-center gap-3 bg-slate-950 px-3.5 py-3 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 p-2">
              <MobilesXLogo title="" aria-hidden="true" className="h-5 w-7 object-contain" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <h2 className="truncate text-sm font-semibold">MobilesX Assistant</h2>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-300">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="truncate">Smartphone and TV shopping assistant</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white"
            >
              <IoClose size={19} />
            </button>
          </header>

          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain bg-gradient-to-b from-slate-50 via-[#f6f8fc] to-white p-4 [scrollbar-width:thin]"
          >
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex items-start gap-2.5"}>
                {message.role === "assistant" && <AgentAvatar />}
                <div className={message.role === "user" ? "flex max-w-[86%] flex-col items-end gap-1" : "min-w-0 max-w-[calc(100%-2.75rem)] flex-1 space-y-2.5"}>
                  {message.role === "assistant" && (
                    <p className="ml-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">MobilesX Assistant</p>
                  )}
                  {message.role === "assistant" && (
                    <div className="inline-block max-w-full rounded-2xl rounded-tl-md border border-slate-200 border-l-[3px] border-l-blue-500 bg-white px-3.5 py-3 text-sm leading-[1.55] text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      {message.title && <p className="mb-1.5 font-semibold text-slate-900">{message.title}</p>}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => handleSuggestion(suggestion)}
                              disabled={isSending}
                              className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-800 transition hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {message.role === "assistant" && Array.isArray(message.items) && message.items.slice(0, 2).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAsk={(item) => sendMessage(`Tell me about ${item.name}`, item.id)}
                      onViewProduct={handleProductNavigation}
                    />
                  ))}
                  {message.role === "user" && (
                    <>
                      <span className="px-1 text-[10px] font-medium text-slate-400">You</span>
                      <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-blue-700 to-indigo-700 px-3.5 py-2.5 text-sm leading-5 text-white shadow-[0_3px_10px_rgba(29,78,216,0.18)]">
                        {message.content}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-start gap-2.5" aria-label="MobilesX Assistant is finding products">
                <AgentAvatar />
                <div className="flex h-10 items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 text-xs text-slate-500 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  <span>Checking product details</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 300))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                rows={1}
                maxLength={300}
                placeholder="Ask about phones or TVs..."
                aria-label="Message MobilesX Assistant"
                className="max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2 text-base leading-5 text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label="Send message"
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <IoSend size={17} />
              </button>
            </div>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open MobilesX Assistant chat"
          className="flex items-center gap-2 rounded-full border border-blue-500/40 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:border-blue-400 hover:bg-slate-900"
        >
          <MobilesXLogo title="" aria-hidden="true" className="h-5 w-7 object-contain" />
          <span>MobilesX Assistant</span>
        </button>
      )}
    </div>
  );
};

export default AiChat;
