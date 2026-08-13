import { Link } from "react-router-dom";
import { PlayCircle, Clock } from "lucide-react";
import type { Video } from "../types";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { formatDuration, resolveImageUrl } from "../lib/utils";

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link to={`/video/${video.slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-lift">
        <div className="relative aspect-video overflow-hidden bg-slate-200">
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
          <div className="absolute left-2 top-2 flex gap-2">
            {video.isFree ? (
              <Badge variant="free">GRATUITO</Badge>
            ) : (
              <Badge variant="premium">Pago</Badge>
            )}
          </div>
          {video.durationSeconds ? (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-white">
              <Clock className="mr-1 inline h-3 w-3" />
              {formatDuration(video.durationSeconds)}
            </div>
          ) : null}
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-primary-800">
            {video.title}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{video.specialty?.name ?? "Geral"}</span>
            <span className="capitalize">{video.difficulty.toLowerCase()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
