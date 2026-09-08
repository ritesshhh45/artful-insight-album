import brasil from "@/assets/1000203835.jpg.asset.json";
import puma from "@/assets/1000203823.jpg.asset.json";
import arsenal from "@/assets/1000203833.jpg.asset.json";
import ferrari from "@/assets/1000203837.jpg.asset.json";
import elephant from "@/assets/1000203831.jpg.asset.json";
import lacoste from "@/assets/1000203825.jpg.asset.json";

export type Product = {
  slug: string;
  name: string;
  price: number;
  mrp: number;
  image: string;
  fit: "OVERSIZED" | "STRAIGHT FIT" | "BAGGY" | "RELAXED";
  category: "Tees" | "Jerseys" | "Vests";
  colours: string[];
  sizes: string[];
  description: string;
};

export const heroImage = brasil.url;

export const products: Product[] = [
  {
    slug: "brasil-retro-jersey",
    name: "BRASIL RETRO MESH JERSEY",
    price: 899,
    mrp: 1499,
    image: brasil.url,
    fit: "OVERSIZED",
    category: "Jerseys",
    colours: ["Yellow", "Green"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Breathable retro mesh jersey with ribbed V-neck and contrast panels. Cut oversized for an easy everyday drape.",
  },
  {
    slug: "hoops-1978-oversized-tee",
    name: "HOOPS 1978 OVERSIZED TEE",
    price: 799,
    mrp: 1199,
    image: puma.url,
    fit: "OVERSIZED",
    category: "Tees",
    colours: ["Red", "Black"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "240 GSM cotton with a full back print, drop shoulders and a heavy ribbed collar that holds its shape wash after wash.",
  },
  {
    slug: "gunner-long-sleeve-jersey",
    name: "GUNNER LONG SLEEVE JERSEY",
    price: 1099,
    mrp: 1699,
    image: arsenal.url,
    fit: "RELAXED",
    category: "Jerseys",
    colours: ["Red", "White"],
    sizes: ["M", "L", "XL"],
    description:
      "Long sleeve club jersey with tipped collar and striped cuffs. Relaxed body, sport-soft handfeel.",
  },
  {
    slug: "scuderia-race-jersey",
    name: "SCUDERIA RACE JERSEY",
    price: 949,
    mrp: 1499,
    image: ferrari.url,
    fit: "STRAIGHT FIT",
    category: "Jerseys",
    colours: ["Red"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Motorsport-inspired V-neck in quick-dry mesh. Straight fit, short raglan sleeves, race-day graphics.",
  },
  {
    slug: "tusker-acid-wash-vest",
    name: "TUSKER ACID WASH VEST",
    price: 749,
    mrp: 1299,
    image: elephant.url,
    fit: "BAGGY",
    category: "Vests",
    colours: ["Washed Brown"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Acid washed cotton vest with a raised puff-print back graphic. Baggy armholes, raw finish.",
  },
  {
    slug: "athletics-crest-oversized-tee",
    name: "ATHLETICS CREST OVERSIZED TEE",
    price: 699,
    mrp: 1099,
    image: lacoste.url,
    fit: "OVERSIZED",
    category: "Tees",
    colours: ["Butter", "Green"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Butter-toned heavyweight cotton tee with a vintage crest print. Boxy shoulders, everyday staple.",
  },
];

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const discount = (p: Product) => Math.round((1 - p.price / p.mrp) * 100);

export const fits = ["OVERSIZED", "STRAIGHT FIT", "BAGGY", "RELAXED"] as const;
