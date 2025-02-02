const XLSX = require('xlsx');

class BankStatementAnalyzer {
  constructor(filePath) {
    console.debug('Initializing BankStatementAnalyzer with file:', filePath);
    this.filePath = filePath;
    this.transactions = [];
    this.categories = {
      Groceries: ['grocery', 'supermarket', 'store'],
      Loan: ['loan', 'emi', 'mortgage'],
      Transport: ['uber', 'ola', 'bus', 'metro', 'fuel', 'petrol', 'diesel'],
      FoodDelivery: ['swiggy', 'zomato', 'blinkit', 'zepto'],
      Bills: ['electricity', 'water', 'gas', 'internet', 'mobile'],
      Shopping: ['amazon', 'flipkart', 'myntra', 'shoppers stop', 'lifestyle', 'pantaloons'],
      Medical: ['hospital', 'pharmacy', 'doctor', 'medicine'],
      Other: []
    };
  }

  getTransactions(data) {
    // Identify the header row
    let startRow = -1;
    let endRow = -1;
    //console.log(data);
    for (let i = 0; i < data.length; i++) {
      console.log(data[i]);
      if (data[i] && data[i]['__EMPTY'] && data[i]['__EMPTY_1'] && data[i]['__EMPTY_2']) {
        if (data[i]['__EMPTY'].includes("Narration") && data[i].__EMPTY_1.includes('Chq./Ref.No.')) {
          startRow = i + 1;
          i = i + 1;
          continue;
        }
        if (data[i]['__EMPTY'].includes('**********************************')) {
          endRow = i;
          break;
        }
      }
    }

    // Ensure startRow is found
    if (startRow === -1) {
      console.error("Header row not found!");
      process.exit(1);
    }

    // Extract transactions
    const transactions = [];

    for (let i = startRow + 1; i < (endRow !== -1 ? endRow : data.length); i++) {
      let row = data[i];

      transactions.push({
        Date: row['HDFC BANK Ltd.                                      Page No .:   1                                          Statement of accounts'],
        Narration: row['__EMPTY'],
        Withdrawal: row['__EMPTY_3'] || 0,
        Deposit: row['__EMPTY_4'] || 0,
      });
    }

    // Output result
    //console.log(transactions);
    return transactions;
  }

  // Read Excel file and parse transactions
  readExcel() {
    console.debug('Reading Excel file:', this.filePath);
    const workbook = XLSX.readFile(this.filePath);
    const sheetName = workbook.SheetNames[0];
    console.debug('Processing sheet:', sheetName);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    //console.debug('Extracted data:', data);
    //this.transactions = this.getTransactions(data);
    this.transactions = this.getTransactions(data).map((row) => {
      const amount = parseFloat(row.Deposit) || -parseFloat(row.Withdrawal);
      const txn = {
        date: row.Date,
        description: row.Narration,
        amount: amount,
        type: amount > 0 ? 'Credit' : 'Debit',
      };
      console.debug('Processed transaction:', txn);
      return txn;
    });
    this.categorizeTransactions();
  }

  // Categorize transactions
  categorizeTransactions() {
    console.debug('Categorizing transactions with predefined categories');
    this.transactions.forEach((txn) => {
      txn.category = Object.keys(this.categories).find((key) =>
        this.categories[key].some((word) => txn.description.toLowerCase().includes(word))
      ) || 'Other';
      console.debug('Transaction categorized:', txn);
    });
  }

  // Generate a detailed summary report
  generateReport() {
    console.debug('Generating detailed summary report...');
    const totalIncome = this.transactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = this.transactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome + totalExpenses;

    const categoryWiseExpenses = this.transactions.reduce((acc, txn) => {
      if (txn.type === 'Debit') {
        acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
      }
      return acc;
    }, {});

    const report = { totalIncome, totalExpenses, balance, categoryWiseExpenses, transactions: this.transactions };
    console.debug('Generated report:', report);
    return report;
  }
}

module.exports = BankStatementAnalyzer;