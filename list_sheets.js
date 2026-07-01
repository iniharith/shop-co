/**
 * Coded by Harith
 * Kampungcetak ®
 */
const xlsx = require('xlsx');

const workbook = xlsx.readFile('prices.xlsx');
console.log('Sheets:', workbook.SheetNames);
