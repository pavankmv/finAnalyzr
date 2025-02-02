const path = require('path');
const { program } = require('commander');
const BankStatementAnalyzer = require('../index'); // Import the BankStatementAnalyzer class from index.js

// CLI Configuration
program
    .name('finAnalyzr')
    .description('Analyze bank statements from Excel files')
    .version('1.0.0-beta.0')
    .addHelpText('after', `
Examples:
  $ finAnalyzr analyze -b HDFC -f /path/to/your/excel-file.xlsx
  $ finAnalyzr --version
  $ finAnalyzr --help
  `)
    .option("-b, --bank <name>", "Specify the bank name (HDFC, ICICI, SBI)")
    .option("-f, --file <path>", "Path to the bank statement (.xls or .xlsx)");

program
    .command('analyze')
    .description('Analyze the given bank statement file')
    .action(() => {
        const options = program.opts();

        // Validate inputs
        if (!options.bank || !options.file) {
            console.error("\n❌ Error: Both bank name and file path are required.\n");
            program.help();
            process.exit(1);
        }

        // Supported Banks
        const supportedBanks = ["HDFC", "ICICI", "SBI"];
        if (!supportedBanks.includes(options.bank.toUpperCase())) {
            console.error(`\n❌ Error: Unsupported bank. Supported banks: ${supportedBanks.join(", ")}\n`);
            process.exit(1);
        }

        // Load the Excel file
        const filePath = path.resolve(options.file);
        console.debug('Resolved file path:', filePath);

        // Initialize and run the analyzer
        const analyzer = new BankStatementAnalyzer(filePath);
        analyzer.readExcel();
        const report = analyzer.generateReport();
        console.log('Report:', report);
    });

program.parse(process.argv);