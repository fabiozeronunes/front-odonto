import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TagCreatorProps {
  onCreate: (name: string) => Promise<string | null>;
  disabled?: boolean;
}

export function TagCreator({ onCreate, disabled }: TagCreatorProps) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      await onCreate(trimmed);
      setName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex gap-2 pt-1">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nova tag..."
        className="h-8 max-w-[220px] text-sm"
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
      />
      <Button type="button" variant="outline" size="sm" onClick={handleCreate} disabled={disabled || !name.trim() || creating}>
        <Plus className="h-3.5 w-3.5" /> {creating ? "Criando..." : "Criar tag"}
      </Button>
    </div>
  );
}