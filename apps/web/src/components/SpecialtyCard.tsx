import { Link } from "react-router-dom";
import type { Specialty } from "../types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function SpecialtyCard({ specialty }: { specialty: Specialty }) {
  return (
    <Link to={`/catalogo?specialty=${specialty.slug}`} className="group block">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lift">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-300">
            {specialty.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">{specialty.description ?? "—"}</p>
          <div className="mt-3">
            <Badge variant="info">{specialty._count?.videos ?? 0} vídeos</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
