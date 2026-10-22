import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import TextField from "./TextField";

export default function PasswordField(props) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className="grid size-9 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {visible ? <EyeSlash /> : <Eye />}
        </button>
      }
    />
  );
}
