import { string, z } from "zod";

export const RaritySchema = z.enum([
  "None",
  "Common",
  "Uncommon",
  "Rare",
  "Exotic",
]);

export type Rarity = z.infer<typeof RaritySchema>;

/* === ITEM === */

export const ScalingSchema = z.object({
  power: z.number().optional(),
  defense: z.number().optional(),
  // range
  agility: z.number().optional(),
  // dexterity
  attackSpeed: z.number().optional(),
  attackSize: z.number().optional(),
  // haste
  intensity: z.number().optional(),
  regeneration: z.number().optional(),
  piercing: z.number().optional(),
  resistance: z.number().optional(),
  warding: z.number().optional(),
  drawback: z.number().optional(),
});

export const StatTypeSchema = z.enum(["None", "Magic", "Strength", "Vitality"]);

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  legend: z.string(),
  mainType: z.string(),
  rarity: RaritySchema,
  imageId: z.string(),
  deleted: z.boolean(),
  subType: z.string().nullable().optional(),
  gemNo: z.number().int().nullable().optional(),
  minLevel: z.number().int().nullable().optional(),
  maxLevel: z.number().int().nullable().optional(),
  statType: StatTypeSchema.nullable().optional(),
  validModifiers: z.array(z.string()).nullable().optional(),
  scaling: ScalingSchema.nullable().optional(),
});

export const ItemsSchema = z.record(z.string(), ItemSchema);

export type Item = z.infer<typeof ItemSchema>;

/* === MODIFIER === */

export const ModifierSchema = z.object({
  id: z.string(),
  name: z.string(),
  legend: z.string(),
  mainType: z.literal("Modifier"),
  rarity: RaritySchema,
  imageId: z.string(),
  deleted: z.boolean(),

  powerIncrement: z.number().nullable().optional(),
  defenseIncrement: z.number().nullable().optional(),
  // range
  agilityIncrement: z.number().nullable().optional(),
  // dexterity
  attackSpeedIncrement: z.number().nullable().optional(),
  attackSizeIncrement: z.number().nullable().optional(),
  // haste
  intensityIncrement: z.number().nullable().optional(),
  regenerationIncrement: z.number().nullable().optional(),
  piercingIncrement: z.number().nullable().optional(),
  resistanceIncrement: z.number().nullable().optional(),
});

export const ModifiersSchema = z.record(z.string(), ModifierSchema);

export type Modifier = z.infer<typeof ModifierSchema>;

/* === ENCHANT === */

export const GearEnchantStatsSchema = z.object({
  powerIncrement: z.number().nullable().optional(),
  defenseIncrement: z.number().nullable().optional(),
  // range
  agilityIncrement: z.number().nullable().optional(),
  // dexterity
  attackSpeedIncrement: z.number().nullable().optional(),
  attackSizeIncrement: z.number().nullable().optional(),
  // haste
  intensityIncrement: z.number().nullable().optional(),
  regenerationIncrement: z.number().nullable().optional(),
  piercingIncrement: z.number().nullable().optional(),
  resistanceIncrement: z.number().nullable().optional(),

  warding: z.number().nullable().optional(),
});

export const EnchantTypesSchema = z.object({
  gear: GearEnchantStatsSchema.optional().nullable(),
});

export const EnchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  legend: z.string(),
  mainType: z.literal("Enchant"),
  rarity: RaritySchema,
  imageId: z.string(),
  deleted: z.boolean(),
  enchantTypes: EnchantTypesSchema.nullable().optional(),
});

export const EnchantsSchema = z.record(z.string(), EnchantSchema);

export type Enchant = z.infer<typeof EnchantSchema>;

/* === GEM === */

export const GemSchema = z.object({
  id: z.string(),
  name: z.string(),
  legend: z.string(),
  mainType: z.literal("Gem"),
  rarity: RaritySchema,
  imageId: z.string(),
  deleted: z.boolean(),
  fused: z.boolean().nullable(),

  power: z.number().optional(),
  defense: z.number().optional(),
  // range
  agility: z.number().optional(),
  // dexterity
  attackSpeed: z.number().optional(),
  attackSize: z.number().optional(),
  // haste
  intensity: z.number().optional(),
  regeneration: z.number().optional(),
  piercing: z.number().optional(),
  resistance: z.number().optional(),
  drawback: z.number().optional(),

  insanity: z.number().nullable().optional(),
  warding: z.number().nullable().optional(),
});

export const GemsSchema = z.record(z.string(), GemSchema);

export type Gem = z.infer<typeof GemSchema>;

/* === WEAPON === */

export const WeaponSchema = z.object({
  name: z.string(),
  legend: z.string(),
  rarity: RaritySchema,
  imageId: z.string(),
  damage: z.number(),
  speed: z.number(),
  size: z.number(),
  specialEffect: z.string(),
  defense: z.number().nullable().optional(),
  blockingPower: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
});

export const WeaponsSchema = z.array(WeaponSchema);

export type Weapon = z.infer<typeof WeaponSchema>;

/* === MAGIC === */

export const ClashSchema = z.object({
  over: z.array(z.string()),
  neutral: z.array(z.string()),
  under: z.array(z.string()),
});

export const ImbuedSizeSchema = z.object({
  conjurer: z.number(),
  warlock: z.number(),
});

export const ImbuedStatsSchema = z.object({
  damage: z.number(),
  speed: z.number(),
  size: ImbuedSizeSchema,
});

export const UnimbuedStatsSchema = z.object({
  damage: z.number(),
  speed: z.number(),
  size: z.number(),
});

export const MagicSchema = z.object({
  name: z.string(),
  legend: z.string(),
  imageId: string(),
  unimbued: UnimbuedStatsSchema,
  imbued: ImbuedStatsSchema,
  specialEffect: z.string(),
  clash: ClashSchema,
});

export const MagicsSchema = z.array(MagicSchema);

export type Magic = z.infer<typeof MagicSchema>;

/* === BOT DATA === */

export const BotDataSchema = z.object({
  items: z.record(z.string(), ItemSchema),
  weapons: z.array(WeaponSchema),
  magics: z.array(MagicSchema),
  modifiers: z.record(z.string(), ModifierSchema),
  enchants: z.record(z.string(), EnchantSchema),
  gems: z.record(z.string(), GemSchema),
});

export type BotData = z.infer<typeof BotDataSchema>;
