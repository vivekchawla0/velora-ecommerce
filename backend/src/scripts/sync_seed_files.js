const fs = require('fs');
const path = require('path');

const { newProductsData, newCategoriesData } = require('./catalogExpansionData');

// Replace any 404 or broken URLs in catalogExpansionData.js
let catalogContent = fs.readFileSync(path.join(__dirname, 'catalogExpansionData.js'), 'utf8');

const urlReplacements = [
  {
    old: 'https://images.unsplash.com/photo-1609592807901-447a13d7195d?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
  },
  {
    old: 'https://images.unsplash.com/photo-1584990347449-399066f120df?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80',
  },
  {
    old: 'https://images.unsplash.com/photo-1611591475155-4286fa7c2e7f?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
  },
  {
    old: 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd45?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    old: 'https://images.unsplash.com/photo-1580481077197-20cb56711786?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80',
  },
  {
    old: 'https://images.unsplash.com/photo-1585792180666-f75a794f8876?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80',
  },
  {
    old: 'https://images.unsplash.com/photo-1622445262464-84b14e074551?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
  },
  {
    old: 'https://images.unsplash.com/photo-1608248597368-07e80f2d93e1?w=800&auto=format&fit=crop&q=80',
    new: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80',
  },
];

for (const r of urlReplacements) {
  while (catalogContent.includes(r.old)) {
    catalogContent = catalogContent.replace(r.old, r.new);
  }
}

fs.writeFileSync(path.join(__dirname, 'catalogExpansionData.js'), catalogContent, 'utf8');
console.log('✓ Synchronized catalogExpansionData.js with verified image URLs.');

// Also check seed.js
let seedContent = fs.readFileSync(path.join(__dirname, 'seed.js'), 'utf8');
for (const r of urlReplacements) {
  while (seedContent.includes(r.old)) {
    seedContent = seedContent.replace(r.old, r.new);
  }
}
fs.writeFileSync(path.join(__dirname, 'seed.js'), seedContent, 'utf8');
console.log('✓ Synchronized seed.js with verified image URLs.');
