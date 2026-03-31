"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { PartialBlock } from "@blocknote/core";
import { ru } from "@blocknote/core/locales";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const EMPTY: PartialBlock[] = [{ type: "paragraph", content: [] }];

function parseContent(value: string): PartialBlock[] {
  if (!value) return EMPTY;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return EMPTY;
  } catch {
    // Старые данные — plain text, оборачиваем в paragraph
    if (value.trim()) {
      return [{ type: "paragraph", content: [{ type: "text", text: value, styles: {} }] }];
    }
    return EMPTY;
  }
}

export default function BlockEditor({ value, onChange, placeholder }: Props) {
  const editor = useCreateBlockNote({
    initialContent: parseContent(value),
    placeholders: {
      default: placeholder ?? "Начните вводить текст... Используйте / для вставки блоков",
    },
    dictionary: ru,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка загрузки");
      }

      const data = await res.json();
      return data.url;
    },
  });

  return (
    <div className="rounded-xl border border-zinc-200 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100 transition-all overflow-hidden bg-white">
      <BlockNoteView
        editor={editor}
        onChange={() => onChange(JSON.stringify(editor.document))}
        theme="light"
      />
    </div>
  );
}
