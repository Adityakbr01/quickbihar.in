"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "../api/dashboard.api";
import { useEffect } from "react";
import { Loader2, Scroll } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(2, "Category is required"),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().min(1, "Original price is required"),
  image: z.string().url("Valid image URL is required"),
  discount: z.string().default("0% OFF"),
  stock: z.number().min(0, "Stock cannot be negative").default(0),
  tag: z.string().optional(),
  benefits: z.string().optional(),
  rating: z.number().min(0).max(5).default(4.5),
  reviews: z.number().min(0).default(0),
});

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: z.infer<typeof productSchema>) => void;
  isPending: boolean;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  isPending,
}: ProductFormDialogProps) {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      originalPrice: "",
      image: "",
      discount: "0% OFF",
      stock: 0,
      tag: "",
      benefits: "",
      rating: 5,
      reviews: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        discount: product.discount,
        stock: product.stock || 0,
        tag: product.tag || "",
        benefits: product.benefits || "",
        rating: product.rating || 5,
        reviews: product.reviews || 0,
      });
    } else {
      form.reset({
        name: "",
        category: "",
        price: "",
        originalPrice: "",
        image: "",
        discount: "0% OFF",
        stock: 0,
        tag: "",
        benefits: "",
        rating: 5,
        reviews: 0,
      });
    }
  }, [product, form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] p-0 bg-[#1c1c1c] text-white border-white/10 flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{product ? "Edit Product Details" : "Create New Product"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="product-form" className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Information</h4>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white/5 border-white/10 focus:border-blue-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Ethnic, Tech Wear" className="bg-white/5 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Highlight Tag</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Best Seller" className="bg-white/5 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pricing & Stock</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price (with symbol)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="₹999" className="bg-white/5 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="₹1,999" className="bg-white/5 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="50% OFF" className="bg-white/5 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={value}
                            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                            className="bg-white/5 border-white/10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Media & Content</h4>
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white/5 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Benefits (Bullets)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Water-resistant • Deep Pockets" className="bg-white/5 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Social Proof</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Rating (0-5)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={value}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            className="bg-white/5 border-white/10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reviews"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Review Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={value}
                            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                            className="bg-white/5 border-white/10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5">
          <Button
            type="submit"
            form="product-form"
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold transition-all"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? "Commit Changes" : "Publish Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
