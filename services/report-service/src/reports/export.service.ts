import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportFormat } from './enums/report-format.enum';
import {
  collectColumns,
  normalizeRowsForExport,
  serializeCell,
} from './export-row.util';

export interface ExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export interface ReportSection {
  title: string;
  rows: Record<string, unknown>[];
}

@Injectable()
export class ExportService {
  async export(
    title: string,
    rows: Record<string, unknown>[],
    format: ReportFormat,
  ): Promise<ExportResult> {
    const normalized = normalizeRowsForExport(rows);
    switch (format) {
      case ReportFormat.PDF:
        return this.toPdf(title, normalized);
      case ReportFormat.XLSX:
        return this.toXlsx(title, normalized);
      case ReportFormat.CSV:
      default:
        return this.toCsv(title, normalized);
    }
  }

  async exportSections(
    title: string,
    sections: ReportSection[],
    format: ReportFormat,
  ): Promise<ExportResult> {
    switch (format) {
      case ReportFormat.PDF:
        return this.toPdfSections(title, sections);
      case ReportFormat.XLSX:
        return this.toXlsxSections(title, sections);
      case ReportFormat.CSV:
      default:
        return this.toCsvSections(title, sections);
    }
  }

  private getColumns(rows: Record<string, unknown>[]): string[] {
    if (!rows.length) return ['message'];
    return collectColumns(rows);
  }

  private async toCsv(title: string, rows: Record<string, unknown>[]): Promise<ExportResult> {
    const columns = this.getColumns(rows);
    const header = columns.join(',');
    const body = rows
      .map((row) =>
        columns
          .map((col) => {
            const str = serializeCell(row[col]);
            return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(','),
      )
      .join('\n');

    const content = rows.length ? `${header}\n${body}` : `${header}\nNo records found.`;
    return {
      buffer: Buffer.from(content, 'utf-8'),
      contentType: 'text/csv',
      filename: `${title}.csv`,
    };
  }

  private async toCsvSections(
    title: string,
    sections: ReportSection[],
  ): Promise<ExportResult> {
    const parts = sections.map((section) => {
      const normalized = normalizeRowsForExport(section.rows);
      const columns = this.getColumns(normalized);
      const header = columns.join(',');
      const body = normalized
        .map((row) =>
          columns.map((col) => serializeCell(row[col])).join(','),
        )
        .join('\n');
      return [`# ${section.title}`, header, body].filter(Boolean).join('\n');
    });
    return {
      buffer: Buffer.from(parts.join('\n\n'), 'utf-8'),
      contentType: 'text/csv',
      filename: `${title}.csv`,
    };
  }

  private async toXlsx(title: string, rows: Record<string, unknown>[]): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title.slice(0, 31));
    const columns = this.getColumns(rows);

    sheet.addRow(columns);
    for (const row of rows) {
      sheet.addRow(columns.map((col) => serializeCell(row[col])));
    }
    if (!rows.length) {
      sheet.addRow(['No records found.']);
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${title}.xlsx`,
    };
  }

  private async toXlsxSections(
    title: string,
    sections: ReportSection[],
  ): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    for (const [index, section] of sections.entries()) {
      const normalized = normalizeRowsForExport(section.rows);
      const sheetName = section.title.slice(0, 31) || `Sheet${index + 1}`;
      const sheet = workbook.addWorksheet(sheetName);
      const columns = this.getColumns(normalized);
      sheet.addRow(columns);
      for (const row of normalized) {
        sheet.addRow(columns.map((col) => serializeCell(row[col])));
      }
      if (!normalized.length) {
        sheet.addRow(['No records found.']);
      }
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${title}.xlsx`,
    };
  }

  private async toPdf(title: string, rows: Record<string, unknown>[]): Promise<ExportResult> {
    return this.renderPdf((doc) => {
      this.writePdfTable(doc, title, rows);
    }, title);
  }

  private async toPdfSections(
    title: string,
    sections: ReportSection[],
  ): Promise<ExportResult> {
    return this.renderPdf((doc) => {
      doc.fontSize(16).text(title, { underline: true });
      doc.moveDown();
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(`Generated: ${new Date().toLocaleString()}`);
      doc.fillColor('#000000');
      doc.moveDown();

      for (const section of sections) {
        this.writePdfTable(doc, section.title, normalizeRowsForExport(section.rows), {
          includeReportTitle: false,
        });
        doc.moveDown();
      }
    }, title);
  }

  private async renderPdf(
    write: (doc: InstanceType<typeof PDFDocument>) => void,
    filename: string,
  ): Promise<ExportResult> {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const finished = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    write(doc);
    doc.end();
    const buffer = await finished;

    return {
      buffer,
      contentType: 'application/pdf',
      filename: `${filename}.pdf`,
    };
  }

  private writePdfTable(
    doc: InstanceType<typeof PDFDocument>,
    sectionTitle: string,
    rows: Record<string, unknown>[],
    options?: { includeReportTitle?: boolean },
  ) {
    const includeReportTitle = options?.includeReportTitle ?? true;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const left = doc.page.margins.left;
    const tableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    if (includeReportTitle) {
      doc.fontSize(16).text(sectionTitle, { underline: true });
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(`Generated: ${new Date().toLocaleString()}`);
      doc.fillColor('#000000');
      doc.moveDown();
    } else {
      doc.fontSize(12).text(sectionTitle, { underline: true });
      doc.moveDown(0.5);
    }

    if (!rows.length) {
      doc.fontSize(10).text('No records found.');
      return;
    }

    const columns = collectColumns(rows);
    const colWidth = Math.min(120, tableWidth / columns.length);
    const rowHeight = 18;
    const headerHeight = 22;

    const drawHeader = () => {
      let x = left;
      const y = doc.y;
      doc.rect(left, y, tableWidth, headerHeight).fill('#f3f4f6');
      doc.fillColor('#111827').fontSize(8);
      for (const col of columns) {
        doc.text(col, x + 4, y + 6, { width: colWidth - 8, lineBreak: false });
        x += colWidth;
      }
      doc.fillColor('#000000');
      doc.y = y + headerHeight;
    };

    const ensureSpace = (height: number) => {
      if (doc.y + height > pageBottom) {
        doc.addPage();
        drawHeader();
      }
    };

    drawHeader();

    for (const row of rows) {
      ensureSpace(rowHeight);
      let x = left;
      const y = doc.y;
      doc.fontSize(7).fillColor('#374151');
      for (const col of columns) {
        doc.text(serializeCell(row[col]), x + 4, y + 4, {
          width: colWidth - 8,
          height: rowHeight - 4,
          ellipsis: true,
        });
        x += colWidth;
      }
      doc.fillColor('#000000');
      doc
        .moveTo(left, y + rowHeight)
        .lineTo(left + tableWidth, y + rowHeight)
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .stroke();
      doc.y = y + rowHeight;
    }
  }
}
