import { ECOMMERCE_MOTION_SPINNER_CLASS } from "@/lib/styles/ecommerceButtonMotion";

type EcommerceMotionSpinnerProps = {
  className?: string;
};

/** Compact in-button spinner — sized via parent motion variant in globals.css. */
export function EcommerceMotionSpinner({ className = "" }: EcommerceMotionSpinnerProps) {
  return (
    <span
      className={[ECOMMERCE_MOTION_SPINNER_CLASS, className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
