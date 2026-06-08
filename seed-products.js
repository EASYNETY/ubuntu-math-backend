/**
 * Seed Industrial Cookbook + Patent Dossier metadata
 * Run: node seed-products.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
  { contentType: { type: String, required: true, index: true } },
  { timestamps: true, collection: 'analyticsevents', strict: false }
);
const M = mongoose.models.PC || mongoose.model('PC', Schema);

const COOKBOOK_RECIPES = [
  'Cold-process shea butter soap',
  'Baobab vitamin C powder (for immune support)',
  'Moringa seed water purification drops',
  'Marula oil lip balm',
  'Indigenous traditional antiseptic ointment (neem & aloe)',
  'Fermented rooibos iced tea concentrate',
  'Hand-pressed moringa cooking oil',
  'Natural indigo dye (zero-water method)',
  'Teff gluten-free sourdough starter',
  'Baobab fruit leather snack strips',
  'Neem leaf mosquito-repellent candle',
  'Rooibos anti-inflammatory face serum',
  'Marula seed shell activated charcoal',
  'Moringa leaf protein powder',
  'Shea butter hair growth pomade',
  'Aloe ferox burn gel',
  'Hoodia gordonii appetite-suppressant tea',
  'Kigelia firming body butter',
  "Devil's claw joint-relief tincture",
  'Pelargonium sidoides cough syrup',
  'Bitter kola antiviral throat lozenges',
  'Mongongo nut cooking oil',
  'Fonio gluten-free flour blend',
  'Baobab electrolyte sports drink',
  'Artemisinin anti-malarial herbal tea',
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Industrial Cookbook ──────────────────────────────────────────────────
  await M.findOneAndUpdate(
    { contentType: 'industrialprocess', slug: 'cams-industrial-cookbook' },
    {
      contentType: 'industrialprocess',
      title: 'CAMS Industrial Cookbook',
      slug: 'cams-industrial-cookbook',
      category: 'Food Processing',
      description: 'Practical, tested, step-by-step instructions for small-scale industrial production. 25 recipes derived from the CAMS 388-patent portfolio, translated into simple, safe, small-scale instructions.',
      previewContent: 'A single PDF download containing 25 practical recipes derived from the CAMS 388-patent portfolio. Translated into simple, safe, small-scale instructions for hobbyists, home-based producers, students, small co-operatives, and anyone who wants to make things rather than just read about them.',
      price: 9.99,
      published: true,
      version: '1.0',
      tags: ['soap', 'food', 'medicine', 'materials', 'small-scale', 'practical'],
      expectedOutput: '25 practical recipes, 45-page PDF, printable with photographs and safety notes',
      safetyNotes: 'All recipes include safety notes and are designed for small-scale production. No industrial chemicals required.',
      scalingInstructions: 'Each recipe includes scaling instructions from household (1-5 units) to small co-operative scale (50-100 units).',
      inputs: COOKBOOK_RECIPES.map((r, i) => ({ name: r, quantity: '1 batch', unit: 'Recipe ' + (i + 1) })),
      downloadCount: 0,
      purchaseCount: 0,
    },
    { upsert: true, new: true }
  );
  console.log('Industrial Cookbook seeded');

  // ── Patent Dossier metadata ──────────────────────────────────────────────
  await M.findOneAndUpdate(
    { contentType: 'patent_dossier_meta', slug: 'cams-patent-dossier-388' },
    {
      contentType: 'patent_dossier_meta',
      slug: 'cams-patent-dossier-388',
      title: 'CAMS Industrial Patent Dossier',
      totalPatents: 388,
      price: 1000,
      published: true,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true }
  );
  console.log('Patent Dossier meta seeded');

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(e => { console.error(e); process.exit(1); });
