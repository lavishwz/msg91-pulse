type LoaderProps = {
  label?: string;
  className?: string;
};

/** A visual wait state with an announcement that remains available to assistive tech. */
export default function Loader({ label = "Loading", className = "" }: LoaderProps) {
  return (
    <div className={`loader ${className}`.trim()} role="status" aria-live="polite">
      <span className="sr">{label}</span>
    </div>
  );
}
