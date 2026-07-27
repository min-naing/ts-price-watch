import "dotenv/config";
import { sendTelegramAlert } from "./telegram.ts";

await sendTelegramAlert("🚨 Price drop! Abominable Hoodie dropped to $24.00\nhttps://scrapingcourse.com/ecommerce/product/abominable-hoodie");
console.log("Sent!");