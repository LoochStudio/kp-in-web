// Серверный компонент — рендерит BlockNote JSON как HTML без клиентского JS

interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
}

interface StyledText {
  type: "text";
  text: string;
  styles?: TextStyle;
}

interface LinkContent {
  type: "link";
  href: string;
  content: StyledText[];
}

type InlineContent = StyledText | LinkContent;

interface Block {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: InlineContent[];
  children?: Block[];
}

function InlineNode({ node }: { node: InlineContent }) {
  if (node.type === "link") {
    return (
      <a
        href={node.href}
        className="underline underline-offset-2 transition-colors duration-300"
        style={{ color: "#333037" }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {node.content.map((n, i) => <InlineNode key={i} node={n} />)}
      </a>
    );
  }

  let content: React.ReactNode = node.text;

  if (node.styles?.code)
    content = (
      <code
        className="px-1.5 py-0.5 rounded text-[0.875em] font-mono"
        style={{ background: "#F0EDE8", color: "#4A3F38" }}
      >
        {content}
      </code>
    );
  if (node.styles?.bold)
    content = <strong className="font-semibold" style={{ color: "#2E2B28" }}>{content}</strong>;
  if (node.styles?.italic)
    content = <em>{content}</em>;
  if (node.styles?.underline)
    content = <u>{content}</u>;
  if (node.styles?.strike)
    content = <s style={{ color: "#B0A89E" }}>{content}</s>;

  return <>{content}</>;
}

function Inline({ content }: { content?: InlineContent[] }) {
  if (!content?.length) return null;
  return <>{content.map((node, i) => <InlineNode key={i} node={node} />)}</>;
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const level = (block.props?.level as number) ?? 1;
      if (level === 1)
        return (
          <p className="text-xl font-semibold mt-8 mb-3 tracking-tight" style={{ color: "#2E2B28" }}>
            <Inline content={block.content} />
          </p>
        );
      if (level === 2)
        return (
          <p className="text-lg font-semibold mt-6 mb-2" style={{ color: "#2E2B28" }}>
            <Inline content={block.content} />
          </p>
        );
      return (
        <p className="text-base font-semibold mt-5 mb-1.5" style={{ color: "#3A3735" }}>
          <Inline content={block.content} />
        </p>
      );
    }

    case "bulletListItem":
      return (
        <li className="flex items-start gap-3" style={{ color: "#5C5550" }}>
          <span
            className="mt-[0.55em] w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "#C4BCB6" }}
          />
          <span className="leading-relaxed"><Inline content={block.content} /></span>
        </li>
      );

    case "numberedListItem":
      return (
        <li className="leading-relaxed ml-4 list-decimal" style={{ color: "#5C5550" }}>
          <Inline content={block.content} />
        </li>
      );

    case "image": {
      const url = block.props?.url as string;
      const caption = block.props?.caption as string;
      if (!url) return null;
      return (
        <figure className="my-6">
          <img src={url} alt={caption ?? ""} className="rounded-2xl w-full object-cover" />
          {caption && (
            <figcaption className="text-sm text-center mt-3" style={{ color: "#B0A89E" }}>
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "table": {
      const content = block.content as unknown as {
        type: "tableContent";
        rows: { cells: ({ type: string; content: InlineContent[] } | InlineContent[])[] }[];
      } | undefined;
      if (!content?.rows?.length) return null;

      function getCellContent(cell: unknown): InlineContent[] {
        if (Array.isArray(cell)) return cell as InlineContent[];
        if (cell && typeof cell === "object" && "content" in cell)
          return (cell as { content: InlineContent[] }).content ?? [];
        return [];
      }

      return (
        <div className="overflow-x-auto my-4 rounded-xl" style={{ border: "1px solid #EDE8E2" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {content.rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={
                    ri === 0
                      ? { background: "#FAF7F4" }
                      : { borderTop: "1px solid #EDE8E2" }
                  }
                >
                  {row.cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-3 ${ri === 0 ? "font-medium" : ""}`}
                      style={{
                        color: ri === 0 ? "#2E2B28" : "#5C5550",
                        borderRight: ci < row.cells.length - 1 ? "1px solid #EDE8E2" : "none",
                      }}
                    >
                      {getCellContent(cell).map((node, i) => <InlineNode key={i} node={node} />)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "paragraph":
    default: {
      const content = block.content;
      if (!content?.length) return <div className="h-2" />;
      return (
        <p className="leading-[1.75]" style={{ color: "#5C5550" }}>
          <Inline content={content} />
        </p>
      );
    }
  }
}

function groupListItems(blocks: Block[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulletListItem") {
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "bulletListItem") {
        items.push(blocks[i++]);
      }
      result.push(
        <ul key={`ul-${i}`} className="space-y-2 my-3">
          {items.map((b) => <BlockNode key={b.id} block={b} />)}
        </ul>
      );
    } else if (block.type === "numberedListItem") {
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "numberedListItem") {
        items.push(blocks[i++]);
      }
      result.push(
        <ol key={`ol-${i}`} className="space-y-2 my-3">
          {items.map((b) => <BlockNode key={b.id} block={b} />)}
        </ol>
      );
    } else {
      result.push(<BlockNode key={block.id} block={block} />);
      i++;
    }
  }

  return result;
}

interface Props {
  content: string;
}

export default function BlockContent({ content }: Props) {
  if (!content) return null;

  let blocks: Block[];

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      blocks = parsed;
    } else {
      return <p className="leading-[1.75]" style={{ color: "#5C5550" }}>{content}</p>;
    }
  } catch {
    return <p className="leading-[1.75]" style={{ color: "#5C5550" }}>{content}</p>;
  }

  return (
    <div className="space-y-2">
      {groupListItems(blocks)}
    </div>
  );
}
