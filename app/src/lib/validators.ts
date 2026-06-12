import { z } from "zod"

export const OrderStatus = z.enum([
  "placed", "confirmed", "preparing", "ready",
  "out_for_delivery", "delivered", "cancelled",
])

export const PaymentStatus = z.enum([
  "pending", "verified", "captured", "refunded", "failed",
])

export const orderItemSchema = z.object({
  menuItemId: z.number(),
  quantity: z.number().min(1),
  itemName: z.string().optional(),
})

export const orderSchema = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(5),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "eft"]).default("cash"),
  items: z.array(orderItemSchema).min(1),
})

export const statusUpdateSchema = z.object({
  status: OrderStatus,
})

export const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  categoryId: z.number().optional(),
  prepTimeMinutes: z.number().optional(),
  starch: z.string().optional(),
  image: z.string().optional(),
  available: z.boolean().default(true),
})

export const categorySchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().default(0),
})

export const ingredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().default("pieces"),
  currentStock: z.number().default(0),
  minStockLevel: z.number().default(0),
  maxStockLevel: z.number().optional(),
  reorderQuantity: z.number().optional(),
  unitCost: z.number().optional(),
  supplierId: z.number().optional(),
})

export const stockAdjustSchema = z.object({
  adjustment: z.number(),
  reason: z.string().optional(),
})

export const supplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  leadTimeDays: z.number().default(1),
})

export const purchaseOrderSchema = z.object({
  supplierId: z.number(),
  items: z.array(z.object({
    ingredientId: z.number(),
    quantityOrdered: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
})

export type OrderInput = z.infer<typeof orderSchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type IngredientInput = z.infer<typeof ingredientSchema>
export type OrderStatusT = z.infer<typeof OrderStatus>
export type PaymentStatusT = z.infer<typeof PaymentStatus>
