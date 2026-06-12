# Marketplace Dynamic Products System

## Overview

Marketplace products are now stored dynamically in the database instead of using environment variables. This makes the system more flexible, scalable, and easier to manage.

## Architecture

### Database Storage
- **Collection**: `analyticsevents` (same as other platform content)
- **Content Type**: `marketplace_product`
- **Key Fields**:
  - `productId`: Unique identifier (e.g., `cams-industrial-cookbook`)
  - `title`: Product display name
  - `description`: Product description
  - `price`: Product price
  - `currency`: Currency code (USD, ZAR, etc.)
  - `fileUrl`: Cloudinary URL for the downloadable file
  - `fileType`: File extension (docx, pdf, etc.)
  - `published`: Boolean flag for visibility
  - `featured`: Boolean flag for featured products

### Current Products

1. **CAMS Industrial Cookbook**
   - ID: `cams-industrial-cookbook`
   - Price: $9.99 USD
   - File: `.docx` on Cloudinary

2. **CAMS Master Index**
   - ID: `cams-master-index`
   - Price: $9.99 USD
   - File: `.docx` on Cloudinary

3. **CAMS Industrial Patent Dossier**
   - ID: `patent-dossier`
   - Price: $1,000 USD
   - File: `.pdf` on Cloudinary (placeholder URL - update when available)

## Usage

### Adding New Products

Run the `ADD-MARKETPLACE-PRODUCTS.js` script:

```bash
node ADD-MARKETPLACE-PRODUCTS.js
```

Or manually insert into database:

```javascript
await PlatformContent.create({
  contentType: 'marketplace_product',
  productId: 'my-new-product',
  title: 'My New Product',
  description: 'Product description',
  price: 99.99,
  currency: 'USD',
  fileUrl: 'https://res.cloudinary.com/...',
  fileType: 'pdf',
  published: true,
  featured: false
});
```

### Updating Products

```javascript
await PlatformContent.findOneAndUpdate(
  { contentType: 'marketplace_product', productId: 'cams-industrial-cookbook' },
  { price: 19.99, fileUrl: 'new-url' }
);
```

### Querying Products

```javascript
// Get all marketplace products
const products = await PlatformContent.find({
  contentType: 'marketplace_product',
  published: true
});

// Get specific product
const product = await PlatformContent.findOne({
  contentType: 'marketplace_product',
  productId: 'cams-industrial-cookbook'
});
```

## Benefits

✅ **No Environment Variables**: Products stored in database, not `.env`  
✅ **Dynamic Updates**: Change prices/URLs without redeploying  
✅ **Scalable**: Add unlimited products without code changes  
✅ **Admin Friendly**: Can build admin UI to manage products  
✅ **Consistent**: Uses same collection as other content  
✅ **Version Control**: Product changes tracked in database  

## Migration from Environment Variables

### Before (Old System)
```typescript
fileUrl = process.env.COOKBOOK_URL || '';
```

### After (New System)
```typescript
const product = await PlatformContent.findOne({
  contentType: 'marketplace_product',
  productId: p.productType
});
fileUrl = product?.fileUrl || '';
```

## Deployment

1. Run `ADD-MARKETPLACE-PRODUCTS.js` to seed initial products
2. Deploy backend code (already includes dynamic lookup)
3. No environment variables needed on Render
4. Products instantly available

## Future Enhancements

- Admin dashboard for product management
- Product categories and filtering
- Product versioning and changelog
- Bulk import/export functionality
- Product search and recommendations
- Dynamic pricing rules
- Inventory management
