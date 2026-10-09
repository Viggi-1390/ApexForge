import "./PearlButton.css";

export default function PearlButton({
  children,
  variant = "default",
  icon = null,
  className = "",
  disabled = false,
  onClick,
  ...props
}) {
  const baseClass = "pearl-btn";
  const variantClass = variant === "primary" ? "pearl-btn-primary" : "pearl-btn-default";
  const combinedClasses = `${baseClass} ${variantClass} ${className}`.trim();

  return (
    <button
      className={combinedClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="pearl-btn-icon">{icon}</span>}
      <span className="pearl-btn-text">{children}</span>
    </button>
  );
}
