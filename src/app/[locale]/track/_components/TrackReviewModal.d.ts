import type { ReactElement } from "react";

export default function TrackReviewModal(props: {
  open: boolean;
  onClose: () => void;
  productUuid?: string;
}): ReactElement | null;
