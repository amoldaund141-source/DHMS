const fs = require('fs');
const data = fs.readFileSync('vercel_bundle.js', 'utf8');
const match = data.match(/https:\/\/dhms[^\"'\`]+/);
console.log(match ? match[0] : 'NOT FOUND');
