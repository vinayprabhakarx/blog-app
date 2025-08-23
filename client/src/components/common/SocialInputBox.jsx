import React, { useRef, useState } from "react";

const SocialInputBox = ({
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  prefix,
  required = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const inputRef = useRef(null);

  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e) => {
    const username = e.target.value;
    const cleanUsername = username.replace(/[^\w.-]/g, "");
    onChange({ target: { name, value: cleanUsername } });
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <Icon size={18} />
        </div>
      )}

      <div
        className={`flex items-center border rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 ${
          Icon ? "pl-10" : ""
        } ${className}`}
        style={{
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
        }}
      >
        <span
          className="pl-3 pr-0 py-3 text-sm select-none"
          style={{ color: "var(--foreground)" }}
        >
          {prefix}
        </span>

        <input
          ref={inputRef}
          name={name}
          type="text"
          value={value || ""}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? "" : placeholder}
          required={required}
          disabled={disabled}
          className="flex-1 pl-0 pr-3 py-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          style={{
            color: "var(--foreground)",
          }}
          {...props}
        />
      </div>
    </div>
  );
};

export default SocialInputBox;
