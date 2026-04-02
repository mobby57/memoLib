import { ZeroRiskExport } from '@/lib/zero-risk-export';

describe('ZeroRiskExport', () => {
  const originalCreateElement = document.createElement.bind(document);
  const originalBlob = global.Blob;

  beforeEach(() => {
    jest.restoreAllMocks();

    (global as any).Blob = class MockBlob {
      private parts: any[];

      constructor(parts: any[]) {
        this.parts = parts;
      }

      async text() {
        return this.parts.map((part) => String(part)).join('');
      }
    };

    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(() => 'blob:mock-url'),
      configurable: true,
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      value: jest.fn(),
      configurable: true,
    });
  });

  afterEach(() => {
    (global as any).Blob = originalBlob;
  });

  describe('exportToCSV', () => {
    it('exports escaped CSV content and triggers download', async () => {
      const click = jest.fn();
      const anchor = { href: '', download: '', click } as any;

      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName.toLowerCase() === 'a') {
          return anchor;
        }
        return originalCreateElement(tagName);
      });

      ZeroRiskExport.exportToCSV(
        [{ name: 'John "Doe"', city: 'Paris' }],
        'clients'
      );

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
      const text = await blob.text();

      expect(text).toContain('name,city');
      expect(text).toContain('"John ""Doe""","Paris"');
      expect(anchor.download).toBe('clients.csv');
      expect(click).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('importFromCSV', () => {
    it('imports rows from a CSV file', async () => {
      const file = {
        name: 'users.csv',
        text: async () => 'name,city\nAlice,Paris\nBob,Lyon',
      } as File;

      const rows = await ZeroRiskExport.importFromCSV(file);

      expect(rows).toEqual([
        { name: 'Alice', city: 'Paris' },
        { name: 'Bob', city: 'Lyon' },
      ]);
    });

    it('rejects non-csv files', async () => {
      const file = { name: 'users.json' } as File;

      await expect(ZeroRiskExport.importFromCSV(file)).rejects.toThrow(
        'Seuls les fichiers CSV sont autorises'
      );
    });
  });

  describe('exportToJSON', () => {
    it('exports JSON content and triggers download', async () => {
      const click = jest.fn();
      const anchor = { href: '', download: '', click } as any;

      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName.toLowerCase() === 'a') {
          return anchor;
        }
        return originalCreateElement(tagName);
      });

      ZeroRiskExport.exportToJSON([{ id: 1, name: 'Alice' }], 'users');

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
      const text = await blob.text();

      expect(JSON.parse(text)).toEqual([{ id: 1, name: 'Alice' }]);
      expect(anchor.download).toBe('users.json');
      expect(click).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('importFromJSON', () => {
    it('imports JSON payload', async () => {
      const file = {
        name: 'payload.json',
        text: async () => JSON.stringify([{ id: 7 }]),
      } as File;

      const data = await ZeroRiskExport.importFromJSON(file);
      expect(data).toEqual([{ id: 7 }]);
    });

    it('rejects non-json files', async () => {
      const file = { name: 'payload.csv' } as File;

      await expect(ZeroRiskExport.importFromJSON(file)).rejects.toThrow(
        'Seuls les fichiers JSON sont autorises'
      );
    });
  });
});
