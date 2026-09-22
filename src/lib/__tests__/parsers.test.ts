import { beforeEach, describe, it, expect, vi } from 'vitest';
import { parseFileBuffer } from '../parsers';
import fs from 'fs';
import path from 'path';

const { mockPdfParse } = vi.hoisted(() => ({ mockPdfParse: vi.fn() }));

// Load fixtures
const testDataDir = path.join(process.cwd(), 'test_data');
const getFixture = (filename: string) => fs.readFileSync(path.join(testDataDir, filename));

vi.mock('pdf-parse/lib/pdf-parse.js', () => ({
  default: mockPdfParse,
}));

describe('parsers', () => {
  beforeEach(() => {
    mockPdfParse.mockResolvedValue({ numpages: 1, text: 'COMMERCIAL LEASE AGREEMENT text.' });
  });

  it('parses valid TXT', async () => {
    const buffer = getFixture('synthetic_nda.txt');
    const text = await parseFileBuffer(buffer, 'synthetic_nda.txt', 'text/plain');
    expect(text).toContain('NON-DISCLOSURE AGREEMENT');
  });

  it('parses valid PDF', async () => {
    const buffer = getFixture('lease_v1.pdf');
    const text = await parseFileBuffer(buffer, 'lease_v1.pdf', 'application/pdf');
    expect(text).toContain('COMMERCIAL LEASE AGREEMENT');
  });

  it('falls back to PDF text streams when the primary parser rejects a valid document', async () => {
    mockPdfParse.mockRejectedValueOnce(new Error('Primary parser rejected the document.'));
    const buffer = getFixture('lease_v1.pdf');
    const text = await parseFileBuffer(buffer, 'lease_v1.pdf', 'application/pdf');
    expect(text).toContain('RESIDENTIAL LEASE AGREEMENT');
  });

  it('parses valid DOCX', async () => {
    const buffer = getFixture('lease_v1.docx');
    const text = await parseFileBuffer(buffer, 'lease_v1.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(text).toContain('RESIDENTIAL LEASE AGREEMENT');
  });

  it('rejects PDF with wrong magic bytes', async () => {
    // A docx file but labelled as pdf
    const buffer = getFixture('lease_v1.docx');
    await expect(parseFileBuffer(buffer, 'fake.pdf', 'application/pdf')).rejects.toThrow('Invalid PDF format signature.');
  });

  it('rejects file larger than MAX_UPLOAD_SIZE', async () => {
    // Mock the constant or use a huge buffer
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
    await expect(parseFileBuffer(largeBuffer, 'large.txt', 'text/plain')).rejects.toThrow('File is too large');
  });
});
