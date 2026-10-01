import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStorageStats } from "@/lib/drive";
import { DriveBrowser } from "@/components/drive/drive-browser";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DrivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const folderId = (Array.isArray(params.folder) ? params.folder[0] : params.folder) || null;

  // Breadcrumb: chuỗi thư mục cha
  const breadcrumb: { id: string; name: string }[] = [];
  let current = folderId
    ? await prisma.folder.findUnique({ where: { id: folderId } })
    : null;
  if (folderId && !current) notFound();
  let cursor = current;
  while (cursor) {
    breadcrumb.unshift({ id: cursor.id, name: cursor.name });
    cursor = cursor.parentId
      ? await prisma.folder.findUnique({ where: { id: cursor.parentId } })
      : null;
  }

  const [folders, files, stats, allFolders] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: folderId },
      orderBy: { name: "asc" },
      include: { _count: { select: { children: true, files: true } } },
    }),
    prisma.storedFile.findMany({
      where: { folderId },
      orderBy: { name: "asc" },
    }),
    getStorageStats(),
    prisma.folder.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <DriveBrowser
      currentFolderId={folderId}
      breadcrumb={breadcrumb}
      folders={folders.map((f) => ({
        id: f.id,
        name: f.name,
        isPublic: f.isPublic,
        childCount: f._count.children + f._count.files,
      }))}
      files={files.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        createdAt: f.createdAt.toISOString(),
      }))}
      stats={stats}
      allFolders={allFolders}
    />
  );
}
