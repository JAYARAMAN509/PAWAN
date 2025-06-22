import dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, between } from 'drizzle-orm';
import { Pool } from 'pg';
import {
  users, leads, categories, suppliers, products, orders, orderItems, leadInteractions,
  type User, type InsertUser, type Lead, type InsertLead, type Category, type InsertCategory,
  type Supplier, type InsertSupplier, type Product, type InsertProduct, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type LeadInteraction, type InsertLeadInteraction
} from '@shared/schema';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Lead methods
  getLead(id: number): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadsByAssignee(userId: number): Promise<Lead[]>;

  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Supplier methods
  getSupplier(id: number): Promise<Supplier | undefined>;
  getAllSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductsBySku(sku: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;

  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;

  // Order Item methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Lead Interaction methods
  getLeadInteractions(leadId: number): Promise<LeadInteraction[]>;
  createLeadInteraction(interaction: InsertLeadInteraction): Promise<LeadInteraction>;

  // Analytics methods
  getDashboardStats(): Promise<{
    totalSales: number;
    activeLeads: number;
    stockAlerts: number;
    monthlyRevenue: number;
    recentOrders: Order[];
    leadsByStatus: { status: string; count: number }[];
  }>;
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: {
  users, leads, categories, suppliers, products, orders, orderItems, leadInteractions
}});




export class PgStorage implements IStorage {
  // User methods
  async getUser(id: number) {
    return (await db.select().from(users).where(eq(users.id, id)))[0];
  }

  async getUserByEmail(email: string) {
    return (await db.select().from(users).where(eq(users.email, email)))[0];
  }

  async createUser(user: InsertUser) {
    return (await db.insert(users).values(user).returning())[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>) {
    return (await db.update(users).set(user).where(eq(users.id, id)).returning())[0];
  }

  async getAllUsers() {
    return db.select().from(users);
  }

  // Lead methods
  async getLead(id: number) {
    return (await db.select().from(leads).where(eq(leads.id, id)))[0];
  }

  async getAllLeads() {
    return db.select().from(leads);
  }

  async createLead(lead: InsertLead) {
    return (await db.insert(leads).values({ ...lead, createdAt: new Date(), updatedAt: new Date() }).returning())[0];
  }

  async updateLead(id: number, lead: Partial<InsertLead>) {
    return (await db.update(leads).set({ ...lead, updatedAt: new Date() }).where(eq(leads.id, id)).returning())[0];
  }

  async deleteLead(id: number) {
    return (await db.delete(leads).where(eq(leads.id, id))).rowCount > 0;
  }

  async getLeadsByStatus(status: string) {
    return db.select().from(leads).where(eq(leads.status, status));
  }

  async getLeadsByAssignee(userId: number) {
    return db.select().from(leads).where(eq(leads.assignedTo, userId));
  }

  // Category methods
  async getCategory(id: number) {
    return (await db.select().from(categories).where(eq(categories.id, id)))[0];
  }

  async getAllCategories() {
    return db.select().from(categories);
  }

  async createCategory(category: InsertCategory) {
    return (await db.insert(categories).values({ ...category, createdAt: new Date() }).returning())[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>) {
    return (await db.update(categories).set(category).where(eq(categories.id, id)).returning())[0];
  }

  async deleteCategory(id: number) {
    return (await db.delete(categories).where(eq(categories.id, id))).rowCount > 0;
  }

  // Supplier methods
  async getSupplier(id: number) {
    return (await db.select().from(suppliers).where(eq(suppliers.id, id)))[0];
  }

  async getAllSuppliers() {
    return db.select().from(suppliers);
  }

  async createSupplier(supplier: InsertSupplier) {
    return (await db.insert(suppliers).values({ ...supplier, createdAt: new Date() }).returning())[0];
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>) {
    return (await db.update(suppliers).set(supplier).where(eq(suppliers.id, id)).returning())[0];
  }

  async deleteSupplier(id: number) {
    return (await db.delete(suppliers).where(eq(suppliers.id, id))).rowCount > 0;
  }

  // Product methods
  async getProduct(id: number) {
    return (await db.select().from(products).where(eq(products.id, id)))[0];
  }

  async getAllProducts() {
    return db.select().from(products);
  }

  async createProduct(product: InsertProduct) {
    return (await db.insert(products).values({ ...product, createdAt: new Date(), updatedAt: new Date() }).returning())[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>) {
    return (await db.update(products).set({ ...product, updatedAt: new Date() }).where(eq(products.id, id)).returning())[0];
  }

  async deleteProduct(id: number) {
    return (await db.delete(products).where(eq(products.id, id))).rowCount > 0;
  }

  async getProductsBySku(sku: string) {
    return (await db.select().from(products).where(eq(products.sku, sku)))[0];
  }

  async getProductsByCategory(categoryId: number) {
    return db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async getLowStockProducts() {
    return db.select().from(products).where(
      (products.quantity.lte(products.threshold))
    );
  }

  // Order methods
  async getOrder(id: number) {
    return (await db.select().from(orders).where(eq(orders.id, id)))[0];
  }

  async getAllOrders() {
    return db.select().from(orders).orderBy(orders.createdAt.desc());
  }

  async createOrder(order: InsertOrder) {
    return (await db.insert(orders).values({ ...order, createdAt: new Date() }).returning())[0];
  }

  async updateOrder(id: number, order: Partial<InsertOrder>) {
    return (await db.update(orders).set(order).where(eq(orders.id, id)).returning())[0];
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date) {
    return db.select().from(orders).where(between(orders.createdAt, startDate, endDate));
  }

  async getOrdersByCustomer(customerId: number) {
    return db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  // Order Item methods
  async getOrderItems(orderId: number) {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem) {
    return (await db.insert(orderItems).values(item).returning())[0];
  }

  // Lead Interaction methods
  async getLeadInteractions(leadId: number) {
    return db.select().from(leadInteractions).where(eq(leadInteractions.leadId, leadId));
  }

  async createLeadInteraction(interaction: InsertLeadInteraction) {
    return (await db.insert(leadInteractions).values({ ...interaction, createdAt: new Date() }).returning())[0];
  }

  // Analytics
  async getDashboardStats() {
    const [ordersList, leadsList, productsList] = await Promise.all([
      this.getAllOrders(), this.getAllLeads(), this.getAllProducts()
    ]);

    const totalSales = ordersList.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
    const activeLeads = leadsList.filter(l => !['Converted', 'Dropped'].includes(l.status)).length;
    const stockAlerts = productsList.filter(p => p.quantity !== null && p.threshold !== null && p.quantity <= p.threshold).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = ordersList.filter(o => new Date(o.createdAt!) >= startOfMonth);
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

    const recentOrders = ordersList.slice(0, 10);
    const leadsByStatus = leadsList.reduce((acc, l) => {
      const found = acc.find(i => i.status === l.status);
      found ? found.count++ : acc.push({ status: l.status, count: 1 });
      return acc;
    }, [] as { status: string; count: number }[]);

    return {
      totalSales,
      activeLeads,
      stockAlerts,
      monthlyRevenue,
      recentOrders,
      leadsByStatus
    };
  }
}

export const storage = new PgStorage();
