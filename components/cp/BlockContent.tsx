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
      <a href={node.href} className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400" target="_blank" rel="noopener noreferrer">
        {node.content.map((n, i) => <InlineNode key={i} node={n} />)}
      </a>
    );
  }

  let content: React.ReactNode = node.text;

  if (node.styles?.code) content = <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1 py-0.5 rounded text-[0.875em] font-mono">{content}</code>;
  if (node.styles?.bold) content = <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{content}</strong>;
  if (node.styles?.italic) content = <em>{content}</em>;
  if (node.styles?.underline) content = <u>{content}</u>;
  if (node.styles?.strike) content = <s className="text-zinc-400 dark:text-zinc-500">{content}</s>;

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
      const cls = level === 1
        ? "text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-2"
        : level === 2
        ? "text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-2"
        : "text-base font-semibold text-zinc-800 dark:text-zinc-200 mt-4 mb-1";
      return <p className={cls}><Inline content={block.content} /></p>;
    }

    case "bulletListItem":
      return (
        <li className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
          <span><Inline content={block.content} /></span>
        </li>
      );

    case "numberedListItem":
      return (
        <li className="text-zinc-600 dark:text-zinc-400 list-decimal ml-4">
          <Inline content={block.content} />
        </li>
      );

    case "image": {
      const url = block.props?.url as string;
      const caption = block.props?.caption as string;
      if (!url) return null;
      return (
        <figure className="my-4">
          <img src={url} alt={caption ?? ""} className="rounded-xl w-full object-cover" />
          {caption && <figcaption className="text-sm text-zinc-400 dark:text-zinc-500 text-center mt-2">{caption}</figcaption>}
        </figure>
      );
    }

    case "table": {
      const content = block.content as unknown as {
        type: "tableContent";
        rows: { cells: ({ type: string; content: InlineContent[] } | InlineContent[])[] }[];
      } | undefined;
      if (!content?.rows?.length) return null;

      // BlockNote хранит ячейку как объект { type, content } или как массив
      function getCellContent(cell: unknown): InlineContent[] {
        if (Array.isArray(cell)) return cell as InlineContent[];
        if (cell && typeof cell === "object" && "content" in cell) {
          return (cell as { content: InlineContent[] }).content ?? [];
        }
        return [];
      }

      return (
        <div className="overflow-x-auto my-2">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {content.rows.map((row, ri) => (
                <tr key={ri} className={ri === 0 ? "bg-zinc-50 dark:bg-zinc-800/50 font-medium" : "border-t border-zinc-100 dark:border-zinc-800"}>
                  {row.cells.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800">
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
      if (!content?.length) return <div className="h-3" />;
      return (
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
        items.push(blocks[i]);
        i++;
      }
      result.push(
        <ul key={i} className="space-y-1.5 my-2">
          {items.map((b) => <BlockNode key={b.id} block={b} />)}
        </ul>
      );
    } else if (block.type === "numberedListItem") {
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "numberedListItem") {
        items.push(blocks[i]);
        i++;
      }
      result.push(
        <ol key={i} className="space-y-1.5 my-2">
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
      // Не JSON — рендерим как обычный текст
      return <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{content}</p>;
    }
  } catch {
    // Старые данные — plain text
    return <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{content}</p>;
  }

  return (
    <div className="space-y-2">
      {groupListItems(blocks)}
    </div>
  );
}
