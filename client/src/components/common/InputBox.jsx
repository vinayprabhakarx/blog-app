import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

const InputBox = ({
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  disabled = false,
  className = "",
  showPasswordToggle = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const inputType =
    showPasswordToggle && type === "password"
      ? showPassword
        ? "text"
        : "password"
      : type;

  // Only show password toggle when field has content
  const shouldShowPasswordToggle =
    showPasswordToggle && type === "password" && value && value.length > 0;

  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <Icon size={18} />
        </div>
      )}
      <Input
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${Icon ? "pl-10" : ""} ${
          shouldShowPasswordToggle ? "pr-10" : ""
        } bg-background text-foreground border border-border ${className}`}
        {...props}
      />
      {shouldShowPasswordToggle && (
        <button
          type="button"
          onClick={handlePasswordToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
        </button>
      )}
    </div>
  );
};

export default InputBox;
