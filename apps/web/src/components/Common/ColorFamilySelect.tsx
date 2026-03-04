import AppSelect from "./AppSelect";
import {
  PRIMARY_COLOR_OPTIONS,
  type PrimaryColorFamily,
} from "../../theme/primaryColorFamilies";

interface ColorFamilySelectProps {
  value: PrimaryColorFamily;
  onChange: (value: PrimaryColorFamily) => void;
  label: string;
}

export default function ColorFamilySelect({
  value,
  onChange,
  label,
}: ColorFamilySelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <AppSelect
        value={value}
        onChange={(event) => onChange(event.target.value as PrimaryColorFamily)}
        className="px-3.5"
        aria-label={label}
      >
        {PRIMARY_COLOR_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </AppSelect>
    </div>
  );
}
