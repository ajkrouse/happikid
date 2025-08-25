import { useState, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface ChipInputProps {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (values: string[]) => void;
  maxItems?: number;
  maxCharPerItem?: number;
  className?: string;
  required?: boolean;
}

export function ChipInput({
  label,
  placeholder = "Type and press Enter",
  value = [],
  onChange,
  maxItems = 10,
  maxCharPerItem = 30,
  className,
  required = false
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last chip when backspacing on empty input
      removeChip(value.length - 1);
    }
  };

  const addChip = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) return;
    
    // Validation
    if (trimmedValue.length > maxCharPerItem) {
      setError(`Maximum ${maxCharPerItem} characters per item`);
      return;
    }
    
    if (value.length >= maxItems) {
      setError(`Maximum ${maxItems} items allowed`);
      return;
    }
    
    if (value.includes(trimmedValue)) {
      setError(`"${trimmedValue}" already exists`);
      return;
    }
    
    // Add the chip
    onChange([...value, trimmedValue]);
    setInputValue("");
    setError("");
  };

  const removeChip = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(""); // Clear error when user starts typing
  };

  return (
    <div className={className}>
      <Label htmlFor={`chip-input-${label}`}>
        {label} {required && "*"}
      </Label>
      
      {/* Existing chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 mt-1">
          {value.map((chip, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1"
            >
              <span>{chip}</span>
              <button
                type="button"
                onClick={() => removeChip(index)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${chip}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Input field */}
      <Input
        id={`chip-input-${label}`}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={addChip}
        placeholder={value.length >= maxItems ? `Maximum ${maxItems} items` : placeholder}
        disabled={value.length >= maxItems}
        className={error ? "border-red-500" : ""}
      />
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      
      {/* Helper text */}
      <p className="text-sm text-gray-500 mt-1">
        {value.length}/{maxItems} items • Press Enter or comma to add • Max {maxCharPerItem} chars each
      </p>
    </div>
  );
}