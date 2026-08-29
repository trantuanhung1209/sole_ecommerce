interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <div
      className="
        flex items-center gap-2
        rounded-xl border border-red-300 
        bg-red-100/40 
        px-4 py-3 
        text-red-500 text-sm
        shadow-sm
      "
    >
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
};
