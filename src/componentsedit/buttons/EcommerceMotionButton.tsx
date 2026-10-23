"use client";

import { Link } from "@/i18n/navigation";
import { EcommerceMotionSpinner } from "@/componentsedit/buttons/EcommerceMotionSpinner";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  MouseEvent,
  ReactElement,
  ReactNode,
} from "react";
import { useCallback, useState } from "react";
import {
  ECOMMERCE_CTA_MOTION_CLASS,
  ECOMMERCE_MOTION_CONTENT_BUSY_CLASS,
  ECOMMERCE_MOTION_CONTENT_CLASS,
  ECOMMERCE_MOTION_LOADER_CLASS,
  ECOMMERCE_MOTION_LOADING_CLASS,
  ECOMMERCE_MOTION_ROOT_CLASS,
  ECOMMERCE_MOTION_SURFACE_CLASS,
  ECOMMERCE_WISHLIST_MOTION_CLASS,
} from "@/lib/styles/ecommerceButtonMotion";

export type EcommerceMotionVariant = "cta" | "wishlist";

function motionClassFor(variant: EcommerceMotionVariant): string {
  return variant === "wishlist"
    ? ECOMMERCE_WISHLIST_MOTION_CLASS
    : ECOMMERCE_CTA_MOTION_CLASS;
}

function joinClasses(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

export type EcommerceMotionSurfaceProps = {
  className?: string;
  surfaceClassName?: string;
  children: ReactNode;
};

/** Layered motion wrapper — surface stays fixed; content swaps to spinner while busy. */
export function EcommerceMotionSurface({
  className = "",
  surfaceClassName = "",
  children,
  busy = false,
}: EcommerceMotionSurfaceProps & { busy?: boolean }) {
  return (
    <>
      <span
        className={joinClasses(ECOMMERCE_MOTION_SURFACE_CLASS, surfaceClassName)}
        aria-hidden="true"
      />
      <span
        className={joinClasses(
          ECOMMERCE_MOTION_CONTENT_CLASS,
          busy && ECOMMERCE_MOTION_CONTENT_BUSY_CLASS,
          className,
        )}
      >
        {children}
      </span>
      {busy ? (
        <span className={ECOMMERCE_MOTION_LOADER_CLASS} aria-hidden="true">
          <EcommerceMotionSpinner />
        </span>
      ) : null}
    </>
  );
}

type EcommerceMotionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  EcommerceMotionSurfaceProps & {
    variant?: EcommerceMotionVariant;
    /** Controlled loading state (e.g. custom async handlers). */
    loading?: boolean;
  };

export function EcommerceMotionButton({
  variant = "cta",
  className = "",
  surfaceClassName = "",
  children,
  type = "button",
  loading,
  disabled,
  onClick,
  ...props
}: EcommerceMotionButtonProps) {
  const [pending, setPending] = useState(false);
  const isLoading = Boolean(loading ?? pending);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) {
        event.preventDefault();
        return;
      }

      const result = onClick?.(event);
      if (isPromiseLike(result)) {
        setPending(true);
        void Promise.resolve(result).finally(() => setPending(false));
      }
    },
    [disabled, isLoading, onClick],
  );

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      data-loading={isLoading ? "" : undefined}
      aria-busy={isLoading || undefined}
      className={joinClasses(
        ECOMMERCE_MOTION_ROOT_CLASS,
        motionClassFor(variant),
        isLoading && ECOMMERCE_MOTION_LOADING_CLASS,
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <EcommerceMotionSurface surfaceClassName={surfaceClassName} busy={isLoading}>
        {children}
      </EcommerceMotionSurface>
    </button>
  );
}

type EcommerceMotionLinkProps = ComponentPropsWithoutRef<typeof Link> &
  EcommerceMotionSurfaceProps & {
    variant?: EcommerceMotionVariant;
  };

export function EcommerceMotionLink({
  variant = "cta",
  className = "",
  surfaceClassName = "",
  children,
  ...props
}: EcommerceMotionLinkProps) {
  return (
    <Link
      className={joinClasses(
        ECOMMERCE_MOTION_ROOT_CLASS,
        motionClassFor(variant),
        className,
      )}
      {...props}
    >
      <EcommerceMotionSurface surfaceClassName={surfaceClassName}>
        {children}
      </EcommerceMotionSurface>
    </Link>
  );
}

/** For custom elements (e.g. `motion.button` in RecommendedProducts). */
export function withEcommerceMotionLayers(
  children: ReactNode,
  opts?: {
    variant?: EcommerceMotionVariant;
    surfaceClassName?: string;
    contentClassName?: string;
    busy?: boolean;
  },
): ReactElement {
  const busy = Boolean(opts?.busy);
  return (
    <>
      <span
        className={joinClasses(
          ECOMMERCE_MOTION_SURFACE_CLASS,
          opts?.surfaceClassName,
        )}
        aria-hidden="true"
      />
      <span
        className={joinClasses(
          ECOMMERCE_MOTION_CONTENT_CLASS,
          busy && ECOMMERCE_MOTION_CONTENT_BUSY_CLASS,
          opts?.contentClassName,
        )}
      >
        {children}
      </span>
      {busy ? (
        <span className={ECOMMERCE_MOTION_LOADER_CLASS} aria-hidden="true">
          <EcommerceMotionSpinner />
        </span>
      ) : null}
    </>
  ) as ReactElement;
}

export function ecommerceMotionRootClass(
  variant: EcommerceMotionVariant = "cta",
  className = "",
  opts?: { busy?: boolean },
): string {
  return joinClasses(
    ECOMMERCE_MOTION_ROOT_CLASS,
    motionClassFor(variant),
    opts?.busy && ECOMMERCE_MOTION_LOADING_CLASS,
    className,
  );
}
