"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Package, Star, Tag } from "lucide-react";
import { Product } from "../api/dashboard.api";

interface AdminProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function AdminProductTable({
  products,
  onEdit,
  onDelete,
  isLoading,
}: AdminProductTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Package className="h-12 w-12 text-gray-600 animate-pulse" />
        <p className="text-gray-400">Loading catalog...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 overflow-hidden bg-white/5">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="w-[80px] text-gray-300">Image</TableHead>
            <TableHead className="text-gray-300">Product Details</TableHead>
            <TableHead className="text-gray-300">Status & Tag</TableHead>
            <TableHead className="text-gray-300">Price & Discount</TableHead>
            <TableHead className="text-gray-300">Inventory</TableHead>
            <TableHead className="text-gray-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="border-white/10 hover:bg-white/5 transition-colors">
              <TableCell>
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/10">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover h-full w-full"
                  />
                </div>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="flex flex-col">
                  <span className="font-semibold text-white truncate">{product.name}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</span>
                  {product.rating && (
                    <div className="flex items-center mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] text-gray-400 ml-1">{product.rating} ({product.reviews} revs)</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary" className="w-fit bg-blue-500/10 text-blue-400 border-none">
                    {product.category}
                  </Badge>
                  {product.tag && (
                    <div className="flex items-center text-[10px] text-purple-400 font-medium italic">
                      <Tag className="h-2 w-2 mr-1" />
                      {product.tag}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-white font-medium">{product.price}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 line-through">{product.originalPrice}</span>
                    <span className="text-[10px] font-bold text-green-500">{product.discount}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className={product.stock && product.stock < 10 ? "text-red-400 font-medium" : "text-gray-300"}>
                    {product.stock || 0} units
                  </span>
                  <div className="w-16 bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full ${product.stock && product.stock < 10 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(((product.stock || 0) / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="bg-[#1c1c1c] border-white/10 text-white shadow-2xl"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-gray-400">Manage Product</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onSelect={() => {
                          setTimeout(() => onEdit(product), 0);
                        }}
                        className="hover:bg-white/5 focus:bg-white/5 cursor-pointer py-2.5"
                      >
                        <Edit className="mr-2 h-4 w-4 text-blue-400" />
                        Edit details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setTimeout(() => onDelete(product.id), 0);
                        }}
                        className="text-red-400 hover:text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 cursor-pointer py-2.5"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete item
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
