import { Tag } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface QuestionMetadataProps {
  section: string | null
  subsection: string | null
  tags?: string[]
}

export function QuestionMetadata({ section, subsection, tags = [] }: QuestionMetadataProps) {
  return (
    <Card className="">
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Section</p>
            <p className="text-lg font-medium">{section || 'Uncategorized'}</p>
          </div>
        </div>

        {subsection && (
          <>
            <Separator className="" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Subsection</p>
              <p className="text-lg font-medium">{subsection}</p>
            </div>
          </>
        )}

        {tags.length > 0 && (
          <>
            <Separator className="" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="blue"
                    className="px-2 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}