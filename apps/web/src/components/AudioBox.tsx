import { useState } from "react";
import { Button } from "./ui/button";
import { TagCreator } from "./TagCreator";

interface AudioBoxProps {
  label?: string;
  tagIds?: string[];
  tags?: any[];
}

export function AudioBox({
  label = "Áudio (gravar ou importar)",
  tagIds = [],
  tags,
}: AudioBoxProps) {
  const [recording, setRecording] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        {label}
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Gravar áudio</label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRecording(true)}
            disabled={recording}
          >
            Gravar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => importAudioFile()}
            disabled={recording}
          >
            Importar arquivo
          </Button>
        </div>

        {tags && tags.length > 0 ? (
          <div>
            <span className="text-xs text-muted-foreground">
              Tags do áudio ({tags.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors bg-muted text-muted-foreground hover:text-foreground"
                  }
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sem tags de áudio</span>
        )}

        {tagIds && tagIds.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">
              Minhas tags de áudio ({tagIds.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {tagIds.map((id) => (
                <span
                  key={id}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors bg-accent-50 text-accent-700 dark:bg-accent-900 dark:text-accent-200"
                  }
                >
                  #{id}
                </span>
              ))}
            </div>
          </div>
        )}

        <TagCreator onCreate={createAudioTag} />
      </div>
    </div>
  );
}

function importAudioFile() {
  // Lógica para importar áudio - pode ser integrada com o Gravador
}

async function createAudioTag(_name: string) {
  // Lógica para criar tag de áudio
  return Promise.resolve(null);
}