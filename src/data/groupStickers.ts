export type StickerKind = 'positive' | 'negative';

export interface GroupStickerRef {
  kind: StickerKind;
  file: string;
}

const POSITIVE_FILES = import.meta.glob('../../stickers/positive/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const NEGATIVE_FILES = import.meta.glob('../../stickers/negative/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function fileName(path: string): string {
  const base = path.split('/').pop() ?? path;
  return base.split('?')[0];
}

function catalog(modules: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, src]) => [fileName(path), src]),
  );
}

const POSITIVE = catalog(POSITIVE_FILES);
const NEGATIVE = catalog(NEGATIVE_FILES);

function pickFile(files: string[]): string {
  return files[Math.floor(Math.random() * files.length)];
}

/** Fixed sticker for the completed create-quiz (?) circle. */
export const CREATE_QUIZ_STICKER: GroupStickerRef = {
  kind: 'negative',
  file: 'a6bc64c7-9748-4eb0-beea-f0f13533176c.webp',
};

/** Random positive sticker not already used by another ABC circle. */
export function pickUniquePositiveSticker(
  usedFiles: Iterable<string>,
): GroupStickerRef | null {
  const used = new Set(usedFiles);
  const available = Object.keys(POSITIVE).filter((file) => !used.has(file));
  const pool = available.length > 0 ? available : Object.keys(POSITIVE);
  if (pool.length === 0) return null;
  return { kind: 'positive', file: pickFile(pool) };
}

export function groupStickerSrc(ref: GroupStickerRef | undefined): string | undefined {
  if (!ref) return undefined;
  const map = ref.kind === 'positive' ? POSITIVE : NEGATIVE;
  return map[ref.file];
}
