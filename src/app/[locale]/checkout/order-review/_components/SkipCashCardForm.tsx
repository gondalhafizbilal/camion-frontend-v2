"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { waitForSkipCashSdk } from "@/services/skipcash/skipcashApi";

export type SkipCashCardFormHandle = {
  submit: () => void;
  isReady: () => boolean;
  destroy: () => void;
};

export type SkipCashCardFormOnComplete = (result: {
  status: "paid" | "failed";
  paymentId: string | null;
  orderId?: string | null;
  tokenId?: string | null;
}) => void;

export type SkipCashCardFormOnError = (err: Error) => void;

export type SkipCashCardFormProps = {
  sessionId: string;
  tokenizeCard: boolean;
  onComplete: SkipCashCardFormOnComplete;
  onError: SkipCashCardFormOnError;
};

const SkipCashCardForm = forwardRef<SkipCashCardFormHandle, SkipCashCardFormProps>(
  function SkipCashCardFormInner(
    { sessionId, tokenizeCard, onComplete, onError },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const controllerRef = useRef<any>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      let cancelled = false;
      setReady(false);

      const mount = async () => {
        if (!containerRef.current) return;
        const sdk = await waitForSkipCashSdk();
        if (cancelled) return;

        // Destroy any previous controller before remounting.
        try {
          controllerRef.current?.destroy?.();
        } catch {
          /* ignore */
        }
        // Default proxyMode=true: browser talks only to sdk.skipcash.com proxy.
        // proxyMode=false (legacy) calls api.skipcash.app directly and hits CORS.
        controllerRef.current = sdk.mountCardForm(containerRef.current, {
          sessionId,
          tokenizeCard,
          proxyMode: true,
          showPayButton: false, // we use our own "Place order" CTA
          onReady: () => setReady(true),
          onComplete: (result: any) => {
            const mapped = {
              status: (result?.status === "paid" ? "paid" : "failed") as
                | "paid"
                | "failed",
              paymentId: result?.paymentId ? String(result.paymentId) : null,
              orderId: result?.orderId ? String(result.orderId) : null,
              tokenId: result?.tokenId ? String(result.tokenId) : null,
            };
            onComplete(mapped);
          },
          onError: (err: any) => {
            const message = err instanceof Error ? err.message : String(err ?? "SkipCash error");
            onError(err instanceof Error ? err : new Error(message));
          },
        });
      };

      void mount();

      return () => {
        cancelled = true;
        try {
          controllerRef.current?.destroy?.();
        } catch {
          /* ignore */
        }
        controllerRef.current = null;
        setReady(false);
      };
    }, [sessionId, tokenizeCard, onComplete, onError]);

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          controllerRef.current?.submit?.();
        },
        isReady: () => {
          return Boolean(controllerRef.current?.isReady?.() || ready);
        },
        destroy: () => {
          try {
            controllerRef.current?.destroy?.();
          } catch {
            /* ignore */
          }
          controllerRef.current = null;
          setReady(false);
        },
      }),
      [ready],
    );

    return <div ref={containerRef} className="w-full" />;
  },
);

export default SkipCashCardForm;

