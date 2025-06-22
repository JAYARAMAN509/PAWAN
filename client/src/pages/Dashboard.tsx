import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import StatsCard from "@/components/StatsCard";
import DashboardWidget from "@/components/DashboardWidget";
import { TrendingUp, Users, AlertTriangle, DollarSign, Package, UserPlus, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { appUser } = useAuth();
  const { currency } = useApp();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!appUser,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Sales"
          value={formatCurrency(stats?.totalSales || 0)}
          subtitle="+12.5% from last month"
          icon={TrendingUp}
          trend="up"
        />
        <StatsCard
          title="Active Leads"
          value={stats?.activeLeads || 0}
          subtitle="23 need follow-up"
          icon={Users}
          iconColor="text-accent"
          iconBgColor="bg-accent/10"
        />
        <StatsCard
          title="Stock Alerts"
          value={stats?.stockAlerts || 0}
          subtitle="Items below threshold"
          icon={AlertTriangle}
          trend="down"
          iconColor="text-red-500"
          iconBgColor="bg-red-100"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          subtitle={`Target: ${formatCurrency(1000000)}`}
          icon={DollarSign}
          iconColor="text-green-500"
          iconBgColor="bg-green-100"
        />
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <DashboardWidget title="Sales Overview">
          <div className="flex items-center justify-between mb-6">
            <Select defaultValue="7days">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-64 bg-neutral-light rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <p className="text-gray-500 font-medium">Sales chart will be displayed here</p>
              <p className="text-sm text-gray-400 mt-1">Integration with Chart.js pending</p>
            </div>
          </div>
        </DashboardWidget>

        {/* Lead Pipeline */}
        <DashboardWidget title="Lead Pipeline">
          <div className="space-y-4">
            {stats?.leadsByStatus?.map((stage: any, index: number) => {
              const colors = [
                { bg: "bg-primary", text: "text-primary" },
                { bg: "bg-accent", text: "text-accent" },
                { bg: "bg-orange-500", text: "text-orange-500" },
                { bg: "bg-green-500", text: "text-green-500" },
              ];
              const color = colors[index % colors.length];
              
              return (
                <div key={stage.status} className="flex items-center justify-between p-3 bg-neutral-light rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${color.bg} rounded-full`}></div>
                    <span className="font-medium text-neutral-dark">{stage.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-neutral-dark">{stage.count}</span>
                    <span className="text-sm text-gray-500">leads</span>
                  </div>
                </div>
              );
            }) || [
              { status: "New Leads", count: 0 },
              { status: "Contacted", count: 0 },
              { status: "Follow-up", count: 0 },
              { status: "Converted", count: 0 },
            ].map((stage, index) => {
              const colors = [
                { bg: "bg-primary", text: "text-primary" },
                { bg: "bg-accent", text: "text-accent" },
                { bg: "bg-orange-500", text: "text-orange-500" },
                { bg: "bg-green-500", text: "text-green-500" },
              ];
              const color = colors[index % colors.length];
              
              return (
                <div key={stage.status} className="flex items-center justify-between p-3 bg-neutral-light rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${color.bg} rounded-full`}></div>
                    <span className="font-medium text-neutral-dark">{stage.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-neutral-dark">{stage.count}</span>
                    <span className="text-sm text-gray-500">leads</span>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardWidget>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <DashboardWidget title="Recent Orders">
            <div className="flex items-center justify-between mb-6">
              <span></span>
              <Button variant="ghost" className="text-primary hover:text-blue-700">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {stats?.recentOrders?.length ? (
                stats.recentOrders.slice(0, 3).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-neutral-light transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-dark">{order.customerName || "Walk-in Customer"}</p>
                        <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-dark">{formatCurrency(parseFloat(order.total))}</p>
                      <Badge variant="secondary" className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent orders</p>
                </div>
              )}
            </div>
          </DashboardWidget>
        </div>

        {/* Quick Actions */}
        <DashboardWidget title="Quick Actions">
          <div className="space-y-3">
            <Button className="w-full justify-start space-x-3 bg-primary hover:bg-blue-700">
              <UserPlus className="w-5 h-5" />
              <span>Add New User</span>
            </Button>
            <Button className="w-full justify-start space-x-3 bg-accent hover:bg-green-700">
              <Package className="w-5 h-5" />
              <span>Add Product</span>
            </Button>
            <Button variant="outline" className="w-full justify-start space-x-3">
              <Download className="w-5 h-5" />
              <span>Export Report</span>
            </Button>
            <Button variant="outline" className="w-full justify-start space-x-3">
              <Settings className="w-5 h-5" />
              <span>System Settings</span>
            </Button>
          </div>

          {/* Stock Alert Widget */}
          {stats?.stockAlerts > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Low Stock Alert</span>
              </div>
              <p className="text-xs text-red-600 mb-2">{stats.stockAlerts} items are running low on stock</p>
              <Button variant="ghost" size="sm" className="text-red-700 hover:text-red-800 p-0 h-auto">
                Manage Inventory →
              </Button>
            </div>
          )}
        </DashboardWidget>
      </div>
    </div>
  );
}
