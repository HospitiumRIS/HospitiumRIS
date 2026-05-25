const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'africa_kenya_medical_research_grants.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get the data
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('=== EXCEL FILE ANALYSIS ===\n');
  console.log('Sheet Name:', sheetName);
  console.log('\nColumn Headers:');
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. "${header}"`);
    });
    
    console.log('\n=== FIRST 3 ROWS OF DATA ===\n');
    data.slice(0, 3).forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log('');
    });
    
    console.log(`\nTotal rows: ${data.length}`);
  } else {
    console.log('No data found in the Excel file');
  }
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}
