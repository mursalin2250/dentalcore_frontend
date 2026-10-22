// Form-level error (e.g. "Incorrect email or password."). Announced to screen readers.
export default function FormError({ className = "", children }) {
  return (
    <p role="alert" className={`rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger-text ${className}`}>
      {children}
    </p>
  );
}
