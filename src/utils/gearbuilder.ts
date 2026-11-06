import type { Player } from "@src-types";
import { getData, type Item } from "@data";
import Fuse from "fuse.js/basic";
import type { APITopLevelComponent } from "seyfert";

export async function findItemsFromQuery(query: string): Promise<Item[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const items = (await getData()).items;

  const fuse = new Fuse(Object.values(items), {
    keys: ["name"],
  });

  return fuse
    .search(normalizedQuery)
    .slice(0, 5)
    .map(({ item }) => item);
}

export async function parseGearbuilderComponentsIntoPlayer(
  components: APITopLevelComponent[]
): Promise<Player> {
  // TODO
}
