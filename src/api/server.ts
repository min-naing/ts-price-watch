import express from "express";
import { connectDb } from "../db/mongo.ts";
import type { PriceRecord } from "../types/product.ts";

const app = express();

app.get("/products/:id/history", async (req, res) => {
  const db = await connectDb();
  const history = await db
    .collection<PriceRecord>("price_history")
    .find({ fullUrl: req.params.id })
    .sort({ scrapedAt: -1 })
    .toArray();

  res.json(history);
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`API running on port ${port}`));
