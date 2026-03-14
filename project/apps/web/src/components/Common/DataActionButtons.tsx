import { Button } from "../ui/button";

type DataActionButtonsProps = {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
};

export default function DataActionButtons({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: DataActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="secondary" className="w-full" onClick={onPrimary}>
        {primaryLabel}
      </Button>
      <Button variant="secondary" className="w-full" onClick={onSecondary}>
        {secondaryLabel}
      </Button>
    </div>
  );
}
