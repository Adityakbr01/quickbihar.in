"use client";

import { useState } from "react";
import { AdminProductTable } from "@/features/dashboard/components/AdminProductTable";
import { ProductFormDialog } from "@/features/dashboard/components/ProductFormDialog";
import { 
  useProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct 
} from "@/features/dashboard/hooks/useDashboard";
import { Product } from "@/features/dashboard/api/dashboard.api";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, ShoppingBag, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { data: products = [], isLoading } = useProducts();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedProduct) {
      updateProduct(
        { id: selectedProduct.id, updates: data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createProduct(data, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  // Stats calculation
  const totalProducts = products.length;
  const lowStock = products.filter(p => (p.stock || 0) < 10).length;
  const avgPrice = totalProducts > 0 
    ? Math.round(products.reduce((acc, p) => acc + parseInt(p.price.replace(/[^\d]/g, "")), 0) / totalProducts)
    : 0;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
            <p className="text-gray-400">Manage your products, inventory, and pricing.</p>
          </div>
          <Button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 h-10 px-6 font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Products" 
            value={totalProducts} 
            icon={<ShoppingBag className="text-blue-400" />} 
            description="Active items in store"
          />
          <StatsCard 
            title="Avg Price" 
            value={`₹${avgPrice}`} 
            icon={<Zap className="text-yellow-400" />} 
            description="Standard product cost"
          />
          <StatsCard 
            title="Low Stock" 
            value={lowStock} 
            icon={<PackageCardIcon />} 
            description="Items needing restock"
            danger={lowStock > 0}
          />
          <StatsCard 
            title="Active Admins" 
            value="1" 
            icon={<Users className="text-purple-400" />} 
            description="Currently online"
          />
        </div>

        {/* Product Table */}
        <Card className="border-white/10 bg-[#1c1c1c] overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-lg">Inventory Overview</h2>
          </div>
          <CardContent className="p-0">
            <AdminProductTable 
              products={products}
              onEdit={handleEdit}
              onDelete={(id) => deleteProduct(id)}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />
    </div>
  );
}

function StatsCard({ title, value, icon, description, danger = false }: any) {
  return (
    <Card className="bg-[#1c1c1c] border-white/10">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        </div>
        <div className="space-y-1">
          <h3 className={`text-2xl font-bold ${danger ? 'text-red-400' : 'text-white'}`}>{value}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PackageCardIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" height="16" 
      viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className="text-red-400"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </svg>
  );
}
