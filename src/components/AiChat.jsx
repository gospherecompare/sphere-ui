import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  IoCheckmarkDone,
  IoChatbubbleEllipsesOutline,
  IoClose,
  IoSend,
  IoSparklesOutline,
} from "react-icons/io5";
import { FaChartBar, FaChevronRight, FaListUl, FaSearch } from "react-icons/fa";
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
  const id = typeof message.id === "string" ? message.id.slice(0, 100) : `stored-${Date.now()}`;
  const storedTime = Number(message.createdAt);
  const idTime = Number(id.match(/-(\d{10,})$/)?.[1]);
  const content = typeof message.content === "string" ? message.content.slice(0, 3000) : "";
  return {
    id,
    role: message.role,
    createdAt: Number.isFinite(storedTime) && storedTime > 0
      ? storedTime
      : Number.isFinite(idTime) && idTime > 0
        ? idTime
        : null,
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

const formatMessageTime = (value) => {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const MessageTimestamp = ({ createdAt, isUser = false }) => {
  const time = formatMessageTime(createdAt);
  if (!time) return null;
  return (
    <span className={`flex items-center gap-1 px-1 text-[10px] text-slate-500 ${isUser ? "justify-end" : ""}`}>
      {time}
      {isUser ? <IoCheckmarkDone className="text-blue-600" aria-label="Sent" /> : null}
    </span>
  );
};

const AgentAvatar = () => (
  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 p-1.5 shadow-sm sm:h-10 sm:w-10">
    <MobilesXLogo title="MobilesX Assistant" aria-label="MobilesX Assistant" className="h-4 w-6 object-contain sm:h-5 sm:w-7" />
  </span>
);

const ProductCard = ({ product, onAsk, onViewProduct }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const productUrl = createProductPath(
    product.productType === "tv" ? "tvs" : "smartphones",
    product.name,
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_18px_rgba(18,43,82,0.04)]">
      <div className="flex min-h-[108px] gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="flex h-[86px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:h-[96px] sm:w-[76px]">
          {product.image && !imageFailed ? (
            <img src={product.image} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-contain mix-blend-multiply" />
          ) : (
            <IoSparklesOutline aria-hidden="true" className="text-2xl text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="line-clamp-2 text-[14px] font-bold leading-5 text-slate-900 sm:text-base">{product.name}</p>
          <p className="mt-1 text-base font-extrabold leading-5 text-blue-700 sm:text-lg">{formatPrice(product.price)}</p>
          {Array.isArray(product.specs) && product.specs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.specs.slice(0, 3).map((spec) => (
                <span key={`${product.id}-${spec.label}`} title={spec.label} className="max-w-full truncate rounded-full bg-[#edf3fb] px-2.5 py-1 text-[10px] leading-4 text-slate-700 sm:text-[11px]">
                  {spec.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex min-h-[48px] items-center gap-2 border-t border-slate-100 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => onAsk(product)}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg px-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:text-xs"
        >
          <FaSearch aria-hidden="true" />
          Ask about this
        </button>
        <Link
          to={productUrl}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onViewProduct(productUrl);
          }}
          className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-[11px] font-bold text-white transition hover:bg-blue-700 sm:px-4 sm:text-xs"
        >
          View product
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

const ComparisonProductRow = ({ product, onViewProduct }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const productUrl = createProductPath(
    product.productType === "tv" ? "tvs" : "smartphones",
    product.name,
  );

  return (
    <Link
      to={productUrl}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onViewProduct(productUrl);
      }}
      className="grid min-h-[66px] grid-cols-[48px_minmax(0,1fr)_14px] items-center gap-3 rounded-xl bg-white px-3 py-2 text-slate-900 no-underline transition hover:bg-blue-50 sm:grid-cols-[58px_minmax(0,1fr)_16px] sm:px-4"
    >
      <span className="flex h-[52px] w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-50 sm:w-[58px]">
        {product.image && !imageFailed ? (
          <img src={product.image} alt="" loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-contain mix-blend-multiply" />
        ) : (
          <IoSparklesOutline aria-hidden="true" className="text-lg text-slate-300" />
        )}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <strong className="truncate text-xs font-bold sm:text-sm">{product.name}</strong>
        <span className="truncate text-xs font-bold text-blue-700 sm:text-sm">{formatPrice(product.price)}</span>
      </span>
      <FaChevronRight className="text-slate-500" aria-hidden="true" />
    </Link>
  );
};

const ProductComparisonCard = ({ comparison, message, onCompare, onMore, onViewProduct, isSending }) => (
  <article className="w-full rounded-2xl border border-blue-100 bg-[#f1f7ff] p-3 sm:p-4">
    <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
      {message.title || "Product comparison"}
    </h3>
    <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
      {message.content || "Here are the two products you asked to compare."}
    </p>
    <div className="mt-3 grid gap-1.5">
      {comparison.slice(0, 2).map((product) => (
        <ComparisonProductRow key={product.id} product={product} onViewProduct={onViewProduct} />
      ))}
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onCompare}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-blue-600 bg-white px-2 text-[10px] font-bold text-blue-700 transition hover:bg-blue-50 sm:gap-2 sm:text-xs"
      >
        <FaChartBar aria-hidden="true" />
        Compare the top two
      </button>
      <button
        type="button"
        onClick={onMore}
        disabled={isSending}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-blue-600 bg-white px-2 text-[10px] font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 sm:gap-2 sm:text-xs"
      >
        <FaListUl aria-hidden="true" />
        Show more options
      </button>
    </div>
  </article>
);

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
    setMessages((current) => [
      ...current.slice(-39),
      { ...message, createdAt: message.createdAt || Date.now() },
    ]);
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

  const handleCompareProducts = (products) => {
    setIsOpen(false);
    navigate("/compare", { state: { initialProducts: products } });
  };

  return (
    <div className={isOpen
      ? "fixed inset-0 z-[80] sm:inset-auto sm:bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] sm:right-6 lg:bottom-3 lg:right-3"
      : "fixed bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] right-4 z-[80] sm:right-6 lg:bottom-3 lg:right-3"}>
      {isOpen ? (
        <>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
          className="fixed inset-0 z-0 hidden bg-slate-950/80 backdrop-blur-[3px] sm:block"
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-label="MobilesX Assistant shopping chat"
          className={`mx-assistant-panel relative z-10 flex h-dvh w-full flex-col overflow-hidden overscroll-none rounded-none border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.28)] transition-[transform,opacity] duration-200 ease-in-out sm:rounded-[18px] sm:h-[min(680px,calc(100dvh-110px))] sm:w-[min(410px,calc(100vw-32px))] lg:h-[min(900px,calc(100dvh-24px))] lg:w-[min(594px,calc(100vw-24px))] ${isClosing ? "pointer-events-none translate-x-full opacity-0" : "translate-x-0 opacity-100"}`}
        >
          <header className="flex min-h-[68px] shrink-0 items-center gap-3 bg-slate-950 px-3.5 py-3 text-white sm:min-h-[76px] sm:px-5">
            <span className="flex h-8 w-[58px] shrink-0 items-center justify-start">
              <MobilesXLogo title="" aria-hidden="true" className="h-7 w-[58px] object-contain" />
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
            className="mx-assistant-messages min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain bg-gradient-to-b from-slate-50 via-[#f6f8fc] to-white p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:p-5"
          >
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="flex max-w-[86%] flex-col items-end gap-1">
                      <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-3 text-sm leading-5 text-white shadow-[0_3px_10px_rgba(29,78,216,0.18)]">
                        {message.content}
                      </div>
                      <MessageTimestamp createdAt={message.createdAt} isUser />
                    </div>
                  </div>
                );
              }

              const comparison = Array.isArray(message.comparison)
                ? message.comparison.filter(Boolean).slice(0, 2)
                : [];
              const hasComparison = comparison.length === 2;

              return (
                <div key={message.id} className="flex items-start gap-2.5 sm:gap-3">
                  <AgentAvatar />
                  <div className="min-w-0 max-w-[calc(100%-2.75rem)] flex-1 space-y-2.5">
                    {hasComparison ? (
                      <ProductComparisonCard
                        comparison={comparison}
                        message={message}
                        onCompare={() => handleCompareProducts(comparison)}
                        onMore={() => handleSuggestion("Show more options")}
                        onViewProduct={handleProductNavigation}
                        isSending={isSending}
                      />
                    ) : (
                      <>
                        <p className="ml-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          MobilesX Assistant
                        </p>
                        <div className="inline-block max-w-full rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-3 text-sm leading-[1.55] text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:px-4">
                          {message.title ? (
                            <p className="mb-1.5 font-bold text-slate-900">{message.title}</p>
                          ) : null}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {Array.isArray(message.items) && message.items.slice(0, 2).map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAsk={(item) => sendMessage(`Tell me about ${item.name}`, item.id)}
                            onViewProduct={handleProductNavigation}
                          />
                        ))}
                        {Array.isArray(message.suggestions) && message.suggestions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleSuggestion(suggestion)}
                                disabled={isSending}
                                className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-800 transition hover:bg-blue-50 disabled:opacity-50"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </>
                    )}
                    <MessageTimestamp createdAt={message.createdAt} />
                  </div>
                </div>
              );
            })}
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

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
            <div className="flex min-h-[54px] items-end gap-2 rounded-full border border-slate-300 bg-white p-1.5 shadow-[0_3px_12px_rgba(15,23,42,0.04)] transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
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
                className="max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-base leading-5 text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label="Send message"
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <IoSend size={17} />
              </button>
            </div>
          </form>
        </section>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open MobilesX Assistant chat"
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_10px_28px_rgba(37,99,235,0.4)] transition hover:scale-105 hover:from-blue-700 hover:to-blue-600 sm:h-16 sm:w-16 sm:border-0 sm:shadow-lg"
        >
          <IoChatbubbleEllipsesOutline className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default AiChat;
