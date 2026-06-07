import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

export interface PdfMetadata {
  pageCount: number;
  fileSize: number;
}

export interface OutputFile {
  name: string;
  path: string;
  size: number;
  pages: number[];
}

export type SplitConfig =
  | { mode: "selected"; pages: number[] }
  | { mode: "range"; ranges: Array<{ start: number; end: number }> }
  | { mode: "every"; interval: number };

export async function getPdfMetadata(filePath: string): Promise<PdfMetadata> {
  const fileBuffer = await Bun.file(filePath).arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const fileSize = fs.statSync(filePath).size;
  return {
    pageCount: pdfDoc.getPageCount(),
    fileSize,
  };
}

export async function splitPdf(
  filePath: string,
  config: SplitConfig,
  filenamePattern: string,
  outputPath: string,
  onProgress?: (current: number, total: number) => void,
): Promise<OutputFile[]> {
  const fileBuffer = await Bun.file(filePath).arrayBuffer();
  const sourceDoc = await PDFDocument.load(fileBuffer);
  const totalPages = sourceDoc.getPageCount();
  const baseName = path.basename(filePath, ".pdf");

  const pageGroups = resolvePageGroups(config, totalPages);

  const outputFiles: OutputFile[] = [];

  for (let i = 0; i < pageGroups.length; i++) {
    const pages = pageGroups[i];
    const newDoc = await PDFDocument.create();

    const copiedPages = await newDoc.copyPages(
      sourceDoc,
      pages.map((p) => p - 1),
    );
    copiedPages.forEach((page) => newDoc.addPage(page));

    const pdfBytes = await newDoc.save();
    const fileName = filenamePattern
      .replaceAll("{name}", baseName)
      .replaceAll("{n}", String(i + 1).padStart(2, "0"));
    const filePath_out = path.join(outputPath, fileName);

    await Bun.write(filePath_out, pdfBytes);

    outputFiles.push({
      name: fileName,
      path: filePath_out,
      size: pdfBytes.byteLength,
      pages,
    });

    onProgress?.(i + 1, pageGroups.length);
  }

  return outputFiles;
}

function resolvePageGroups(
  config: SplitConfig,
  totalPages: number,
): number[][] {
  switch (config.mode) {
    case "selected":
      return [config.pages.sort((a, b) => a - b)];

    case "range":
      return config.ranges
        .filter((r) => r.start >= 1 && r.start <= r.end)
        .map((r) => {
          const pages: number[] = [];
          for (let p = r.start; p <= r.end && p <= totalPages; p++) {
            pages.push(p);
          }
          return pages;
        })
        .filter((pages) => pages.length > 0);

    case "every": {
      const groups: number[][] = [];
      for (let start = 1; start <= totalPages; start += config.interval) {
        const pages: number[] = [];
        for (
          let p = start;
          p < start + config.interval && p <= totalPages;
          p++
        ) {
          pages.push(p);
        }
        groups.push(pages);
      }
      return groups;
    }
  }
}
