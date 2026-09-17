import React, { useState, useMemo, FormEvent } from "react";
import { Plus, Edit, Trash2, Save, Loader2 } from "lucide-react";
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
              if (image || payload.image)
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
                  <TableHead className="text-gray-400">Home</TableHead>
                  <TableHead className="text-gray-400">Pos</TableHead>
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
                      {parentTitle(category.parentId) ? (
                        <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                          {parentTitle(category.parentId)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          Main Category
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {category.priority || 0} / {category.sortOrder || 0}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={Boolean(category.isVisibleOnHome)}
                        onCheckedChange={(checked) => {
                          updateCategory.mutate({
                            categoryId: category._id,
                            payload: { isVisibleOnHome: checked },
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        className="h-7 w-14 rounded border border-white/10 bg-white/5 px-1.5 text-center text-xs text-white focus:border-emerald-500 focus:outline-none"
                        defaultValue={category.homePosition ?? 0}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (val !== (category.homePosition ?? 0)) {
                            updateCategory.mutate({
                              categoryId: category._id,
                              payload: { homePosition: val },
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                      />
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
  const [isFeatured, setIsFeatured] = useState(category?.isFeatured ?? false);
  const [isVisibleOnHome, setIsVisibleOnHome] = useState(category?.isVisibleOnHome ?? true);
  const [homePosition, setHomePosition] = useState(String(category?.homePosition ?? ""));
  const [seoTitle, setSeoTitle] = useState(category?.seo?.metaTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    category?.seo?.metaDescription || "",
  );
  const [seoKeywords, setSeoKeywords] = useState(
    (category?.seo?.keywords || []).join(", "),
  );
  const [imageUrl, setImageUrl] = useState(category?.image || "");
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
        image: optionalValue(imageUrl),
        banner: optionalValue(banner),
        isActive,
        isFeatured,
        isVisibleOnHome,
        homePosition: numericOrUndefined(homePosition),
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
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        placeholder="Category Image URL (or upload file)"
        className={inputClass}
      />
      <Input
        type="file"
        accept="image/*"
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
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9">
        <span>Is Featured</span>
        <Switch
          checked={isFeatured}
          onCheckedChange={setIsFeatured}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 h-9">
        <span>Show on Home</span>
        <Switch
          checked={isVisibleOnHome}
          onCheckedChange={setIsVisibleOnHome}
        />
      </div>
      <Input
        type="number"
        value={homePosition}
        onChange={(event) => setHomePosition(event.target.value)}
        placeholder="Home Position (1-5)"
        className={inputClass}
      />
      <div className="flex gap-2 md:col-span-4 mt-2">
        <Button type="submit" disabled={isPending || (!category && !image && !imageUrl.trim())}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {category ? "Save Category" : "Create Category"}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onCancel}
          disabled={isPending}
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
          Category &amp; Subcategory Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 pt-4">
        {!roots.length && (
          <div className="text-sm text-gray-400">No categories available.</div>
        )}
        {roots.map((category) => {
          const children = childrenByParent.get(category._id) || [];
          return (
            <div
              key={category._id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{category.title}</span>
                  {category.isVisibleOnHome && (
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      Home #{category.homePosition || 0}
                    </span>
                  )}
                </div>
                <StatusBadge
                  active={Boolean(category.isActive)}
                  label={category.isActive ? "Active" : "Inactive"}
                />
              </div>
              <div className="text-xs text-gray-400">
                {children.length} {children.length === 1 ? "subcategory" : "subcategories"}
              </div>
              {children.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {children.map((child) => (
                    <span
                      key={child._id}
                      className="inline-flex items-center rounded-md bg-white/5 border border-white/5 px-2 py-1 text-xs text-gray-300"
                    >
                      {child.title}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">No subcategories yet</div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
