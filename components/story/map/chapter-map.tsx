import { Fragment } from "react";
import { ChapterMapNode } from "./chapter-map-node";
import { ChapterMapConnector } from "./chapter-map-connector";
import type { ChapterMapDTO } from "@/modules/story/types/chapter.dto";

export function ChapterMap({ map }: { map: ChapterMapDTO }) {
  return (
    <div className="flex items-center gap-2 px-8 py-6">
      {map.chapters.map((chapter, i) => (
        <Fragment key={chapter.id}>
          <ChapterMapNode chapter={chapter} />
          {i < map.chapters.length - 1 && <ChapterMapConnector state={chapter.state} />}
        </Fragment>
      ))}
    </div>
  );
}