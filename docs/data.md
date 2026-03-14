# Data Management

## Overview

Kost includes data tools for import, export, and backup so households can move and protect their data.

## Import and Export

Data actions are available in the Data section of the application.

Supported operations include:

- Import of expenses and recurring expenses from spreadsheet-friendly files
- Import of master data (such as vendors/categories/payment methods)
- Export of expenses, recurring expenses, settlements, and master data

## Supported Formats

Kost supports CSV and JSON export paths depending on data type.

Some import/export flows also include templates where relevant in the UI.

## Backups

Kost supports backup and restore workflows from the Data module.

Typical backup usage:

- Create a local backup from the app
- Download/store backup files safely
- Restore from backup when needed

## Data Storage Concepts

- Primary application data is stored in PostgreSQL
- Uploaded files are stored in the API uploads directory (persisted via Docker volume in container mode)
- Backup/export files are generated through application data tools and should be stored securely by the operator

## Operational Recommendations

- Run backups regularly
- Validate restore flow in a non-production environment before relying on it
- Keep exported/backup files encrypted and access-controlled when possible
