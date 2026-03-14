import { Button } from "../ui/button";

type FormHeaderActionsProps = {
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  saveDisabled?: boolean;
  isPending?: boolean;
  formId?: string;
  className?: string;
};

export default function FormHeaderActions({
  cancelLabel,
  saveLabel,
  onCancel,
  saveDisabled,
  isPending,
  formId,
  className = "",
}: FormHeaderActionsProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <Button type="button" variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="submit" form={formId} disabled={saveDisabled}>
        {isPending ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : null}
        {saveLabel}
      </Button>
    </div>
  );
}
