import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order, Product, Lead } from "@shared/schema";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

export default function Reports() {
  const { appUser } = useAuth();
  const { currency } = useApp();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("sales");

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!appUser,
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    enabled: !!appUser,
  });

  // Fetch leads
  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    enabled: !!appUser,
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!appUser,
  });

  const handleExportCSV = () => {
    let csvContent = "";
    let filename = "";

    switch (reportType) {
      case "sales":
        csvContent = generateSalesCSV();
        filename = "sales_report.csv";
        break;
      case "inventory":
        csvContent = generateInventoryCSV();
        filename = "inventory_report.csv";
        break;
      case "leads":
        csvContent = generateLeadsCSV();
        filename = "leads_report.csv";
        break;
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${filename} has been downloaded.`,
    });
  };

  const generateSalesCSV = () => {
    const headers = ["Order Number", "Date", "Customer", "Total", "Payment Method", "Status"];
    const rows = filteredOrders.map((order: Order) => [
      order.orderNumber,
      new Date(order.createdAt!).toLocaleDateString(),
      order.customerName || "Walk-in Customer",
      parseFloat(order.total).toFixed(2),
      order.paymentMethod || "Cash",
      order.status || "Completed"
    ]);

    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const generateInventoryCSV = () => {
    const headers = ["Name", "SKU", "Cost Price", "Sell Price", "Quantity", "Threshold", "Status"];
    const rows = products.map((product: Product) => [
      product.name,
      product.sku,
      parseFloat(product.costPrice).toFixed(2),
      parseFloat(product.sellPrice).toFixed(2),
      product.quantity || 0,
      product.threshold || 0,
      product.isActive ? "Active" : "Inactive"
    ]);

    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const generateLeadsCSV = () => {
    const headers = ["Name", "Company", "Email", "Phone", "Status", "Source", "Value", "Created Date"];
    const rows = leads.map((lead: Lead) => [
      lead.name,
      lead.company || "",
      lead.email || "",
      lead.phone || "",
      lead.status,
      lead.source || "",
      lead.value ? parseFloat(lead.value).toFixed(2) : "0.00",
      new Date(lead.createdAt!).toLocaleDateString()
    ]);

    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const filteredOrders = orders.filter((order: Order) => {
    if (!dateRange?.from || !dateRange?.to) return true;
    const orderDate = new Date(order.createdAt!);
    return orderDate >= dateRange.from && orderDate <= dateRange.to;
  });

  const calculateSalesMetrics = () => {
    const totalRevenue = filteredOrders.reduce((sum: number, order: Order) => 
      sum + parseFloat(order.total), 0
    );
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return { totalRevenue, totalOrders, averageOrderValue };
  };

  const calculateInventoryMetrics = () => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter((p: Product) => 
      p.quantity !== null && p.threshold !== null && p.quantity <= p.threshold
    ).length;
    const totalValue = products.reduce((sum: number, p: Product) => 
      sum + (parseFloat(p.sellPrice) * (p.quantity || 0)), 0
    );
    
    return { totalProducts, lowStockProducts, totalValue };
  };

  const getTopProducts = () => {
    // This would ideally come from order items data
    // For now, we'll show products sorted by stock quantity
    return products
      .filter((p: Product) => p.quantity && p.quantity > 0)
      .sort((a: Product, b: Product) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 10);
  };

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const salesMetrics = calculateSalesMetrics();
  const inventoryMetrics = calculateInventoryMetrics();
  const topProducts = getTopProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-dark">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="inventory">Inventory Report</SelectItem>
              <SelectItem value="leads">Leads Report</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} className="bg-primary hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="dateRange">Date Range:</Label>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button variant="outline" onClick={() => setDateRange({
              from: addDays(new Date(), -30),
              to: new Date()
            })}>
              Last 30 Days
            </Button>
            <Button variant="outline" onClick={() => setDateRange({
              from: addDays(new Date(), -7),
              to: new Date()
            })}>
              Last 7 Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportType === "sales" && (
        <div className="space-y-6">
          {/* Sales Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-neutral-dark">
                  {currency}{salesMetrics.totalRevenue.toLocaleString()}
                </span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-neutral-dark">
                  {salesMetrics.totalOrders}
                </span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-neutral-dark">
                  {currency}{salesMetrics.averageOrderValue.toFixed(2)}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.orderNumber}</TableCell>
                      <TableCell>{new Date(order.createdAt!).toLocaleDateString()}</TableCell>
                      <TableCell>{order.customerName || "Walk-in Customer"}</TableCell>
                      <TableCell>{currency}{parseFloat(order.total).toFixed(2)}</TableCell>
                      <TableCell>{order.paymentMethod || "Cash"}</TableCell>
                      <TableCell>
                        <Badge variant="default">{order.status || "Completed"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No sales data found for the selected period</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "inventory" && (
        <div className="space-y-6">
          {/* Inventory Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-neutral-dark">
                  {inventoryMetrics.totalProducts}
                </span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-red-500">
                  {inventoryMetrics.lowStockProducts}
                </span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Total Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-neutral-dark">
                  {currency}{inventoryMetrics.totalValue.toLocaleString()}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Sell Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{currency}{parseFloat(product.costPrice).toFixed(2)}</TableCell>
                      <TableCell>{currency}{parseFloat(product.sellPrice).toFixed(2)}</TableCell>
                      <TableCell>{product.quantity || 0}</TableCell>
                      <TableCell>
                        {currency}{(parseFloat(product.sellPrice) * (product.quantity || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "leads" && (
        <div className="space-y-6">
          {/* Lead Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats?.leadsByStatus?.map((statusData: any, index: number) => {
              const colors = [
                "text-blue-600",
                "text-yellow-600", 
                "text-orange-600",
                "text-green-600",
                "text-red-600"
              ];
              return (
                <Card key={statusData.status}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      {statusData.status} Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className={`text-2xl font-bold ${colors[index % colors.length]}`}>
                      {statusData.count}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Leads ({leads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead: Lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>{lead.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.status}</Badge>
                      </TableCell>
                      <TableCell>{lead.source || "-"}</TableCell>
                      <TableCell>
                        {lead.value ? `${currency}${parseFloat(lead.value).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>{new Date(lead.createdAt!).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No leads found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
