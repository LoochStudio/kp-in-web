"use client";

import { useState } from "react";
import BlockContent from "./BlockContent";

interface RawBlock {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: { type: string; text: string; styles?: object }[];
  children?: RawBlock[];
}

interface Tab {
  id: string;
  title: string;
  content: string;
}

function getBlockText(block: RawBlock): string {
  return (
    block.content
      ?.filter((c): c is { type: "text"; text: string; styles?: object } => c.type === "text")
      .map((c) => c.text)
      .join("") ?? ""
  );
}

function parseTabs(content: string): Tab[] {
  let blocks: RawBlock[];
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    blocks = parsed;
  } catch {
    return [];
  }

  const tabs: Tab[] = [];
  let currentTitle: string | null = null;
  let currentBlocks: RawBlock[] = [];

  for (const block of blocks) {
    const isHeader =
      block.type === "heading" &&
      ((block.props?.level as number) === 1 || (block.props?.level as number) === 2);

    if (isHeader) {
      if (currentTitle !== null) {
        tabs.push({ id: String(tabs.length), title: currentTitle, content: JSON.stringify(currentBlocks) });
      }
      currentTitle = getBlockText(block);
      currentBlocks = [];
    } else if (currentTitle !== null) {
      currentBlocks.push(block);
    }
  }

  if (currentTitle !== null) {
    tabs.push({ id: String(tabs.length), title: currentTitle, content: JSON.stringify(currentBlocks) });
  }

  return tabs;
}

export default function StagesTabs({ content }: { content: string }) {
  const tabs = parseTabs(content);
  const [active, setActive] = useState(0);

  if (tabs.length === 0) {
    return <BlockContent content={content} />;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActive(i)}
            className="px-4 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer"
            style={
              active === i
                ? { background: "#333037", color: "#fff", fontWeight: 500 }
                : { background: "#fff", color: "#999", border: "1px solid #D9D9D9" }
            }
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl p-7 md:p-9"
        style={{ background: "#fff", border: "1px solid #E5E5E5" }}
      >
        <BlockContent content={tabs[active].content} />
      </div>
    </div>
  );
}
