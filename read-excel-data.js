// Excel File Reader for Sarkari Ai
// This script reads the uploaded Excel file and processes job data

const fs = window.fs || require('fs');
const XLSX = require('xlsx');

// Read Excel file
async function readJobsFromExcel(filename = 'SarkariAlert_JobData2 6.xlsx') {
    try {
        // Read the Excel file
        const data = await window.fs.readFile(filename);
        
        // Parse Excel
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Excel data loaded:', jsonData);
        return jsonData;
        
    } catch (error) {
        console.error('Error reading Excel:', error);
        return [];
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { readJobsFromExcel };
}