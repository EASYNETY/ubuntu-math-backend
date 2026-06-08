/**
 * CAMS Essays Batch Upload Script
 * ================================
 * Uploads all PDFs from ../essays/ to Cloudinary
 * and seeds the database with full essay metadata.
 *
 * Usage:
 *   node batch-upload-essays.js
 *
 * Required env vars (in .env):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   MONGODB_URI
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const mongoose = require('mongoose');

// ── Config ────────────────────────────────────────────────────────────────────

const ESSAYS_DIR = path.join(__dirname, '..', 'essays');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

cloudinary.config({
  cloud_name: 'dqxse01f2',
  api_key:    324776629951427,
  api_secret: '08VyFSs_E9-YfqRr1JRtiu2FI0U',
  secure: true,
});

// ── Essay metadata catalog ────────────────────────────────────────────────────
// Maps filename (without .PDF) → full metadata

const ESSAY_CATALOG = {
  '1 to 8% KhoiSan FV': {
    title: '1 to 8% KhoiSan FV',
    author: 'CAMS Research Institute',
    description: 'Analysis of KhoiSan genetic markers and their significance in understanding African population genetics and heritage.',
    category: 'History & Identity',
    tags: ['KhoiSan', 'genetics', 'heritage', 'Africa', 'identity'],
    seriesNumber: 1,
  },
  '1 Ubuntu as Economic Ideology': {
    title: 'Ubuntu as Economic Ideology',
    author: 'CAMS Research Institute',
    description: 'Foundational essay exploring Ubuntu as a complete economic ideology, contrasting it with capitalism and socialism.',
    category: 'Economics & Philosophy',
    tags: ['Ubuntu', 'economics', 'ideology', 'philosophy', 'Africa'],
    seriesNumber: 2,
  },
  '1 Ubuntu in Numbers': {
    title: 'Ubuntu in Numbers',
    author: 'CAMS Research Institute',
    description: 'Quantitative analysis of Ubuntu principles through mathematical frameworks and numerical models.',
    category: 'Mathematics & Economics',
    tags: ['Ubuntu', 'mathematics', 'quantitative', 'economics', 'analysis'],
    seriesNumber: 3,
  },
  '1 Ubuntu Intro(1)': {
    title: 'Ubuntu Introduction',
    author: 'CAMS Research Institute',
    description: 'Introductory essay to Ubuntu philosophy, its origins, principles, and application to modern African development.',
    category: 'Philosophy & Culture',
    tags: ['Ubuntu', 'introduction', 'philosophy', 'Africa', 'culture'],
    seriesNumber: 4,
  },
  '1-Invisible-Hand': {
    title: 'The Invisible Hand Reimagined',
    author: 'CAMS Research Institute',
    description: "Critique and reimagining of Adam Smith's invisible hand through the lens of Ubuntu economics and African sovereignty.",
    category: 'Economics & Philosophy',
    tags: ['invisible hand', 'economics', 'Ubuntu', 'sovereignty', 'critique'],
    seriesNumber: 5,
  },
  '2 Ubuntu Currency': {
    title: 'Ubuntu Currency',
    author: 'CAMS Research Institute',
    description: 'Design principles for an Ubuntu-based currency system that reflects communal value creation and sovereign wealth.',
    category: 'Finance & Economics',
    tags: ['currency', 'Ubuntu', 'finance', 'sovereignty', 'monetary policy'],
    seriesNumber: 6,
  },
  '2 Ubuntu Sovereign Economics': {
    title: 'Ubuntu Sovereign Economics',
    author: 'CAMS Research Institute',
    description: 'Comprehensive framework for sovereign economic systems based on Ubuntu principles and African resource control.',
    category: 'Economics & Sovereignty',
    tags: ['sovereign economics', 'Ubuntu', 'Africa', 'resources', 'independence'],
    seriesNumber: 7,
  },
  '2-Redo-the-Math-1': {
    title: 'Redo the Math',
    author: 'CAMS Research Institute',
    description: 'Recalculating African wealth, trade balances, and resource flows using Ubuntu mathematics and sovereign accounting.',
    category: 'Mathematics & Economics',
    tags: ['mathematics', 'wealth', 'Ubuntu', 'accounting', 'Africa'],
    seriesNumber: 8,
  },
  '3 Ubuntu Curriculum': {
    title: 'Ubuntu Curriculum',
    author: 'CAMS Research Institute',
    description: 'Educational framework for teaching Ubuntu principles, mathematics, and sovereign economics in African schools.',
    category: 'Education & Curriculum',
    tags: ['curriculum', 'education', 'Ubuntu', 'teaching', 'Africa'],
    seriesNumber: 9,
  },
  '3 Ubuntu Resources Tech Stack': {
    title: 'Ubuntu Resources Tech Stack',
    author: 'CAMS Research Institute',
    description: 'Technical architecture for managing African resources using Ubuntu principles, blockchain, and sovereign data systems.',
    category: 'Technology & Resources',
    tags: ['technology', 'resources', 'Ubuntu', 'architecture', 'blockchain'],
    seriesNumber: 10,
  },
  '3-Sovereign-Doctrine': {
    title: 'Sovereign Doctrine',
    author: 'CAMS Research Institute',
    description: 'Legal and philosophical foundations for African sovereignty, covering territorial rights, resource ownership, and self-determination.',
    category: 'Politics & Law',
    tags: ['sovereignty', 'doctrine', 'law', 'Africa', 'rights'],
    seriesNumber: 11,
  },
  '4 Ubuntu Food Security': {
    title: 'Ubuntu Food Security',
    author: 'CAMS Research Institute',
    description: 'Framework for achieving food sovereignty in Africa through Ubuntu agricultural models and communal farming systems.',
    category: 'Agriculture & Security',
    tags: ['food security', 'Ubuntu', 'agriculture', 'Africa', 'sovereignty'],
    seriesNumber: 12,
  },
  '5 Ubuntu Oceans': {
    title: 'Ubuntu Oceans',
    author: 'CAMS Research Institute',
    description: "Managing Africa's maritime resources through Ubuntu blue economy principles and sovereign ocean governance.",
    category: 'Maritime & Environment',
    tags: ['oceans', 'blue economy', 'Ubuntu', 'maritime', 'Africa'],
    seriesNumber: 13,
  },
  '6 Ubuntu Dashboards': {
    title: 'Ubuntu Dashboards',
    author: 'CAMS Research Institute',
    description: 'Data visualization and monitoring frameworks for tracking Ubuntu economic indicators and sovereign wealth metrics.',
    category: 'Technology & Analytics',
    tags: ['dashboards', 'data', 'Ubuntu', 'analytics', 'visualization'],
    seriesNumber: 14,
  },
  '7 Ubuntu Epilogue': {
    title: 'Ubuntu Epilogue',
    author: 'CAMS Research Institute',
    description: 'Concluding reflections on the Ubuntu economic framework and its potential to transform African development.',
    category: 'Philosophy & Conclusion',
    tags: ['epilogue', 'Ubuntu', 'conclusion', 'philosophy', 'Africa'],
    seriesNumber: 15,
  },
  '8 Bonus Essay Bukra Framework': {
    title: 'Bonus Essay: Bukra Framework',
    author: 'CAMS Research Institute',
    description: 'Introduction to the Bukra Framework for future-oriented planning and intergenerational wealth building in Africa.',
    category: 'Strategy & Planning',
    tags: ['Bukra', 'framework', 'planning', 'future', 'Africa'],
    seriesNumber: 16,
  },
  '9 The Ubuntu Engines': {
    title: 'The Ubuntu Engines',
    author: 'CAMS Research Institute',
    description: "Deep dive into Africa's three sovereign engines (mining, farming, fishing) through Ubuntu economic analysis.",
    category: 'Economics & Resources',
    tags: ['Ubuntu engines', 'mining', 'farming', 'fishing', 'Africa'],
    seriesNumber: 17,
  },
  'AAA Reimagined': {
    title: 'AAA Reimagined',
    author: 'CAMS Research Institute',
    description: 'Reimagining credit ratings and financial assessment for African nations using Ubuntu metrics and sovereign indicators.',
    category: 'Finance & Economics',
    tags: ['credit rating', 'AAA', 'finance', 'Africa', 'assessment'],
    seriesNumber: 18,
  },
  'AFA Reimagined': {
    title: 'AFA Reimagined',
    author: 'CAMS Research Institute',
    description: 'Restructuring the African Football Association through Ubuntu governance and sovereign sports economics.',
    category: 'Sports & Governance',
    tags: ['AFA', 'football', 'sports', 'governance', 'Africa'],
    seriesNumber: 19,
  },
  'Africa-as-a-Maritime-Civilization-1 (2)': {
    title: 'Africa as a Maritime Civilization',
    author: 'CAMS Research Institute',
    description: "Historical and contemporary analysis of Africa's maritime heritage and potential as a leading ocean civilization.",
    category: 'History & Maritime',
    tags: ['maritime', 'civilization', 'oceans', 'Africa', 'history'],
    seriesNumber: 20,
  },
  'Afrophobia versus Xenophobia(8)': {
    title: 'Afrophobia versus Xenophobia',
    author: 'CAMS Research Institute',
    description: 'Critical analysis distinguishing Afrophobia from xenophobia, examining anti-African sentiment and its economic impacts.',
    category: 'Social Issues & Politics',
    tags: ['Afrophobia', 'xenophobia', 'discrimination', 'Africa', 'social issues'],
    seriesNumber: 21,
  },
  'AMA Reimagined': {
    title: 'AMA Reimagined',
    author: 'CAMS Research Institute',
    description: 'Restructuring African Minerals Association through Ubuntu resource governance and sovereign mining frameworks.',
    category: 'Resources & Governance',
    tags: ['AMA', 'minerals', 'mining', 'governance', 'Africa'],
    seriesNumber: 22,
  },
  'AMSA ReImaging': {
    title: 'AMSA Reimagined',
    author: 'CAMS Research Institute',
    description: 'Transforming the African Maritime Safety Authority through Ubuntu ocean governance and sovereign maritime policy.',
    category: 'Maritime & Safety',
    tags: ['AMSA', 'maritime', 'safety', 'governance', 'Africa'],
    seriesNumber: 23,
  },
  'AnI Surprises(2)': {
    title: 'AnI Surprises',
    author: 'CAMS Research Institute',
    description: 'Unexpected insights and revelations from African and Indigenous knowledge systems applied to modern challenges.',
    category: 'Knowledge & Innovation',
    tags: ['indigenous', 'knowledge', 'surprises', 'innovation', 'Africa'],
    seriesNumber: 24,
  },
  'CAMS City Renewal Essay 2025(1)': {
    title: 'CAMS City Renewal Essay 2025',
    author: 'CAMS Research Institute',
    description: 'Urban renewal framework for African cities using Ubuntu planning principles and sovereign infrastructure development.',
    category: 'Urban Planning & Development',
    tags: ['city renewal', 'urban planning', 'CAMS', 'infrastructure', 'Africa'],
    seriesNumber: 25,
  },
  'Capture of RSA Economic Arteries(3)': {
    title: 'Capture of RSA Economic Arteries',
    author: 'CAMS Research Institute',
    description: "Analysis of how South Africa's key economic infrastructure and resources have been captured and controlled.",
    category: 'Economics & Politics',
    tags: ['RSA', 'economic capture', 'infrastructure', 'South Africa', 'sovereignty'],
    seriesNumber: 26,
  },
  'KhoiSan 1st People(1)': {
    title: 'KhoiSan: First People',
    author: 'CAMS Research Institute',
    description: "Historical and cultural examination of the KhoiSan as Africa's first people and their contemporary rights.",
    category: 'History & Identity',
    tags: ['KhoiSan', 'first people', 'history', 'rights', 'Africa'],
    seriesNumber: 27,
  },
  'Racism As A Word': {
    title: 'Racism As A Word',
    author: 'CAMS Research Institute',
    description: 'Linguistic and conceptual analysis of racism as a term, its origins, usage, and implications for African discourse.',
    category: 'Social Issues & Language',
    tags: ['racism', 'language', 'discourse', 'social issues', 'Africa'],
    seriesNumber: 28,
  },
  'The Reign of The Serfs': {
    title: 'The Reign of The Serfs',
    author: 'CAMS Research Institute',
    description: 'Analysis of neo-feudal economic structures in post-colonial Africa and pathways to sovereign liberation.',
    category: 'Economics & Politics',
    tags: ['feudalism', 'economics', 'liberation', 'Africa', 'sovereignty'],
    seriesNumber: 29,
  },
  'Transatlantic Slavery(1)': {
    title: 'Transatlantic Slavery',
    author: 'CAMS Research Institute',
    description: 'Economic analysis of transatlantic slavery, its lasting impacts, and the mathematics of reparations and restitution.',
    category: 'History & Economics',
    tags: ['slavery', 'transatlantic', 'reparations', 'history', 'economics'],
    seriesNumber: 30,
  },
};

// ── Upload file to Cloudinary ─────────────────────────────────────────────────

function uploadToCloudinary(filePath, folder, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder,
      public_id: publicId,
      resource_type: 'raw',
      use_filename: false,
      overwrite: true,
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

// ── Mongoose model (inline, no new collection) ───────────────────────────────

const PlatformContentSchema = new mongoose.Schema(
  { contentType: { type: String, required: true, index: true } },
  { timestamps: true, collection: 'analyticsevents', strict: false }
);

const PlatformContent = mongoose.models.PlatformContent ||
  mongoose.model('PlatformContent', PlatformContentSchema);

// ── Main batch upload ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 CAMS Essays Batch Upload');
  console.log('='.repeat(50));
  console.log(`Essays directory: ${ESSAYS_DIR}`);
  console.log(`MongoDB URI: ${MONGODB_URI ? 'Set' : 'Not set'}`);

  // Validate Cloudinary config
  console.log('Validating Cloudinary config...');
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('\n❌ Missing Cloudinary credentials!');
    console.error('Add to your .env file:');
    console.error('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('  CLOUDINARY_API_KEY=your_api_key');
    console.error('  CLOUDINARY_API_SECRET=your_api_secret');
    process.exit(1);
  }

  // Connect to MongoDB
  console.log('\n📡 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Get all PDF files
  const files = fs.readdirSync(ESSAYS_DIR)
    .filter(f => f.endsWith('.PDF') || f.endsWith('.pdf'))
    .sort();

  console.log(`\n📝 Found ${files.length} PDF files\n`);

  const results = { success: [], failed: [], skipped: [] };

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const nameWithoutExt = filename.replace(/\.PDF$/i, '');
    const slug = nameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[()%]/g, '')
      .replace(/--+/g, '-');
    const filePath = path.join(ESSAYS_DIR, filename);
    const meta = ESSAY_CATALOG[nameWithoutExt];

    console.log(`\n[${i + 1}/${files.length}] ${filename}`);

    if (!meta) {
      console.log(`  ⚠️  No metadata found for: ${nameWithoutExt}`);
      console.log(`  ℹ️  Slug would be: ${slug}`);
      results.skipped.push(filename);
      continue;
    }

    console.log(`  📄 Title: ${meta.title}`);

    try {
      // Check if already uploaded
      const existing = await PlatformContent.findOne({ contentType: 'essay', slug });
      if (existing && existing.fileUrl) {
        console.log(`  ✅ Already uploaded — skipping`);
        results.skipped.push(filename);
        continue;
      }

      // Upload PDF to Cloudinary
      console.log(`  ⬆️  Uploading PDF...`);
      const publicId = `cams/essays/${slug}`;
      const uploadResult = await uploadToCloudinary(filePath, 'cams/essays', slug);
      const fileUrl = uploadResult.secure_url;
      console.log(`  ✅ PDF uploaded: ${fileUrl}`);

      // Upsert essay record in database
      const essayData = {
        contentType: 'essay',
        title: meta.title,
        slug,
        author: meta.author,
        description: meta.description,
        category: meta.category,
        tags: meta.tags,
        seriesNumber: meta.seriesNumber,
        price: 0, // Essays are free
        fileType: 'pdf',
        fileUrl,
        published: true,
        downloadCount: 0,
        viewCount: 0,
      };

      await PlatformContent.findOneAndUpdate(
        { contentType: 'essay', slug },
        essayData,
        { upsert: true, new: true }
      );

      console.log(`  ✅ Database record saved`);
      results.success.push(meta.title);

    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      results.failed.push({ file: filename, error: err.message });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  console.log('📊 BATCH UPLOAD COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Uploaded:  ${results.success.length}`);
  console.log(`⏭️  Skipped:   ${results.skipped.length}`);
  console.log(`❌ Failed:    ${results.failed.length}`);

  if (results.success.length > 0) {
    console.log('\n✅ Successfully uploaded:');
    results.success.forEach(t => console.log(`   • ${t}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(f => console.log(`   • ${f.file}: ${f.error}`));
  }

  await mongoose.disconnect();
  console.log('\n✅ Done. Disconnected from MongoDB.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
