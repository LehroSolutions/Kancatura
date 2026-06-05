import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

function Switch({ checked, onChange, label, disabled = false, className }: SwitchProps) {
  return (
    <label className={cn("switch-label", disabled && "switch-disabled", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={cn("switch-track", checked && "switch-track-on")}
        onClick={() => onChange(!checked)}
      >
        <span className={cn("switch-thumb", checked && "switch-thumb-on")} />
      </button>
      {label && <span className="switch-text">{label}</span>}
    </label>
  );
}

export { Switch };
