import { Client } from "@notionhq/client";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";

// ── Transliteration RU → latin slug ──────────────────────────

const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",
  и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",
  с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",
  щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((c) => TRANSLIT[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// ── BlockNote helpers ─────────────────────────────────────────

function uid() {
  return randomBytes(6).toString("hex");
}

type BNInline = { type: "text"; text: string; styles: Record<string, boolean> };
type BNBlock = Record<string, unknown>;

function richTextToInline(rt: any[]): BNInline[] {
  if (!rt?.length) return [{ type: "text", text: "", styles: {} }];
  return rt.map((item) => {
    const styles: Record<string, boolean> = {};
    if (item.annotations?.bold) styles.bold = true;
    if (item.annotations?.italic) styles.italic = true;
    if (item.annotations?.strikethrough) styles.strikethrough = true;
    if (item.annotations?.underline) styles.underline = true;
    if (item.annotations?.code) styles.code = true;
    return { type: "text", text: item.plain_text ?? "", styles };
  });
}

const bnProps = { textColor: "default", backgroundColor: "default", textAlignment: "left" };

const para = (content: BNInline[]): BNBlock => ({
  id: uid(), type: "paragraph", props: bnProps, content, children: [],
});

const heading = (content: BNInline[], level: 1 | 2 | 3): BNBlock => ({
  id: uid(), type: "heading", props: { ...bnProps, level }, content, children: [],
});

const bulletLi = (content: BNInline[]): BNBlock => ({
  id: uid(), type: "bulletListItem", props: bnProps, content, children: [],
});

const numberedLi = (content: BNInline[]): BNBlock => ({
  id: uid(), type: "numberedListItem", props: bnProps, content, children: [],
});

// ── Convert single Notion block → BlockNote block(s) ─────────
// sectionKey is used to promote h3 → h1 in stages so StagesTabs splits correctly

type SectionKey = "task" | "stages" | "timeline" | "process" | "rates" | "pricing" | "cases" | "next";

function convertBlock(
  block: any,
  childMap: Map<string, any[]>,
  sectionKey?: SectionKey
): BNBlock[] {
  const type: string = block.type;
  const data = block[type];

  switch (type) {
    case "paragraph": {
      const content = richTextToInline(data.rich_text);
      if (!content.some((c) => c.text.trim())) return [];
      return [para(content)];
    }

    case "heading_1":
      return [heading(richTextToInline(data.rich_text), 1)];

    case "heading_2":
      // In stages section promote to h1 so StagesTabs can split
      return [heading(richTextToInline(data.rich_text), sectionKey === "stages" ? 1 : 2)];

    case "heading_3":
      // In stages section promote to h1 so StagesTabs can split on "Дизайн" / "Разработка"
      return [heading(richTextToInline(data.rich_text), sectionKey === "stages" ? 1 : 3)];

    case "bulleted_list_item": {
      const result: BNBlock[] = [bulletLi(richTextToInline(data.rich_text))];
      for (const child of childMap.get(block.id) ?? []) {
        result.push(...convertBlock(child, childMap, sectionKey));
      }
      return result;
    }

    case "numbered_list_item": {
      const result: BNBlock[] = [numberedLi(richTextToInline(data.rich_text))];
      for (const child of childMap.get(block.id) ?? []) {
        result.push(...convertBlock(child, childMap, sectionKey));
      }
      return result;
    }

    case "toggle": {
      // Toggle title becomes a subheading, children are flattened below it
      const result: BNBlock[] = [heading(richTextToInline(data.rich_text), sectionKey === "stages" ? 1 : 3)];
      for (const child of childMap.get(block.id) ?? []) {
        result.push(...convertBlock(child, childMap, sectionKey));
      }
      return result;
    }

    case "callout": {
      const content = richTextToInline(data.rich_text);
      if (!content.some((c) => c.text.trim())) return [];
      return [para(content)];
    }

    case "quote": {
      const content = richTextToInline(data.rich_text);
      if (!content.some((c) => c.text.trim())) return [];
      return [para(content)];
    }

    case "table": {
      const rows = childMap.get(block.id) ?? [];
      if (!rows.length) return [];
      return [{
        id: uid(),
        type: "table",
        props: {},
        content: {
          type: "tableContent",
          rows: rows.map((row: any) => ({
            cells: (row.table_row?.cells ?? []).map((cell: any[]) =>
              richTextToInline(cell)
            ),
          })),
        },
        children: [],
      }];
    }

    // Skip structural/media blocks
    case "divider":
    case "table_of_contents":
    case "table_row":
    case "child_database":
    case "child_page":
    case "embed":
    case "image":
    case "video":
    case "file":
    case "pdf":
    case "bookmark":
    case "column_list":
    case "column":
      return [];

    default:
      return [];
  }
}

// ── Fetch blocks recursively ──────────────────────────────────

async function fetchChildren(
  client: Client,
  blockId: string,
  childMap: Map<string, any[]>,
  depth = 0
): Promise<any[]> {
  if (depth > 4) return [];

  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const res = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = (res as any).next_cursor ?? undefined;
  } while (cursor);

  for (const block of blocks) {
    if ((block as any).has_children) {
      const children = await fetchChildren(client, block.id, childMap, depth + 1);
      childMap.set(block.id, children);
    }
  }

  return blocks;
}

// ── Section detection ─────────────────────────────────────────

const SECTION_KEYWORDS: [string, SectionKey][] = [
  ["вводн", "task"],
  ["задач", "task"],
  ["этап", "stages"],
  ["срок", "timeline"],
  ["тайм", "timeline"],
  ["как будем работать", "process"],
  ["как мы работаем", "process"],
  ["ставк", "rates"],
  ["рейт", "rates"],
  ["стоимост", "pricing"],
  ["бюджет", "pricing"],
  ["кейс", "cases"],
  ["что дальше", "next"],
  ["следующий шаг", "next"],
  ["контакт", "next"],
];

function detectSection(text: string): SectionKey | null {
  const lower = text.toLowerCase();
  for (const [kw, key] of SECTION_KEYWORDS) {
    if (lower.includes(kw)) return key;
  }
  return null;
}

// ── Contact extraction from "next" section blocks ─────────────

function extractContacts(blocks: any[]): {
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
} {
  let contactName: string | null = null;
  let contactRole: string | null = null;
  let contactEmail: string | null = null;
  let contactPhone: string | null = null;

  const texts = blocks.flatMap((b) => {
    const rt = b[b.type]?.rich_text ?? b[b.type]?.text ?? [];
    return rt.map((r: any) => r.plain_text as string);
  });

  for (const text of texts) {
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    if (emailMatch && !contactEmail) contactEmail = emailMatch[0];

    const phoneMatch = text.match(/\+?[\d][\d\s().-]{8,}/);
    if (phoneMatch && !contactPhone) contactPhone = phoneMatch[0].trim();

    // Lines like "Саша Царева" (two Capitalized words, no punctuation)
    if (!contactName && /^[А-ЯЁA-Z][а-яёa-z]+\s[А-ЯЁA-Z][а-яёa-z]+$/.test(text.trim())) {
      contactName = text.trim();
    }

    // Lines like "Руководитель проекта"
    if (!contactRole && /руководитель|менеджер|директор|дизайнер|аккаунт/i.test(text)) {
      contactRole = text.trim();
    }
  }

  return { contactName, contactRole, contactEmail, contactPhone };
}

// ── Main export ───────────────────────────────────────────────

export interface NotionImportResult {
  slug: string;
  title: string;
  clientName: string;
}

export async function importFromNotion(
  notionUrl: string,
  managerEmail: string
): Promise<NotionImportResult> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN не задан в переменных окружения");

  // Extract page ID (32 hex chars, possibly with dashes)
  const idMatch = notionUrl.match(/([a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}|[a-f0-9]{32})/i);
  if (!idMatch) throw new Error("Не удалось извлечь ID страницы из URL Notion");
  const pageId = idMatch[1].replace(/-/g, "");

  const client = new Client({ auth: token });

  // Fetch page metadata
  const page = await client.pages.retrieve({ page_id: pageId }) as any;

  // Extract raw title from page properties
  const titleProp = Object.values(page.properties ?? {}).find(
    (p: any) => p.type === "title"
  ) as any;
  const rawTitle: string =
    titleProp?.title?.[0]?.plain_text ?? "КП без названия";

  // Split "КЛИЕНТ – Название проекта"
  let clientName: string;
  let title: string;
  const dashMatch = rawTitle.match(/^(.+?)\s*[–—-]\s*(.+)$/);
  if (dashMatch) {
    clientName = dashMatch[1].trim();
    title = dashMatch[2].trim();
  } else {
    clientName = rawTitle.split(/\s+/).slice(0, 2).join(" ");
    title = rawTitle;
  }

  // Fetch all blocks
  const childMap = new Map<string, any[]>();
  const topBlocks = await fetchChildren(client, pageId, childMap);

  // Split blocks into KP sections by top-level headings
  const sections: Record<SectionKey, any[]> = {
    task: [], stages: [], timeline: [], process: [],
    rates: [], pricing: [], cases: [], next: [],
  };

  let currentSection: SectionKey | null = null;

  for (const block of topBlocks) {
    const type: string = block.type;
    const isTopHeading = type === "heading_1" || type === "heading_2";

    if (isTopHeading) {
      const text: string = block[type]?.rich_text
        ?.map((r: any) => r.plain_text)
        .join("") ?? "";
      const detected = detectSection(text);
      if (detected) {
        currentSection = detected;
        continue; // The heading is not included — the page renders its own section titles
      }
    }

    if (currentSection) {
      sections[currentSection].push(block);
    }
  }

  // Convert each section to BlockNote JSON string
  const toJson = (key: SectionKey): string | null => {
    const blocks = sections[key];
    if (!blocks.length) return null;
    const bnBlocks: BNBlock[] = [];
    for (const block of blocks) {
      bnBlocks.push(...convertBlock(block, childMap, key));
    }
    return bnBlocks.length ? JSON.stringify(bnBlocks) : null;
  };

  // Extract contacts from next section
  const { contactName, contactRole, contactEmail, contactPhone } =
    extractContacts(sections.next);

  // Generate slug: slugify(clientName) + random 8-char hash
  const hash = randomBytes(4).toString("hex");
  const slug = `${slugify(clientName) || "kp"}-${hash}`;

  // Find manager by email
  const manager = await prisma.user.findUnique({ where: { email: managerEmail } });
  if (!manager) throw new Error("Пользователь не найден");

  await prisma.proposal.create({
    data: {
      slug,
      clientName,
      title,
      notionUrl: notionUrl,
      status: "DRAFT",
      taskContent:     toJson("task"),
      stagesContent:   toJson("stages"),
      timelineContent: toJson("timeline"),
      processContent:  toJson("process"),
      ratesContent:    toJson("rates"),
      pricingContent:  toJson("pricing"),
      casesContent:    toJson("cases"),
      nextContent:     toJson("next"),
      showSummary: false,
      showTask:     !!sections.task.length,
      showStages:   !!sections.stages.length,
      showTimeline: !!sections.timeline.length,
      showProcess:  !!sections.process.length,
      showRates:    !!sections.rates.length,
      showPricing:  !!sections.pricing.length,
      showCases:    !!sections.cases.length,
      showNext:     !!sections.next.length,
      contactName,
      contactRole,
      contactEmail,
      contactPhone,
      managerId: manager.id,
    },
  });

  return { slug, title, clientName };
}

// ── Sync existing proposal from Notion ───────────────────────

export async function syncFromNotion(proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error("КП не найдено");
  if (!proposal.notionUrl) throw new Error("У этого КП нет привязанной страницы Notion");

  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN не задан в переменных окружения");

  const idMatch = proposal.notionUrl.match(/([a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}|[a-f0-9]{32})/i);
  if (!idMatch) throw new Error("Не удалось извлечь ID страницы из URL Notion");
  const pageId = idMatch[1].replace(/-/g, "");

  const client = new Client({ auth: token });

  const childMap = new Map<string, any[]>();
  const topBlocks = await fetchChildren(client, pageId, childMap);

  const sections: Record<SectionKey, any[]> = {
    task: [], stages: [], timeline: [], process: [],
    rates: [], pricing: [], cases: [], next: [],
  };

  let currentSection: SectionKey | null = null;

  for (const block of topBlocks) {
    const type: string = block.type;
    const isTopHeading = type === "heading_1" || type === "heading_2";

    if (isTopHeading) {
      const text: string = block[type]?.rich_text
        ?.map((r: any) => r.plain_text)
        .join("") ?? "";
      const detected = detectSection(text);
      if (detected) {
        currentSection = detected;
        continue;
      }
    }

    if (currentSection) {
      sections[currentSection].push(block);
    }
  }

  const toJson = (key: SectionKey): string | null => {
    const blocks = sections[key];
    if (!blocks.length) return null;
    const bnBlocks: BNBlock[] = [];
    for (const block of blocks) {
      bnBlocks.push(...convertBlock(block, childMap, key));
    }
    return bnBlocks.length ? JSON.stringify(bnBlocks) : null;
  };

  const { contactName, contactRole, contactEmail, contactPhone } =
    extractContacts(sections.next);

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      taskContent:     toJson("task"),
      stagesContent:   toJson("stages"),
      timelineContent: toJson("timeline"),
      processContent:  toJson("process"),
      ratesContent:    toJson("rates"),
      pricingContent:  toJson("pricing"),
      casesContent:    toJson("cases"),
      nextContent:     toJson("next"),
      showTask:     !!sections.task.length,
      showStages:   !!sections.stages.length,
      showTimeline: !!sections.timeline.length,
      showProcess:  !!sections.process.length,
      showRates:    !!sections.rates.length,
      showPricing:  !!sections.pricing.length,
      showCases:    !!sections.cases.length,
      showNext:     !!sections.next.length,
      contactName,
      contactRole,
      contactEmail,
      contactPhone,
    },
  });
}
