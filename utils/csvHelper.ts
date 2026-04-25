import { Transaction, TransactionType } from '../types';

export const generateCSV = (transactions: Transaction[], books: any[], categories: any[]): string => {
  const headers = ['Date', 'Time', 'Book', 'Type', 'Category', 'Amount', 'Note', 'Tags', 'TransactionID'];
  
  const rows = transactions.map(tx => {
    const bookName = books.find(b => b.id === tx.bookId)?.name || 'Unknown Book';
    const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized';
    
    // Escape quotes and wrap in quotes to handle commas in notes/names
    const escape = (val: string | number | undefined) => `"${String(val || '').replace(/"/g, '""')}"`;
    const tagStr = tx.tags ? tx.tags.join('|') : '';

    return [
      escape(new Date(tx.date).toISOString().split('T')[0]),
      escape(tx.time || ''),
      escape(bookName),
      escape(tx.type),
      escape(catName),
      escape(tx.amount),
      escape(tx.note),
      escape(tagStr),
      escape(tx.id)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Simple CSV parser - assumes standard format
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    // Regex to handle commas inside quotes
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const row: any = {};
    
    // Clean up quotes
    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));

    if (cleanValues.length > 0) {
      headers.forEach((header, index) => {
        row[header] = cleanValues[index];
      });
      data.push(row);
    }
  }
  return data;
};

export const SAMPLE_CSV = `Date,Time,Book,Type,Category,Amount,Note,Tags,TransactionID
2023-10-25,12:30,Personal Savings,EXPENSE,Food & Dining,25.50,Lunch with team,Lunch|Work,
2023-10-26,09:00,Business Account,INCOME,Salary,5000,October Salary,,
2023-10-27,15:45,Personal Savings,EXPENSE,Transportation,15.00,Uber,Travel,
`;
