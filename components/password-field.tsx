"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({
  label = "Password",
  name = "password",
  minLength = 8
}: {
  label?: string;
  name?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-wrap">
        <input name={name} type={visible ? "text" : "password"} minLength={minLength} required />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
