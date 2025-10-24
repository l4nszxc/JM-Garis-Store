# GCash Receipt Uploads

This directory stores uploaded GCash receipt screenshots for payment verification.

## File Naming Convention
Files are automatically named with the pattern: `receipt_timestamp_userid_originalname`

## Security Notes
- Only authenticated users can upload files
- File size limited to 5MB
- Only image files (JPG, PNG, GIF) are accepted
- Files are cleaned up if database transaction fails

## Directory Structure
- Original receipts: `/uploads/gcash-receipts/`
- Access via API: `/api/payment/receipt/:filename` (authenticated)