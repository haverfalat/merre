export interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string; description?: string }[];
  onChange: (value: string) => void;
}
