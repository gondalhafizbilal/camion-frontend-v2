"use client";

import Cookies from "js-cookie";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTranslations } from "next-intl";
import { API_ENDPOINTS } from "@/services/api/api";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
};

type ChatSession = {
  id: string;
  createdAt: number | null;
};

type ChatCategory = "general" | "support" | "technical" | "faq";

type ChatbotVariant = "floating" | "panel";

type ChatbotWidgetProps = {
  variant?: ChatbotVariant;
};

type JwtPayload = {
  sub?: string;
  userId?: string;
  id?: string;
};

function uid(): string {
  return `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function decodeJwtPayload(token: string | undefined): JwtPayload | null {
  try {
    const part = token?.split(".")?.[1];
    if (!part) return null;

    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);

    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/* 🔴 YOUR LOGO (INLINE SVG) */
function CamionLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 200 140"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g transform="translate(-30,0)">
        <path
          fill="#cb272e"
          d="M198.39,78.82c0-10.28.03-20.57-.02-30.85-.02-3.67-.39-7.31-1.36-10.87-2.11-7.75-6.68-13.21-14.41-15.82-4.84-1.63-9.86-2.2-14.93-2.29-7.87-.14-15.75-.2-23.62-.2-12.9.01-25.79.06-38.69.18-5.24.05-10.42.67-15.46,2.25-7.88,2.47-12.88,7.6-14.87,15.66-1.06,4.32-1.41,8.71-1.42,13.13-.05,17.31-.03,34.62-.04,51.93,0,5.67-.11,11.34.87,16.96.87,4.99,2.57,9.62,6.03,13.45,3.2,3.54,7.36,5.34,11.86,6.51,5.63,1.47,11.4,1.68,17.17,1.77,6.79.1,13.58.07,20.36.04,12.22-.05,24.44-.05,36.65-.24,5.19-.08,10.35-.7,15.35-2.3,7.05-2.26,11.96-6.71,14.38-13.8,1.7-4.99,2.1-10.16,2.14-15.36.08-10.05.02-20.09.02-30.14ZM175.01,107.72c-3.9,3.7-8.46,6.34-13.48,8.17-10.87,3.97-22.03,4.65-33.39,2.77-6.62-1.1-12.78-3.39-18.29-7.25-6.52-4.57-10.99-10.71-13.54-18.23-3.6-10.61-3.52-21.23.5-31.69,2.66-6.91,7.17-12.49,13.25-16.75,7.54-5.29,16.03-7.99,25.08-9.1,8.47-1.04,16.87-.67,25.1,1.8,3.78,1.14,7.42,2.61,10.69,4.89,3.43,2.39,4.17,4.86,2.55,8.69-.35.84-.81,1.64-1.3,2.41-1.37,2.18-3.13,3.99-5.16,5.63-1.25-1.53-2.38-3.06-3.67-4.44-3.6-3.85-8.13-6.07-13.25-7.05-6.2-1.18-12.29-.85-18.17,1.65-6.56,2.78-11.01,7.64-13.42,14.24-3.06,8.37-3.22,16.93-.38,25.36,3.18,9.47,9.97,14.88,19.85,16.28,9.4,1.33,18.21-.69,26.53-5.08,1.52-.8,2.93-1.84,4.38-2.77.42-.27.82-.57,1.34-.93.65,1.27,1.24,2.44,1.84,3.61,1.07,2.08,2.11,4.18,3.22,6.24.35.66.27,1.04-.27,1.56Z"
        />
      </g>
    </svg>
  );
}

function CamionLogoSolid({ size = 46 }: { size?: number }) {
  const pathRef = useRef<SVGPathElement | null>(null);

  const CENTER = 50;
  const TARGET_SIZE = 62;

  const [tf, setTf] = useState({ scale: 1, tx: 0, ty: 0 });

  useLayoutEffect(() => {
    if (!pathRef.current) return;

    const bbox = pathRef.current.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const s = Math.min(TARGET_SIZE / bbox.width, TARGET_SIZE / bbox.height);
    const tx = CENTER / s - cx;
    const ty = CENTER / s - cy;

    setTf({ scale: s, tx, ty });
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx="50" cy="50" r="48" fill="#cb272e" />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
      />
      <g transform={`scale(${tf.scale}) translate(${tf.tx} ${tf.ty})`}>
        <path
          ref={pathRef}
          fill="#ffffff"
          d="M175.01,107.72c-3.9,3.7-8.46,6.34-13.48,8.17-10.87,3.97-22.03,4.65-33.39,2.77-6.62-1.1-12.78-3.39-18.29-7.25-6.52-4.57-10.99-10.71-13.54-18.23-3.6-10.61-3.52-21.23.5-31.69,2.66-6.91,7.17-12.49,13.25-16.75,7.54-5.29,16.03-7.99,25.08-9.1,8.47-1.04,16.87-.67,25.1,1.8,3.78,1.14,7.42,2.61,10.69,4.89,3.43,2.39,4.17,4.86,2.55,8.69-.35.84-.81,1.64-1.3,2.41-1.37,2.18-3.13,3.99-5.16,5.63-1.25-1.53-2.38-3.06-3.67-4.44-3.6-3.85-8.13-6.07-13.25-7.05-6.2-1.18-12.29-.85-18.17,1.65-6.56,2.78-11.01,7.64-13.42,14.24-3.06,8.37-3.22,16.93-.38,25.36,3.18,9.47,9.97,14.88,19.85,16.28,9.4,1.33,18.21-.69,26.53-5.08,1.52-.8,2.93-1.84,4.38-2.77.42-.27.82-.57,1.34-.93.65,1.27,1.24,2.44,1.84,3.61,1.07,2.08,2.11,4.18,3.22,6.24.35.66.27,1.04-.27,1.56Z"
        />
      </g>
    </svg>
  );
}

const BRAND_RED = "#cb272e";
const SOFT_BG = "#ffffff";
const PANEL_BG = "#ffffff";

function helloMessage(isRTL: boolean, isPanel = false): ChatMessage {
  const text = isPanel
    ? isRTL
      ? "مرحبًا!\n\nيمكنك اختيار الموضوع الذي نقدر نساعدك فيه؟ طلباتي، الإرجاع والاسترداد، المدفوعات."
      : "Hello!\n\nCould you please select the topic that I can assist you with? My Orders Returns & Refunds Payments"
    : isRTL
      ? "مرحبًا 👋 كيف يمكنني مساعدتك اليوم؟"
      : "Hi 👋 How can I help you today?";
  return {
    id: uid(),
    role: "assistant",
    text,
    createdAt: Date.now(),
  };
}

function normalizeHistoryToMessages(
  raw: unknown,
  isRTL: boolean,
  isPanel = false,
): ChatMessage[] {
  const fallback = [helloMessage(isRTL, isPanel)];
  if (!raw) return fallback;

  const r = raw as { messages?: unknown[] };
  const arr = Array.isArray(r?.messages)
    ? r.messages
    : Array.isArray(raw)
      ? (raw as unknown[])
      : [];

  const mapped = arr
    .map((m): ChatMessage | null => {
      const row = m as {
        role?: string;
        content?: unknown;
        text?: unknown;
        timestamp?: string | number | Date;
      };
      const role = row?.role;
      const text = row?.content ?? row?.text ?? "";
      if (!role || !text) return null;
      return {
        id: uid(),
        role: role === "assistant" ? "assistant" : "user",
        text: String(text),
        createdAt: row?.timestamp ? new Date(row.timestamp).getTime() : Date.now(),
      };
    })
    .filter((m): m is ChatMessage => m != null);

  return mapped.length ? mapped : fallback;
}

function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Create-session and list payloads may use `sessionUUID` or `sessionId`. */
function sessionIdFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  return firstString(o.sessionUUID, o.sessionId, o.id);
}

function normalizeSessions(raw: unknown): ChatSession[] {
  if (!raw) return [];
  const r = raw as { sessions?: unknown[] };
  const arr = Array.isArray(raw)
    ? (raw as unknown[])
    : Array.isArray(r?.sessions)
      ? r.sessions
      : [];
  return arr
    .map((s): ChatSession | null => {
      if (typeof s === "string") {
        const id = s.trim();
        return id ? { id, createdAt: null } : null;
      }
      const row = s as {
        sessionUUID?: string;
        sessionId?: string;
        id?: string;
        createdAt?: string | number | Date;
        timestamp?: string | number | Date;
        created_at?: string | number | Date;
        date?: string | number | Date;
      };
      const id = firstString(row.sessionUUID, row.sessionId, row.id);
      if (!id) return null;
      const createdAt =
        row?.createdAt || row?.timestamp || row?.created_at || row?.date || null;
      return {
        id,
        createdAt: createdAt ? new Date(createdAt).getTime() : null,
      };
    })
    .filter((s): s is ChatSession => s != null);
}

function formatSessionLabel(s: ChatSession, isRTL: boolean) {
  if (!s?.createdAt) return isRTL ? "محادثة" : "Chat";
  const d = new Date(s.createdAt);
  return d.toLocaleString(isRTL ? "ar" : "en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PanelBotMetaIcon() {
  return (
    <svg
      width={13}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8.5z"
        stroke="#CB262E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PanelChatMessage({
  message: m,
  isRTL,
}: {
  message: ChatMessage;
  isRTL: boolean;
}) {
  const timeLabel =
    m?.createdAt != null
      ? new Date(m.createdAt).toLocaleTimeString(isRTL ? "ar" : "en", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const bubbleBase = {
    background: "#FFFFFF",
    border: "0.854677px solid #E3E3E3",
    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 14,
    lineHeight: "140%",
    color: "#667085",
  };

  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end w-full mb-5">
        <span
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 10.2561,
            lineHeight: "26px",
            color: "#667085",
          }}
        >
          {isRTL ? "زائر" : "Visitor"} {timeLabel}
        </span>
        <div
          className="mt-1 box-border px-3 py-2 rounded-[5px] max-w-[85%] whitespace-pre-line text-end"
          style={{
            background: "#CB262E",
            border: "0.854677px solid #E3E3E3",
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "140%",
            color: "#FFFFFF",
          }}
        >
          {m.text}
        </div>
        <span
          className="mt-1"
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 10.2561,
            lineHeight: "26px",
            color: "#667085",
          }}
        >
          {isRTL ? "مقروء" : "Read"}
        </span>
      </div>
    );
  }

  const raw = String(m.text || "");
  const parts = raw.split(/\n\n/);
  const head = (parts[0] || "").trim();
  const tail = parts.slice(1).join("\n\n").trim();

  return (
    <div className="flex flex-col items-start w-full mb-5">
      <div className="flex flex-row items-center gap-2 mb-2">
        <div
          className="flex items-center justify-center rounded-full box-border flex-shrink-0"
          style={{
            width: 24.62,
            height: 23.93,
            background: "#FFFFFF",
            border: "0.854677px solid #E3E3E3",
          }}
        >
          <PanelBotMetaIcon />
        </div>
        <span
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 10.2561,
            lineHeight: "26px",
            color: "#667085",
          }}
        >
          {isRTL ? "المحادثة" : "Chatbot"} {timeLabel}
        </span>
      </div>
      {!tail ? (
        <div className="max-w-[min(100%,252px)] ms-8">
          <div
            className="box-border px-4 py-3 rounded-[5px] whitespace-pre-line"
            style={bubbleBase}
          >
            {head}
          </div>
        </div>
      ) : (
        <>
          {head ? (
            <div className="mb-2 ms-8">
              <div
                className="inline-flex items-center box-border px-3 py-1.5 rounded-[5px]"
                style={bubbleBase}
              >
                {head}
              </div>
            </div>
          ) : null}
          <div className="max-w-[min(100%,252px)] ms-8">
            <div
              className="box-border px-4 py-3 rounded-[5px] whitespace-pre-line"
              style={bubbleBase}
            >
              {tail}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ChatbotWidget({ variant = "floating" }: ChatbotWidgetProps) {
  const params = useParams();
  const rawLocale = params?.locale;
  const locale = (
    typeof rawLocale === "string"
      ? rawLocale
      : Array.isArray(rawLocale)
        ? rawLocale[0]
        : "en"
  ).toLowerCase();
  const isRTL = locale.startsWith("ar");
  const sideClass = isRTL ? "left-5" : "right-5";

  const token = Cookies.get("token");

  const unreadKey = useMemo(() => `camion_chat_unread_v1_${locale}`, [locale]);
  const sessionKey = useMemo(() => `camion_chat_session_v1_${locale}`, [locale]);
  const guestKey = useMemo(() => `camion_chat_guest_v1`, []);
  const categoryKey = useMemo(() => `camion_chat_category_v1_${locale}`, [locale]);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const creatingSessionRef = useRef(false);
  const panelInitRef = useRef(false);

  const [category, setCategory] = useState<ChatCategory>("general");
  const [hideCategory, setHideCategory] = useState(false);

  const loadedHistoryForRef = useRef<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [clearing, setClearing] = useState(false);

  // Recent chats
  const [showRecent, setShowRecent] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const isPanel = variant === "panel";
  const [messages, setMessages] = useState(() => [helloMessage(isRTL, isPanel)]);
  const effectiveOpen = isPanel ? true : open;

  const listRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const categoryItems = useMemo<Array<{ key: ChatCategory; label: string }>>(
    () => [
      { key: "general", label: isRTL ? "عام" : "General" },
      { key: "support", label: isRTL ? "الدعم" : "Support" },
      { key: "technical", label: isRTL ? "تقني" : "Technical" },
      { key: "faq", label: isRTL ? "الأسئلة" : "FAQ" },
    ],
    [isRTL],
  );

  const suggestedQuestions = useMemo(() => {
    return isRTL
      ? ["ما هي سياسة الاسترجاع؟", "كم يستغرق توصيل الطلب؟"]
      : ["What is the return policy?", "How long does delivery take?"];
  }, [isRTL]);

  const panelPromptChips = useMemo(
    () =>
      isRTL
        ? ["طلباتي", "الإرجاع والاسترداد", "المدفوعات", "تتبع الطلب"]
        : ["My Orders", "Returns & Refunds", "Payments", "Track order"],
    [isRTL],
  );

  const t = useTranslations();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedUnread = window.localStorage.getItem(unreadKey);
      const savedSession = window.localStorage.getItem(sessionKey);
      const savedCategory = window.localStorage.getItem(categoryKey);

      if (savedUnread) {
        const n = Number(savedUnread);
        if (Number.isFinite(n) && n >= 0) setUnread(n);
      }
      if (savedSession) {
        if (savedSession === "[object Object]" || /\[object/i.test(savedSession)) {
          window.localStorage.removeItem(sessionKey);
        } else {
          setSessionId(savedSession);
        }
      }
      if (
        savedCategory &&
        ["support", "technical", "general", "faq"].includes(savedCategory)
      ) {
        setCategory(savedCategory as ChatCategory);
      }
    } catch {}
  }, [unreadKey, sessionKey, categoryKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(unreadKey, String(unread));
    } catch {}
  }, [unread, unreadKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionId) window.localStorage.setItem(sessionKey, String(sessionId));
      else window.localStorage.removeItem(sessionKey);
    } catch {}
  }, [sessionId, sessionKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(categoryKey, String(category));
    } catch {}
  }, [category, categoryKey]);

  useEffect(() => {
    const hasUserMsg = messages.some((m) => m.role === "user");
    setHideCategory(hasUserMsg);
  }, [messages]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open, minimized, loadingHistory, showRecent, isPanel]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const close = () => {
    setOpen(false);
    setMinimized(false);
    setShowRecent(false);
  };

  const getChatUserId = () => {
    if (typeof window === "undefined") return "guest_server";

    if (token) {
      const payload = decodeJwtPayload(token);
      const id = payload?.sub || payload?.userId || payload?.id;
      if (id) return String(id);
    }

    let gid = window.localStorage.getItem(guestKey);
    if (!gid) {
      gid = `guest_${uid()}`;
      window.localStorage.setItem(guestKey, gid);
    }
    return gid;
  };

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    if (creatingSessionRef.current) return null;

    creatingSessionRef.current = true;
    try {
      const userId = getChatUserId();

      const res = await fetch(API_ENDPOINTS.CHATBOT_CREATE_SESSION, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(token ? { token } : { userId }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const sid = sessionIdFromPayload(data);
      if (sid) setSessionId(sid);
      return sid;
    } catch (e) {
      console.error("Create session failed:", e);
      return null;
    } finally {
      creatingSessionRef.current = false;
    }
  };

  useEffect(() => {
    if (!isPanel) return;
    if (panelInitRef.current) return;
    panelInitRef.current = true;

    (async () => {
      const sid = sessionId || (await ensureSession());
      if (sid) await loadSessionHistory(sid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanel]);

  const loadSessionHistory = async (sid: string) => {
    if (!sid) return;
    if (loadedHistoryForRef.current === sid) return;

    loadedHistoryForRef.current = sid;
    setLoadingHistory(true);
    try {
      const res = await fetch(API_ENDPOINTS.CHATBOT_SESSION_HISTORY(sid), {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      setMessages(normalizeHistoryToMessages(data, isRTL, isPanel));
    } catch (e) {
      console.error("Load history failed:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSessionsList = async () => {
    setLoadingSessions(true);
    try {
      const userId = getChatUserId();
      const res = await fetch(API_ENDPOINTS.CHATBOT_LIST_SESSIONS(userId), {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        setSessions([]);
        return;
      }

      const data = await res.json();
      const list = normalizeSessions(data);

      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSessions(list);
    } catch (e) {
      console.error("Load sessions failed:", e);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleOpen = async () => {
    const sid = sessionId || (await ensureSession());
    if (sid) await loadSessionHistory(sid);
    setOpen(true);
    setMinimized(false);
  };

  const toggleOpen = () => {
    if (open) {
      close();
      return;
    }
    handleOpen();
  };

  const toggleMin = () => setMinimized((v) => !v);

  const bumpUnreadIfClosed = () => {
    if (!open) setUnread((n) => n + 1);
  };

  const pushUserMessage = (text: string) => {
    setMessages((p) => [...p, { id: uid(), role: "user", text, createdAt: Date.now() }]);
  };

  const sendMessage = async (forcedText?: string) => {
    const text = (forcedText ?? input).trim();
    if (!text || sending || clearing) return;

    setShowRecent(false);

    pushUserMessage(text);
    setInput("");

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const controller = abortRef.current;

    const fallback = isRTL
      ? "شكرًا! سيتم الرد عليك قريبًا من فريق الدعم."
      : "Thanks! Our support team will get back to you shortly.";

    const assistantId = uid();
    setMessages((p) => [
      ...p,
      { id: assistantId, role: "assistant", text: "", createdAt: Date.now() },
    ]);

    try {
      setSending(true);

      const sid = sessionId || (await ensureSession());
      if (!sid) {
        const finalText = fallback;
        setMessages((p) =>
          p.map((m) => (m.id === assistantId ? { ...m, text: finalText } : m)),
        );
        bumpUnreadIfClosed();
        return;
      }

      const userId = getChatUserId();
      const res = await fetch(API_ENDPOINTS.CHATBOT_ASK_IN_SESSION(sid), {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          token ? { token, question: text } : { userId, question: text },
        ),
      });

      if (!res.ok) {
        const finalText = fallback;
        setMessages((p) =>
          p.map((m) => (m.id === assistantId ? { ...m, text: finalText } : m)),
        );
        bumpUnreadIfClosed();
        return;
      }

      const data = await res.json();
      const answer = String(data?.answer || fallback).trim();

      const finalText = answer;
      setMessages((p) =>
        p.map((m) => (m.id === assistantId ? { ...m, text: finalText } : m)),
      );
      bumpUnreadIfClosed();
    } catch (err: unknown) {
      if (controller.signal.aborted) return;

      const finalText = isRTL
        ? "شكرًا! سيتم الرد عليك قريبًا من فريق الدعم."
        : "Thanks! Our support team will get back to you shortly.";

      setMessages((p) =>
        p.map((m) => (m.id === assistantId ? { ...m, text: finalText } : m)),
      );
      bumpUnreadIfClosed();

      if (err instanceof Error && err.name !== "AbortError")
        console.error("Chat error:", err);
    } finally {
      if (!controller.signal.aborted) setSending(false);
    }
  };

  const clearChat = async () => {
    if (clearing) return;
    setClearing(true);

    abortRef.current?.abort();

    const oldSid = sessionId;

    setMessages([helloMessage(isRTL, isPanel)]);
    setUnread(0);

    try {
      if (oldSid) {
        await fetch(API_ENDPOINTS.CHATBOT_DELETE_SESSION(oldSid), {
          method: "DELETE",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });
      }
    } catch (e) {
      console.error("Delete session failed:", e);
    } finally {
      loadedHistoryForRef.current = null;
      setSessionId(null);

      if (open || isPanel) {
        const newSid = await ensureSession();
        if (newSid) await loadSessionHistory(newSid);
      }

      if (showRecent) await loadSessionsList();

      setClearing(false);
    }
  };

  const openRecentChats = async () => {
    setShowRecent((v) => !v);
    if (!showRecent) await loadSessionsList();
  };

  const switchToSession = async (sid: string) => {
    if (!sid || sid === sessionId) {
      setShowRecent(false);
      return;
    }
    loadedHistoryForRef.current = null;
    setSessionId(sid);
    setShowRecent(false);
    await loadSessionHistory(sid);
  };

  const WindowHeader = () => (
    <div className="px-4 pt-3 pb-2" style={{ backgroundColor: SOFT_BG }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CamionLogo size={34} />
          <div className="min-w-0 leading-tight">
            <div className="font-semibold text-sm truncate">{t("camionSupport")}</div>
            <div className="text-xs text-gray-600 truncate">
              {isRTL ? "يسعدنا مساعدتك" : "We’re here to help"}
            </div>
          </div>
        </div>

        {!isPanel && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleMin}
              className="h-8 w-8 rounded-lg hover:bg-black/5"
              title="Minimize"
            >
              —
            </button>
            <button
              onClick={close}
              className="h-8 w-8 rounded-lg hover:bg-black/5"
              title="Close"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={openRecentChats}
          className="h-8 px-3 rounded-lg border text-xs bg-white hover:bg-black/5"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
          title={isRTL ? "المحادثات الأخيرة" : "Recent chats"}
          disabled={sending || clearing}
        >
          {isRTL ? "المحادثات" : "Chats"}
        </button>

        {!hideCategory && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ChatCategory)}
            className="h-8 text-xs rounded-lg border bg-white px-2 outline-none"
            style={{ borderColor: "rgba(0,0,0,0.12)" }}
            aria-label="Category"
            disabled={sending || clearing}
          >
            {categoryItems.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={clearChat}
          disabled={clearing}
          className="h-8 px-3 rounded-lg border text-xs bg-white hover:bg-black/5 disabled:opacity-60"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
          title={isRTL ? "مسح المحادثة" : "Clear chat"}
        >
          {clearing ? "..." : isRTL ? "مسح" : "Clear"}
        </button>
      </div>

      <AnimatePresence>
        {showRecent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="mt-3 overflow-hidden"
          >
            <div
              className="rounded-xl border bg-white p-2"
              style={{ borderColor: "rgba(0,0,0,0.10)" }}
            >
              <div className="flex items-center justify-between px-2 py-1">
                <div className="text-xs font-semibold text-gray-800">
                  {isRTL ? "المحادثات الأخيرة" : "Recent chats"}
                </div>
                <button
                  onClick={loadSessionsList}
                  className="text-xs text-gray-600 hover:text-gray-900"
                  disabled={loadingSessions}
                  title={isRTL ? "تحديث" : "Refresh"}
                >
                  {loadingSessions ? "..." : isRTL ? "تحديث" : "Refresh"}
                </button>
              </div>

              <div className="max-h-[160px] overflow-y-auto px-1">
                {loadingSessions && (
                  <div className="text-xs text-gray-500 px-2 py-2">
                    {isRTL ? "جارٍ التحميل..." : "Loading..."}
                  </div>
                )}

                {!loadingSessions && sessions.length === 0 && (
                  <div className="text-xs text-gray-500 px-2 py-2">
                    {isRTL ? "لا توجد محادثات بعد" : "No chats yet"}
                  </div>
                )}

                {!loadingSessions &&
                  sessions.map((s) => {
                    const active = s.id === sessionId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => switchToSession(s.id)}
                        className="w-full text-left px-2 py-2 rounded-lg border mb-2 last:mb-0 hover:bg-black/5"
                        style={{
                          borderColor: active
                            ? "rgba(203,39,46,0.45)"
                            : "rgba(0,0,0,0.08)",
                          backgroundColor: active
                            ? "rgba(203,39,46,0.06)"
                            : "transparent",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-gray-800 truncate">
                            {formatSessionLabel(s, isRTL)}
                          </div>
                          {active && (
                            <span
                              className="text-[10px] font-bold px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: "rgba(203,39,46,0.14)",
                                color: BRAND_RED,
                              }}
                            >
                              {isRTL ? "نشط" : "Active"}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate mt-1">
                          {s.id}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const WindowBody = () =>
    minimized && !isPanel ? (
      <button
        onClick={toggleMin}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: PANEL_BG }}
      >
        <span className="text-sm font-semibold text-gray-900">Camion Chat</span>
        <span className="text-xs text-gray-600">
          {isRTL ? "اضغط للتوسيع" : "Tap to expand"}
        </span>
      </button>
    ) : (
      <>
        <div
          ref={listRef}
          className={
            isPanel
              ? "flex-1 overflow-y-auto px-4 py-3 space-y-3"
              : "max-h-[360px] overflow-y-auto px-4 py-3 space-y-3"
          }
        >
          {loadingHistory && (
            <div className="text-xs text-gray-500">
              {isRTL ? "جارٍ تحميل المحادثة..." : "Loading chat..."}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[78%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line"
                style={{
                  backgroundColor: m.role === "user" ? BRAND_RED : "rgba(0,0,0,0.06)",
                  color: m.role === "user" ? "#fff" : "#111",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="text-xs text-gray-500">{isRTL ? "يكتب…" : "Typing…"}</div>
          )}
        </div>

        <div className="px-3 pb-2">
          <div
            className="flex gap-2 overflow-x-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={sending || clearing}
                className="shrink-0 text-xs px-3 py-2 rounded-full border hover:bg-black/5 disabled:opacity-50"
                style={{
                  borderColor: "rgba(0,0,0,0.10)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t px-3 py-2 flex gap-2 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={isRTL ? "اكتب رسالتك…" : "Type your message…"}
            className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
            style={{ borderColor: "rgba(0,0,0,0.12)" }}
            disabled={clearing}
          />

          <button
            onClick={() => sendMessage()}
            disabled={sending || clearing}
            className="px-4 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: BRAND_RED }}
          >
            {isRTL ? "إرسال" : "Send"}
          </button>
        </div>
      </>
    );

  const ChatWindow = ({
    className,
    style,
  }: {
    className?: string;
    style?: CSSProperties;
  }) => (
    <div className={className} style={style}>
      <WindowHeader />
      <WindowBody />
    </div>
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={isPanel ? "w-full" : `fixed ${sideClass} bottom-5 z-[9999]`}
    >
      {isPanel && (
        <div className="w-full flex justify-center lg:justify-start">
          <div
            className="flex flex-col w-full box-border"
            style={{
              maxWidth: 870,
              minHeight: 610,
              background: "#FFFFFF",
              boxShadow: "0px 1px 13px rgba(0, 0, 0, 0.05)",
              borderRadius: 4,
              padding: "40px clamp(20px, 5vw, 80px) 16px",
              boxSizing: "border-box",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div
                style={{
                  fontFamily:
                    "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 20,
                  lineHeight: "28px",
                  color: "#DB4444",
                }}
              >
                {t("camionChatbot") || "Camion Chatbot"}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={openRecentChats}
                  disabled={sending || clearing}
                  className="h-8 px-3 rounded-md border text-xs bg-white hover:bg-black/5 disabled:opacity-50"
                  style={{
                    borderColor: "rgba(0,0,0,0.15)",
                    fontFamily:
                      "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {isRTL ? "المحادثات" : "Chats"}
                </button>
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={clearing}
                  className="h-8 px-3 rounded-md border text-xs bg-white hover:bg-black/5 disabled:opacity-50"
                  style={{
                    borderColor: "rgba(0,0,0,0.15)",
                    fontFamily:
                      "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {clearing ? "..." : isRTL ? "مسح" : "Clear"}
                </button>
              </div>
            </div>

            {!hideCategory && (
              <div
                className="mt-3 flex flex-row items-start gap-1.5 overflow-x-auto pb-1"
                style={{ WebkitOverflowScrolling: "touch", maxWidth: "100%" }}
              >
                {categoryItems.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      disabled={sending || clearing}
                      className="flex flex-row justify-center items-center gap-1 shrink-0 box-border disabled:opacity-50"
                      style={{
                        height: 30,
                        padding: "6px 12px",
                        background: "#FFFFFF",
                        border: `1px solid ${active ? "rgba(203, 38, 46, 0.55)" : "rgba(0, 0, 0, 0.15)"}`,
                        borderRadius: 5,
                        fontFamily:
                          "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: "24px",
                        textTransform: "capitalize",
                        color: "#000000",
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence>
              {showRecent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="mt-3 overflow-hidden w-full mx-auto"
                  style={{ maxWidth: 710 }}
                >
                  <div
                    className="rounded-xl border bg-white p-2"
                    style={{ borderColor: "rgba(0,0,0,0.10)" }}
                  >
                    <div className="flex items-center justify-between px-2 py-1">
                      <div className="text-xs font-semibold text-gray-800">
                        {isRTL ? "المحادثات الأخيرة" : "Recent chats"}
                      </div>
                      <button
                        type="button"
                        onClick={loadSessionsList}
                        className="text-xs text-gray-600 hover:text-gray-900"
                        disabled={loadingSessions}
                      >
                        {loadingSessions ? "..." : isRTL ? "تحديث" : "Refresh"}
                      </button>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto px-1">
                      {loadingSessions && (
                        <div className="text-xs text-gray-500 px-2 py-2">
                          {isRTL ? "جارٍ التحميل..." : "Loading..."}
                        </div>
                      )}
                      {!loadingSessions && sessions.length === 0 && (
                        <div className="text-xs text-gray-500 px-2 py-2">
                          {isRTL ? "لا توجد محادثات بعد" : "No chats yet"}
                        </div>
                      )}
                      {!loadingSessions &&
                        sessions.map((s) => {
                          const active = s.id === sessionId;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => switchToSession(s.id)}
                              className="w-full text-left px-2 py-2 rounded-lg border mb-2 last:mb-0 hover:bg-black/5"
                              style={{
                                borderColor: active
                                  ? "rgba(203,39,46,0.45)"
                                  : "rgba(0,0,0,0.08)",
                                backgroundColor: active
                                  ? "rgba(203,39,46,0.06)"
                                  : "transparent",
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-semibold text-gray-800 truncate">
                                  {formatSessionLabel(s, isRTL)}
                                </div>
                                {active && (
                                  <span
                                    className="text-[10px] font-bold px-2 py-1 rounded-full"
                                    style={{
                                      backgroundColor: "rgba(203,39,46,0.14)",
                                      color: BRAND_RED,
                                    }}
                                  >
                                    {isRTL ? "نشط" : "Active"}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 truncate mt-1">
                                {s.id}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={listRef}
              className="mt-4 flex flex-col w-full mx-auto overflow-y-auto flex-1 min-h-0"
              style={{ maxWidth: 710, minHeight: 220, maxHeight: 310 }}
            >
              {loadingHistory && (
                <div
                  className="text-xs text-gray-500 px-1"
                  style={{
                    fontFamily:
                      "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {isRTL ? "جارٍ تحميل المحادثة..." : "Loading chat..."}
                </div>
              )}
              {messages.map((m) => (
                <PanelChatMessage key={m.id} message={m} isRTL={isRTL} />
              ))}
              {sending && (
                <div
                  className="text-xs text-gray-500 px-1"
                  style={{
                    fontFamily:
                      "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {isRTL ? "يكتب…" : "Typing…"}
                </div>
              )}
            </div>

            <div
              className="mt-4 flex flex-row items-start gap-1.5 overflow-x-auto w-full mx-auto pb-1"
              style={{ maxWidth: 618, WebkitOverflowScrolling: "touch" }}
            >
              {panelPromptChips.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => sendMessage(label)}
                  disabled={sending || clearing}
                  className="shrink-0 flex flex-col justify-center items-start rounded-[14px] box-border disabled:opacity-50 hover:opacity-90"
                  style={{
                    width: 150,
                    height: 40,
                    padding: "13px 16px",
                    background: i === 0 ? "#F6F6F6" : "#FFFFFF",
                    border: i === 0 ? "none" : "1px solid #E4E4E4",
                    fontFamily:
                      "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                    fontSize: 14,
                    lineHeight: "21px",
                    letterSpacing: "-0.4px",
                    color: "#000000",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className="mt-4 w-full mx-auto flex flex-row items-center box-border bg-white"
              style={{
                maxWidth: 710,
                height: 60,
                border: "0.854677px solid #E3E3E3",
                paddingLeft: 18,
                paddingRight: 12,
                gap: 8,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("writeMessagePlaceholder")}
                className="flex-1 min-w-0 border-0 outline-none bg-transparent placeholder:text-[#667085]"
                style={{
                  fontFamily:
                    "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: "26px",
                  color: "#111827",
                }}
                disabled={clearing}
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={sending || clearing}
                  className="p-1 rounded hover:bg-black/5 text-[#667085] disabled:opacity-40"
                  aria-label={isRTL ? "إرسال" : "Send"}
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                    style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
                  >
                    <path
                      d="M17.5842 7.96849L1.46083 0.102657C1.30589 0.0271512 1.13428 -0.00768766 0.962162 0.00141903C0.790041 0.0105257 0.623068 0.0632785 0.476957 0.154712C0.330846 0.246146 0.210403 0.373254 0.126964 0.524073C0.0435243 0.674892 -0.000167467 0.844462 4.82369e-07 1.01682V1.04599C8.30077e-05 1.18225 0.016875 1.31798 0.0500004 1.45016L1.59667 7.63682C1.6174 7.71924 1.66284 7.79334 1.72689 7.8492C1.79093 7.90506 1.87053 7.93999 1.955 7.94932L8.7525 8.70516C8.8656 8.71876 8.96979 8.77333 9.04538 8.85856C9.12097 8.94378 9.16271 9.05374 9.16271 9.16766C9.16271 9.28157 9.12097 9.39154 9.04538 9.47676C8.96979 9.56198 8.8656 9.61655 8.7525 9.63016L1.955 10.386C1.87053 10.3953 1.79093 10.4303 1.72689 10.4861C1.66284 10.542 1.6174 10.6161 1.59667 10.6985L0.0500004 16.8843C0.016875 17.0165 8.30077e-05 17.1522 4.82369e-07 17.2885V17.3177C-2.60218e-05 17.49 0.043769 17.6594 0.127267 17.8101C0.210765 17.9608 0.331222 18.0878 0.477311 18.1792C0.623399 18.2705 0.790318 18.3232 0.96237 18.3322C1.13442 18.3413 1.30595 18.3065 1.46083 18.231L17.5833 10.3652C17.8079 10.2556 17.9971 10.0852 18.1295 9.87333C18.2619 9.66145 18.3321 9.41665 18.3321 9.16682C18.3321 8.917 18.2619 8.67219 18.1295 8.46032C17.9971 8.24845 17.8087 8.07803 17.5842 7.96849Z"
                      fill="#667085"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isPanel && !open && (
        <button
          onClick={toggleOpen}
          className="relative flex items-center gap-3 px-3 py-2 rounded-full shadow-lg bg-white border"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
          aria-label="Open Camion AI"
        >
          <div className="relative">
            <CamionLogoSolid size={46} />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "#111827", color: "#fff" }}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>

          <div className="flex flex-col items-start leading-tight pr-2">
            <span className="text-sm font-semibold text-gray-900">{t("chatBot")}</span>
            <span className="text-xs text-gray-500">{t("chatBotDescription")}</span>
          </div>
        </button>
      )}

      <AnimatePresence>
        {effectiveOpen && !isPanel && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mt-3 w-[92vw] max-w-[380px] rounded-2xl shadow-2xl overflow-hidden border"
            style={{
              backgroundColor: PANEL_BG,
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <ChatWindow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
