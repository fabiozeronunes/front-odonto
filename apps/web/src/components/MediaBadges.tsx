import { Video as VideoIcon, AudioLines, Image as ImageIcon, BookOpen } from "lucide-react";
import type { CaseStudy, Video } from "../types";

const badgeClass = "inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-1 leading-none text-slate-700 sm:px-2";

type CaseStudyLike = Pick<CaseStudy, "audioUrl" | "audioTitle" | "images" | "videoCases">;

export function MediaBadges({ video, caseStudy, text }: { video?: Video; caseStudy?: CaseStudyLike; text?: boolean }) {
  const hasVideo = video ? true : caseStudy && (caseStudy.videoCases?.length ?? 0) > 0;
  const hasAudio = video ? !!(video.audioUrl || video.audioTitle) : !!(caseStudy?.audioUrl || caseStudy?.audioTitle);
  const hasImages = video ? (video.images?.length ?? 0) > 0 : (caseStudy?.images?.length ?? 0) > 0;
  const onlyText = video ? false : !hasAudio && !hasImages && !hasVideo;

  if (text) {
    return (
      <>
        {hasVideo ? <VideoIcon className="h-3.5 w-3.5" /> : null}
        {hasAudio ? <AudioLines className="h-3.5 w-3.5" /> : null}
        {hasImages ? <ImageIcon className="h-3.5 w-3.5" /> : null}
        {onlyText ? <BookOpen className="h-3.5 w-3.5" /> : null}
      </>
    );
  }

  return (
    <>
      {hasVideo ? (
        <span className={badgeClass}>
          <VideoIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      {hasAudio ? (
        <span className={badgeClass}>
          <AudioLines className="h-3.5 w-3.5" />
        </span>
      ) : null}
      {hasImages ? (
        <span className={badgeClass}>
          <ImageIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      {onlyText ? (
        <span className={badgeClass}>
          <BookOpen className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </>
  );
}