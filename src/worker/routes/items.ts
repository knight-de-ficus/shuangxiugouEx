import { Hono } from "hono";
import { createItem, deleteItem, getItem, listItems, updateItem } from "../db/items";
import { ApiError } from "../services/errors";
import { parseItemId, parseJsonBody, validateItemInput } from "../services/validation";
import type { AppEnv } from "../types/bindings";

export const itemRoutes = new Hono<AppEnv>();

itemRoutes.get("/", async (context) => {
  return context.json({ items: await listItems(context.env.DB) });
});

itemRoutes.get("/:id", async (context) => {
  const id = parseItemId(context.req.param("id"));
  const item = await getItem(context.env.DB, id);
  if (!item) {
    throw new ApiError(404, "not_found", "Item not found.");
  }
  return context.json({ item });
});

itemRoutes.post("/", async (context) => {
  const input = validateItemInput(await parseJsonBody(context.req.raw));
  const item = await createItem(context.env.DB, input);
  return context.json({ item }, 201, { Location: `/api/items/${item.id}` });
});

itemRoutes.put("/:id", async (context) => {
  const id = parseItemId(context.req.param("id"));
  const input = validateItemInput(await parseJsonBody(context.req.raw));
  const item = await updateItem(context.env.DB, id, input);
  if (!item) {
    throw new ApiError(404, "not_found", "Item not found.");
  }
  return context.json({ item });
});

itemRoutes.delete("/:id", async (context) => {
  const id = parseItemId(context.req.param("id"));
  if (!(await deleteItem(context.env.DB, id))) {
    throw new ApiError(404, "not_found", "Item not found.");
  }
  return context.body(null, 204);
});

