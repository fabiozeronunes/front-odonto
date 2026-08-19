import { Link } from "react-router-dom";
import { PlayCircle, Clock } from "lucide-react";
import type { Video } from "../types";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { formatDuration, resolveImageUrl } from "../lib/utils";

export function VideoCard({ video, typeBadge }: { video: Video; typeBadge?: string }) {
  return (
    <Link to={`/video/${video.slug}`} className="group block">
      <Card className="overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-lift">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {video.thumbnailUrl ? (
            <img
              src={resolveImageUrl(video.thumbnailUrl)}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-700 to-teal-600">
              <PlayCircle className="h-12 w-12 text-white/80" />
            </div>
          )}
          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
            {video.isFree ? (
              <Badge variant="free" className="rounded-md bg-gradient-to-r from-teal-500 to-amber-500 px-1.5 py-0.5 text-[9px] uppercase leading-none text-white sm:px-2 sm:py-1 sm:text-[11px]">
                GRATUITO
              </Badge>
            ) : (
              <Badge variant="premium" className="rounded-md px-1.5 py-0.5 text-[9px] uppercase leading-none sm:px-2 sm:py-1 sm:text-[11px]">
                Pago
              </Badge>
            )}
            {video.source === "FRONTODONTUS" ? (
              <Badge variant="default" className="rounded-md bg-gradient-to-r from-teal-500 to-amber-500 px-1.5 py-0.5 text-[9px] uppercase leading-none text-white sm:px-2 sm:py-1 sm:text-[11px]">
                Front Odontus
              </Badge>
            ) : video.source === "STUDENT" ? (
              <Badge variant="info" className="rounded-md px-1.5 py-0.5 text-[9px] uppercase leading-none sm:px-2 sm:py-1 sm:text-[11px]">
                Estudante
              </Badge>
            ) : null}
            {typeBadge ? (
              <Badge variant="info" className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] uppercase leading-none text-white sm:px-2 sm:py-1 sm:text-[11px]">
                {typeBadge}
              </Badge>
            ) : null}
          </div>
          {video.durationSeconds ? (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-white">
              <Clock className="mr-1 inline h-3 w-3" />
              {formatDuration(video.durationSeconds)}
            </div>
          ) : null}
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-300">
            {video.title}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{video.specialty?.name ?? "Geral"}</span>
            <span className="capitalize">{video.difficulty.toLowerCase()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
