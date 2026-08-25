import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({ to, label = "Voltar", className }: BackButtonProps) {
  const navigate = useNavigate();

  function handleClick() {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`mb-4 inline-flex items-center gap-1.5 border-border bg-surface font-medium text-foreground hover:bg-muted ${className ?? ""}`}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Button>
  );
}