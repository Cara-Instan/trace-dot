import { getPdfMetadata } from "../pdf/index";

export async function buildFileResult(filePath: string, filename?: string) {
  const metadata = await getPdfMetadata(filePath);
  return {
    filename: filename ?? filePath.split(/[/\\]/).pop() ?? filePath,
    filePath,
    pageCount: metadata.pageCount,
    fileSize: metadata.fileSize,
  };
}
