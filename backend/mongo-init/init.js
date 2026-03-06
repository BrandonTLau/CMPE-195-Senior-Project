/**
 * AUTORUNS ON FIRST STARTUP
 * INITS DB W/ INDEXES && COLLECTIONS
 */

db = db.getSiblingDB('notescan_db');

db.createCollection('users');
db.createCollection('uploadedfiles');

db.users.createIndex({ email: 1 }, { unique: true });
db.uploadedfiles.createIndex({ userID: 1 });
db.uploadedfiles.createIndex({ uploadId: 1 }, { unique: true });
db.uploadedfiles.createIndex({ uploadDate: -1 });

print('notescan_db: collections and indexes initialized');