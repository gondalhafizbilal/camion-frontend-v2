export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastOptions = {
  duration?: number;
  /** @deprecated Use `duration`. Kept for react-toastify migration. */
  autoClose?: number;
  /** @deprecated Ignored; placement is controlled by the toast viewport. */
  position?: string;
  actionLabel?: string;
  onAction?: () => void;
  closable?: boolean;
  id?: string;
};

export type ToastRecord = {
  id: string;
  type: ToastVariant;
  title: string;
  description?: string;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
  closable: boolean;
};
