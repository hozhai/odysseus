import { load } from "js-yaml";

const files = ["items", "enchants", "modifiers", "gems"] as const;
const checkOnly = process.argv.includes("--check");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function splitEntries(
  content: string,
  isEntryStart: (line: string) => boolean
): string[] {
  const lines = content.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const entries: string[] = [];
  let current = "";
  let hasEntry = false;

  for (const line of lines) {
    if (isEntryStart(line)) {
      if (hasEntry) {
        entries.push(current);
        current = line;
      } else {
        current += line;
        hasEntry = true;
      }
    } else {
      current += line;
    }
  }

  if (current) entries.push(current);
  return entries;
}

function getName(entry: string, file: string): string {
  const parsed: unknown = load(entry);
  if (!isRecord(parsed)) {
    throw new Error(`Expected a keyed YAML entry in ${file}`);
  }

  const values = Object.values(parsed);
  const record = values[0];
  if (
    values.length !== 1 ||
    !isRecord(record) ||
    typeof record.name !== "string"
  ) {
    throw new Error(`Expected one named record in ${file}`);
  }

  return record.name;
}

const pendingWrites = await Promise.all(
  files.map(async (file) => {
    const path = `data/${file}.yaml`;
    const content = await Bun.file(path).text();
    const entries = splitEntries(content, (line) =>
      /^[^ \t#][^:]*:\s*(?:#.*)?(?:\r?\n)?$/.test(line)
    );

    if (entries.length === 0) {
      throw new Error(`No YAML entries found in ${file}.yaml`);
    }

    const namedEntries = entries.map((entry) => ({
      entry,
      name: getName(entry, `${file}.yaml`),
    }));
    const sortedEntries = [...namedEntries].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      file,
      path,
      content: sortedEntries.map(({ entry }) => entry).join(""),
      changed: sortedEntries.some(
        (entry, index) => entry !== namedEntries[index]
      ),
    };
  })
);

if (!checkOnly) {
  await Promise.all(
    pendingWrites
      .filter(({ changed }) => changed)
      .map(({ path, content }) => Bun.write(path, content))
  );
}

for (const { file, changed } of pendingWrites) {
  const status = changed
    ? checkOnly
      ? "needs sorting"
      : "sorted"
    : "already sorted";
  console.log(`${file}.yaml: ${status}`);
}

if (checkOnly && pendingWrites.some(({ changed }) => changed)) {
  process.exitCode = 1;
}
