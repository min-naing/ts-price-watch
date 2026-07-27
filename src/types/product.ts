import type { ObjectId } from "mongodb";

export interface Product {
  _id?: ObjectId;
  name: string;
  imgUrl: string | null;
  fullUrl: string;
  updatedAt: Date;
}

export interface PriceRecord {
  fullUrl: string;  // metaField — MongoDB indexes this automatically
  scrapedAt: Date;  // timeField — must be a Date
  price: number;
  isOnSale: boolean;
  inStock: boolean | null; // null = variant product, unknown without selection
}
