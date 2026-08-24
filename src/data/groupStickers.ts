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

/** 4 or 5 correct → positive sticker; 3 or fewer → negative. */
export function pickGroupSticker(correctCount: number): GroupStickerRef | null {
  const kind: StickerKind = correctCount >= 4 ? 'positive' : 'negative';
  const files = Object.keys(kind === 'positive' ? POSITIVE : NEGATIVE);
  if (files.length === 0) return null;
  return { kind, file: pickFile(files) };
}

export function groupStickerSrc(ref: GroupStickerRef | undefined): string | undefined {
  if (!ref) return undefined;
  const map = ref.kind === 'positive' ? POSITIVE : NEGATIVE;
  return map[ref.file];
}
