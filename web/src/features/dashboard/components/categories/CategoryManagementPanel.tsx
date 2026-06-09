import React, { useState, useMemo, FormEvent } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  AdminCategory,
  CategoryPayload,
  QueryParams,
} from "../../api/catalogManagement.api";
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/useCatalogManagement";
import {
  inputClass,
  selectClass,
  textareaClass,
  parentIdValue,
  parentTitle,
  optionalValue,
  splitCsv,
  numericOrUndefined,
} from "../../utils";
import {
  ManagementToolbar,
  PaginationFooter,
  LoadingState,
  EmptyState,
  StatusBadge,
} from "../shared/TableHelpers";

export function CategoryManagementPanel() {
  const [params, setParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "priority",
    sortOrder: "desc",
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const categoriesQuery = useAdminCategories(params);
  const allCategoriesQuery = useAdminCategories({
    page: 1,
    limit: 100,
    sortBy: "title",
    sortOrder: "asc",
  });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const categories = categoriesQuery.data?.data || [];
  const allCategories = allCategoriesQuery.data?.data || [];

  const setParam = (
    key: keyof QueryParams,
    value: QueryParams[keyof QueryParams],
  ) => {
    setParams((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Category Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "all"}
        statuses={[
          { value: "all", label: "All statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        onStatus={(value) => setParam("status", value)}
        sortBy={params.sortBy || "priority"}
        sortOptions={[
          { value: "priority", label: "Priority" },
          { value: "sortOrder", label: "Sort Order" },
          { value: "title", label: "Name" },
          { value: "createdAt", label: "Created" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => categoriesQuery.refetch()}
        extraAction={
          <Button
            onClick={() => {
              setEditing(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create Category
          </Button>
        }
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            key="create-category-dialog"
            category={null}
            categories={allCategories}
            isPending={createCategory.isPending}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={(payload, image) => {
              if (image)
                createCategory.mutate(
                  { payload, image },
                  { onSuccess: () => setIsCreateOpen(false) },
                );
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editing && (
            <CategoryForm
              key={editing._id}
              category={editing}
              categories={allCategories}
              isPending={updateCategory.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(payload, image) => {
                updateCategory.mutate(
                  { categoryId: editing._id, payload, image },
                  { onSuccess: () => setEditing(null) },
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <CategoryTree categories={allCategories} />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {categoriesQuery.isLoading && (
            <LoadingState label="Loading categories..." />
          )}
          {!categoriesQuery.isLoading && !categories.length && (
            <EmptyState label="No categories found." />
          )}
          {!categoriesQuery.isLoading && Boolean(categories.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Parent</TableHead>
                  <TableHead className="text-gray-400">Sort</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow
                    key={category._id}
                    className="border-white/10 hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4">
                      <div className="font-medium text-white">
                        {category.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {parentTitle(category.parentId)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {category.priority || 0} / {category.sortOrder || 0}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        active={Boolean(category.isActive)}
                        label={category.isActive ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => {
                            setIsCreateOpen(false);
                            setEditing(category);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete category ${category.title}?`,
                              )
                            )
                              deleteCategory.mutate(category._id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PaginationFooter
        page={params.page || 1}
        totalPages={categoriesQuery.data?.totalPages || 1}
        onPage={(page) => setParam("page", page)}
      />
    </div>
  );
}

function CategoryForm({
  category,
  categories,
  onSubmit,
  onCancel,
  isPending,
}: {
  category: AdminCategory | null;
  categories: AdminCategory[];
  onSubmit: (payload: CategoryPayload, image?: File) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(category?.title || "");
  const [description, setDescription] = useState(category?.description || "");
  const [parentId, setParentId] = useState(parentIdValue(category?.parentId));
  const [priority, setPriority] = useState(String(category?.priority ?? ""));
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? ""));
  const [banner, setBanner] = useState(category?.banner || "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(category?.seo?.metaTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    category?.seo?.metaDescription || "",
  );
  const [seoKeywords, setSeoKeywords] = useState(
    (category?.seo?.keywords || []).join(", "),
  );
  const [image, setImage] = useState<File | undefined>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(
      {
        title,
        description: optionalValue(description),
        parentId: optionalValue(parentId),
        priority: numericOrUndefined(priority),
        sortOrder: numericOrUndefined(sortOrder),
        banner: optionalValue(banner),
        isActive,
        seo: {
          metaTitle: optionalValue(seoTitle),
          metaDescription: optionalValue(seoDescription),
          keywords: splitCsv(seoKeywords),
        },
      },
      image,
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Category Name"
        required
        className={inputClass}
      />
      <select
        value={parentId}
        onChange={(event) => setParentId(event.target.value)}
        className={selectClass}
      >
        <option value="">No parent</option>
        {categories
          .filter((item) => item._id !== category?._id)
          .map((item) => (
            <option key={item._id} value={item._id}>
              {item.title}
            </option>
          ))}
      </select>
      <Input
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
        placeholder="Priority"
        type="number"
        className={inputClass}
      />
      <Input
        value={sortOrder}
        onChange={(event) => setSortOrder(event.target.value)}
        placeholder="Sort Order"
        type="number"
        className={inputClass}
      />
      <Input
        type="file"
        accept="image/*"
        required={!category}
        onChange={(event) => setImage(event.target.files?.[0])}
        className={inputClass}
      />
      <Input
        value={banner}
        onChange={(event) => setBanner(event.target.value)}
        placeholder="Category Banner URL"
        className={inputClass}
      />
      <Input
        value={seoTitle}
        onChange={(event) => setSeoTitle(event.target.value)}
        placeholder="SEO Meta Title"
        className={inputClass}
      />
      <Input
        value={seoKeywords}
        onChange={(event) => setSeoKeywords(event.target.value)}
        placeholder="SEO Keywords"
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        className={textareaClass}
      />
      <textarea
        value={seoDescription}
        onChange={(event) => setSeoDescription(event.target.value)}
        placeholder="SEO Meta Description"
        className={textareaClass}
      />
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9">
        <span>Active Status</span>
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>
      <div className="flex gap-2 md:col-span-4 mt-2">
        <Button type="submit" disabled={isPending || (!category && !image)}>
          <Save className="h-4 w-4" />
          {category ? "Save Category" : "Create Category"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function CategoryTree({ categories }: { categories: AdminCategory[] }) {
  const roots = useMemo(
    () => categories.filter((category) => !parentIdValue(category.parentId)),
    [categories],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, AdminCategory[]>();
    categories.forEach((category) => {
      const parent = parentIdValue(category.parentId);
      if (!parent) return;
      map.set(parent, [...(map.get(parent) || []), category]);
    });
    return map;
  }, [categories]);

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">
          Category Tree View
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {!roots.length && (
          <div className="text-sm text-gray-400">No categories available.</div>
        )}
        {roots.map((category) => (
          <div
            key={category._id}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-white">{category.title}</div>
              <StatusBadge
                active={Boolean(category.isActive)}
                label={category.isActive ? "Active" : "Inactive"}
              />
            </div>
            <div className="mt-2 grid gap-1">
              {(childrenByParent.get(category._id) || []).map((child) => (
                <div
                  key={child._id}
                  className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-300"
                >
                  {child.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
