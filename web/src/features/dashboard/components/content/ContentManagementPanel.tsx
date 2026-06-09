"use client";

import { type FormEvent, useState } from "react";
import { Megaphone, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminListParams,
  CMSPage,
  FAQ,
  BlogPost,
  Announcement,
} from "../../api/adminManagement.api";
import {
  useCMSPages,
  useFAQs,
  useBlogPosts,
  useAnnouncements,
  useCreateCMSPage,
  useUpdateCMSPage,
  useDeleteCMSPage,
  useCreateFAQ,
  useUpdateFAQ,
  useDeleteFAQ,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "../../hooks/useAdminManagement";
import {
  SectionHeader,
  TabButtons,
  ModuleToolbar,
  StatusBadge,
  LoadingState,
  EmptyState,
  PaginationFooter,
  splitComma,
  toDateTimeInput,
} from "../shared/AdminFullHelpers";
import { inputClass, selectClass, textareaClass, formatDate, downloadCsv } from "../../utils";

type ContentKind = "cms" | "faq" | "blog" | "announcement";

const contentTabs: Array<{ id: ContentKind; label: string }> = [
  { id: "cms", label: "CMS Pages" },
  { id: "faq", label: "FAQs" },
  { id: "blog", label: "Blog" },
  { id: "announcement", label: "Announcements" },
];

export function ContentManagementPanel() {
  const [kind, setKind] = useState<ContentKind>("cms");
  const [params, setParams] = useState<AdminListParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});

  const cmsQuery = useCMSPages(params);
  const faqQuery = useFAQs(params);
  const blogQuery = useBlogPosts(params);
  const announcementQuery = useAnnouncements(params);

  const createCMS = useCreateCMSPage();
  const updateCMS = useUpdateCMSPage();
  const deleteCMS = useDeleteCMSPage();

  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();

  const createBlog = useCreateBlogPost();
  const updateBlog = useUpdateBlogPost();
  const deleteBlog = useDeleteBlogPost();

  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const currentQuery =
    kind === "cms"
      ? cmsQuery
      : kind === "faq"
      ? faqQuery
      : kind === "blog"
      ? blogQuery
      : announcementQuery;
  const rows = currentQuery.data?.data || [];

  const startCreate = () => {
    setEditing(null);
    setDraft(defaultContentDraft(kind));
  };

  const startEdit = (item: any) => {
    setEditing(item);
    setDraft(contentToDraft(kind, item));
  };

  const closeDialog = () => {
    setEditing(null);
    setDraft({});
  };

  const deleteItem = (item: any) => {
    if (!window.confirm("Delete this item?")) return;
    if (kind === "cms") deleteCMS.mutate(item._id);
    if (kind === "faq") deleteFAQ.mutate(item._id);
    if (kind === "blog") deleteBlog.mutate(item._id);
    if (kind === "announcement") deleteAnnouncement.mutate(item._id);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = contentPayload(kind, draft);

    if (editing?._id) {
      if (kind === "cms")
        updateCMS.mutate(
          { id: editing._id, payload: payload as Partial<CMSPage> },
          { onSuccess: closeDialog }
        );
      if (kind === "faq")
        updateFAQ.mutate(
          { id: editing._id, payload: payload as Partial<FAQ> },
          { onSuccess: closeDialog }
        );
      if (kind === "blog")
        updateBlog.mutate(
          { id: editing._id, payload: payload as Partial<BlogPost> },
          { onSuccess: closeDialog }
        );
      if (kind === "announcement")
        updateAnnouncement.mutate(
          {
            id: editing._id,
            payload: payload as Partial<Announcement>,
          },
          { onSuccess: closeDialog }
        );
      return;
    }

    if (kind === "cms")
      createCMS.mutate(payload as Partial<CMSPage>, { onSuccess: closeDialog });
    if (kind === "faq")
      createFAQ.mutate(payload as Partial<FAQ>, { onSuccess: closeDialog });
    if (kind === "blog")
      createBlog.mutate(payload as Partial<BlogPost>, { onSuccess: closeDialog });
    if (kind === "announcement")
      createAnnouncement.mutate(payload as Partial<Announcement>, {
        onSuccess: closeDialog,
      });
  };

  const setParam = (
    key: keyof AdminListParams,
    value: AdminListParams[keyof AdminListParams]
  ) => {
    setParams((current) => ({
      ...current,
      [key]: value || undefined,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  return (
    <div className="grid gap-4">
      <SectionHeader
        icon={<Megaphone className="h-4 w-4" />}
        title="Content Management"
        actionLabel={`Create ${contentLabel(kind)}`}
        onAction={startCreate}
        onRefresh={() => currentQuery.refetch()}
      />
      <TabButtons
        tabs={contentTabs}
        value={kind}
        onChange={(value) => {
          setKind(value as ContentKind);
          setParams((current) => ({ ...current, page: 1 }));
        }}
      />
      <ModuleToolbar
        search={params.search || ""}
        status={params.status || "ALL"}
        statuses={contentStatuses(kind)}
        onSearch={(value) => setParam("search", value)}
        onStatus={(value) => setParam("status", value)}
        onExport={() =>
          downloadCsv(
            `${kind}.csv`,
            contentCsvRows(kind, rows)
          )
        }
      />
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {currentQuery.isLoading && <LoadingState label="Loading content..." />}
          {!currentQuery.isLoading && !rows.length && (
            <EmptyState label="No content found." />
          )}
          {!currentQuery.isLoading && Boolean(rows.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Title</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Updated</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item: any) => (
                  <TableRow
                    key={item._id}
                    className="border-white/10 hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4">
                      <div className="font-medium text-white">
                        {contentTitle(kind, item)}
                      </div>
                      <div className="line-clamp-1 text-xs text-gray-500">
                        {contentDescription(kind, item)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {formatDate(item.updatedAt || item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => startEdit(item)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                          onClick={() => deleteItem(item)}
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
        totalPages={currentQuery.data?.totalPages || 1}
        onPage={(page) => setParam("page", page)}
      />
      <Dialog
        open={Boolean(Object.keys(draft).length)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Create"} {contentLabel(kind)}
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submit}>
            <ContentFormFields
              kind={kind}
              draft={draft}
              onChange={(key, value) =>
                setDraft((current) => ({ ...current, [key]: value }))
              }
            />
            <Button type="submit" className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContentFormFields({
  kind,
  draft,
  onChange,
}: {
  kind: ContentKind;
  draft: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  if (kind === "faq") {
    return (
      <>
        <Input
          required
          className={inputClass}
          placeholder="Question"
          value={draft.question || ""}
          onChange={(event) => onChange("question", event.target.value)}
        />
        <textarea
          required
          className={textareaClass}
          placeholder="Answer"
          value={draft.answer || ""}
          onChange={(event) => onChange("answer", event.target.value)}
        />
        <Input
          className={inputClass}
          placeholder="Category"
          value={draft.category || ""}
          onChange={(event) => onChange("category", event.target.value)}
        />
        <ContentStatusSelect
          status={draft.status || "PUBLISHED"}
          onChange={(value) => onChange("status", value)}
        />
      </>
    );
  }

  if (kind === "announcement") {
    return (
      <>
        <Input
          required
          className={inputClass}
          placeholder="Title"
          value={draft.title || ""}
          onChange={(event) => onChange("title", event.target.value)}
        />
        <textarea
          required
          className={textareaClass}
          placeholder="Message"
          value={draft.message || ""}
          onChange={(event) => onChange("message", event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className={selectClass}
            value={draft.channel || "IN_APP"}
            onChange={(event) => onChange("channel", event.target.value)}
          >
            {["IN_APP", "PUSH", "EMAIL", "SMS"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={draft.audience || "ALL"}
            onChange={(event) => onChange("audience", event.target.value)}
          >
            {["ALL", "USERS", "SELLERS", "DELIVERY"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={draft.status || "DRAFT"}
            onChange={(event) => onChange("status", event.target.value)}
          >
            {["DRAFT", "SCHEDULED", "SENT", "ARCHIVED"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <DateTimePicker
            className={inputClass}
            value={draft.startsAt || ""}
            onChange={(value) => onChange("startsAt", value)}
            placeholder="Starts At"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Input
        required
        className={inputClass}
        placeholder="Title"
        value={draft.title || ""}
        onChange={(event) => onChange("title", event.target.value)}
      />
      <Input
        className={inputClass}
        placeholder="Slug"
        value={draft.slug || ""}
        onChange={(event) => onChange("slug", event.target.value)}
      />
      <Input
        className={inputClass}
        placeholder="Excerpt"
        value={draft.excerpt || ""}
        onChange={(event) => onChange("excerpt", event.target.value)}
      />
      {kind === "blog" && (
        <Input
          className={inputClass}
          placeholder="Cover image URL"
          value={draft.coverImageUrl || ""}
          onChange={(event) => onChange("coverImageUrl", event.target.value)}
        />
      )}
      {kind === "blog" && (
        <Input
          className={inputClass}
          placeholder="Tags, comma separated"
          value={draft.tags || ""}
          onChange={(event) => onChange("tags", event.target.value)}
        />
      )}
      <textarea
        required
        className={textareaClass}
        placeholder="Content"
        value={draft.content || ""}
        onChange={(event) => onChange("content", event.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ContentStatusSelect
          status={draft.status || "DRAFT"}
          onChange={(value) => onChange("status", value)}
        />
        <Input
          className={inputClass}
          placeholder="SEO title"
          value={draft.metaTitle || ""}
          onChange={(event) => onChange("metaTitle", event.target.value)}
        />
      </div>
    </>
  );
}

function ContentStatusSelect({
  status,
  onChange,
}: {
  status: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className={selectClass}
      value={status}
      onChange={(event) => onChange(event.target.value)}
    >
      {["DRAFT", "PUBLISHED", "ARCHIVED"].map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

function defaultContentDraft(kind: ContentKind) {
  if (kind === "faq")
    return { question: "", answer: "", category: "General", status: "PUBLISHED" };
  if (kind === "announcement")
    return {
      title: "",
      message: "",
      channel: "IN_APP",
      audience: "ALL",
      status: "DRAFT",
    };
  return { title: "", slug: "", excerpt: "", content: "", status: "DRAFT", metaTitle: "" };
}

function contentToDraft(kind: ContentKind, item: any) {
  if (kind === "faq")
    return {
      question: item.question,
      answer: item.answer,
      category: item.category,
      status: item.status,
    };
  if (kind === "announcement")
    return {
      title: item.title,
      message: item.message,
      channel: item.channel,
      audience: item.audience,
      status: item.status,
      startsAt: toDateTimeInput(item.startsAt),
    };
  return {
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: item.content,
    coverImageUrl: item.coverImageUrl,
    tags: item.tags?.join(", "),
    status: item.status,
    metaTitle: item.seo?.metaTitle,
  };
}

function contentPayload(kind: ContentKind, draft: Record<string, any>) {
  if (kind === "faq")
    return {
      question: draft.question,
      answer: draft.answer,
      category: draft.category || "General",
      status: draft.status || "PUBLISHED",
    };
  if (kind === "announcement")
    return {
      title: draft.title,
      message: draft.message,
      channel: draft.channel || "IN_APP",
      audience: draft.audience || "ALL",
      status: draft.status || "DRAFT",
      startsAt: draft.startsAt || undefined,
    };
  return {
    title: draft.title,
    slug: draft.slug || undefined,
    excerpt: draft.excerpt || undefined,
    content: draft.content,
    coverImageUrl: kind === "blog" ? draft.coverImageUrl || undefined : undefined,
    tags: kind === "blog" ? splitComma(draft.tags) : undefined,
    status: draft.status || "DRAFT",
    seo: draft.metaTitle ? { metaTitle: draft.metaTitle } : undefined,
  };
}

function contentLabel(kind: ContentKind) {
  return kind === "cms"
    ? "CMS Page"
    : kind === "faq"
    ? "FAQ"
    : kind === "blog"
    ? "Blog Post"
    : "Announcement";
}

function contentTitle(kind: ContentKind, item: any) {
  return kind === "faq" ? item.question : item.title;
}

function contentDescription(kind: ContentKind, item: any) {
  if (kind === "faq") return item.category || "General";
  if (kind === "announcement") return item.message;
  return item.excerpt || item.slug || item.content;
}

function contentStatuses(kind: ContentKind) {
  return kind === "announcement"
    ? ["ALL", "DRAFT", "SCHEDULED", "SENT", "ARCHIVED"]
    : ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"];
}

function contentCsvRows(kind: ContentKind, rows: any[]) {
  return [
    ["Title", "Status", "Created"],
    ...rows.map((item) => [
      contentTitle(kind, item),
      item.status,
      item.createdAt || "",
    ]),
  ];
}
