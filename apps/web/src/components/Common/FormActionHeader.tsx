import type { ReactNode } from "react";
import { Button } from "../ui/button";

type FormActionHeaderProps = {
  statusLabel?: string;
  statusControl?: ReactNode;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  isPending?: boolean;
  className?: string;
};

export default function FormActionHeader({
  statusLabel,
  statusControl,
  cancelLabel,
  saveLabel,
  onCancel,
  onSave,
  saveDisabled,
  isPending,
  className = "",
}: FormActionHeaderProps) {
  return (
    <div className={`grid grid-cols-12 gap-3 ${className}`.trim()}>
      <div className="col-span-6 min-w-0">
        {statusLabel ? <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{statusLabel}</label> : null}
        {statusControl}
      </div>
      <div className="col-span-6 mt-7 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="button" onClick={onSave} disabled={saveDisabled}>
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
