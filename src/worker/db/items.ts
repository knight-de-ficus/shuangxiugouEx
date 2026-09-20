import type { Item, ItemInput } from "../types/item";

export async function listItems(db: D1Database): Promise<Item[]> {
  const result = await db
    .prepare(
      "SELECT id, name, description, created_at, updated_at FROM items ORDER BY id DESC LIMIT ?",
    )
    .bind(100)
    .all<Item>();
  return result.results;
}

export function getItem(db: D1Database, id: number): Promise<Item | null> {
  return db
    .prepare("SELECT id, name, description, created_at, updated_at FROM items WHERE id = ?")
    .bind(id)
    .first<Item>();
}

export async function createItem(db: D1Database, input: ItemInput): Promise<Item> {
  const result = await db
    .prepare("INSERT INTO items (name, description) VALUES (?, ?)")
    .bind(input.name, input.description)
    .run();

  const item = await getItem(db, Number(result.meta.last_row_id));
  if (!item) {
    throw new Error("Created item could not be read.");
  }
  return item;
}

export async function updateItem(
  db: D1Database,
  id: number,
  input: ItemInput,
): Promise<Item | null> {
  const result = await db
    .prepare(
      "UPDATE items SET name = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
    )
    .bind(input.name, input.description, id)
    .run();

  return result.meta.changes === 0 ? null : getItem(db, id);
}

export async function deleteItem(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare("DELETE FROM items WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

