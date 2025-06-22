import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Scan, Mic, Plus, Minus, Trash2, ShoppingCart, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, InsertOrder, InsertOrderItem } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
}

export default function POS() {
  const { appUser } = useAuth();
  const { currency } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: "", email: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: !!appUser,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async ({ order, items }: { order: InsertOrder; items: InsertOrderItem[] }) => {
      const response = await apiRequest("POST", "/api/orders", { order, items });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLastOrder(data.order);
      setCart([]);
      setCustomer({ name: "", email: "", phone: "" });
      setDiscount(0);
      setIsInvoiceOpen(true);
      toast({
        title: "Sale completed",
        description: `Order #${data.order.orderNumber} has been processed successfully.`,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process sale.",
      });
    },
  });

  // Voice search functionality
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast({
          variant: "destructive",
          title: "Voice search failed",
          description: "Could not recognize speech. Please try again.",
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      toast({
        variant: "destructive",
        title: "Voice search not supported",
        description: "Your browser doesn't support voice search.",
      });
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity === 0) {
      toast({
        variant: "destructive",
        title: "Out of stock",
        description: "This product is out of stock.",
      });
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= (product.quantity || 0)) {
        toast({
          variant: "destructive",
          title: "Insufficient stock",
          description: "Cannot add more items than available in stock.",
        });
        return;
      }
      
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * parseFloat(product.sellPrice) 
            }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        total: parseFloat(product.sellPrice)
      }]);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => item.product.id === productId);
    if (item && newQuantity > (item.product.quantity || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient stock",
        description: "Cannot add more items than available in stock.",
      });
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { 
            ...item, 
            quantity: newQuantity, 
            total: newQuantity * parseFloat(item.product.sellPrice) 
          }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax - discount;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty cart",
        description: "Please add items to cart before checkout.",
      });
      return;
    }

    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = calculateTotal();
    
    const orderNumber = `ORD-${Date.now()}`;
    
    const order: InsertOrder = {
      orderNumber,
      customerId: null,
      customerName: customer.name || "Walk-in Customer",
      customerEmail: customer.email || null,
      customerPhone: customer.phone || null,
      cashierId: appUser!.id,
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      discount: discount.toString(),
      total: total.toString(),
      paymentMethod,
      status: "Completed",
    };

    const items: InsertOrderItem[] = cart.map(item => ({
      orderId: 0, // Will be set by backend
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.sellPrice,
      total: item.total.toString(),
    }));

    createOrderMutation.mutate({ order, items });
  };

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">POS Terminal</h1>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-dark">POS Terminal</h1>
        <p className="text-gray-600">Process sales and manage transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search products by name, SKU, or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 text-lg h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={startVoiceSearch}
                  disabled={isListening}
                  className="h-12 px-4"
                >
                  <Mic className={`w-5 h-5 ${isListening ? 'text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" className="h-12 px-4">
                  <Scan className="w-5 h-5" />
                </Button>
              </div>
              {isListening && (
                <p className="text-sm text-red-500 mt-2">Listening...</p>
              )}
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product: Product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      {currency}{parseFloat(product.sellPrice).toFixed(2)}
                    </span>
                    <Badge variant={product.quantity && product.quantity > 0 ? "default" : "destructive"}>
                      {product.quantity || 0}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    disabled={!product.quantity || product.quantity === 0}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  placeholder="Customer name (optional)"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="Customer email (optional)"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  placeholder="Customer phone (optional)"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-500">{currency}{parseFloat(item.product.sellPrice).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-medium">{currency}{item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount">Discount ({currency})</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{currency}{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>{currency}{calculateTax(calculateSubtotal()).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{currency}{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{currency}{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-blue-700" 
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? "Processing..." : "Complete Sale"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Generated</DialogTitle>
          </DialogHeader>
          {lastOrder && (
            <div className="space-y-6 print:p-0">
              <div className="text-center border-b pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-inter font-bold text-2xl">P</span>
                </div>
                <h2 className="text-xl font-bold">PAVAN</h2>
                <p className="text-gray-600">Enterprise Business Management</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Invoice Details</h3>
                  <p><strong>Invoice #:</strong> {lastOrder.orderNumber}</p>
                  <p><strong>Date:</strong> {new Date(lastOrder.createdAt).toLocaleDateString()}</p>
                  <p><strong>Cashier:</strong> {appUser?.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Customer</h3>
                  <p><strong>Name:</strong> {lastOrder.customerName}</p>
                  {lastOrder.customerEmail && <p><strong>Email:</strong> {lastOrder.customerEmail}</p>}
                  {lastOrder.customerPhone && <p><strong>Phone:</strong> {lastOrder.customerPhone}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">{item.quantity} × {currency}{parseFloat(item.product.sellPrice).toFixed(2)}</p>
                      </div>
                      <span className="font-medium">{currency}{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{currency}{parseFloat(lastOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{currency}{parseFloat(lastOrder.tax).toFixed(2)}</span>
                  </div>
                  {parseFloat(lastOrder.discount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{currency}{parseFloat(lastOrder.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{currency}{parseFloat(lastOrder.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>{lastOrder.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 print:hidden">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
