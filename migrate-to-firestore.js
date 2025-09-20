const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
// You'll need to download the service account key and place it here
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'onmindsep20'
});

const db = admin.firestore();

async function migrateToFirestore() {
  try {
    console.log('🚀 Starting migration to Firestore...');

    // Read the exported data
    const entriesData = JSON.parse(fs.readFileSync('./entries_export.json', 'utf8'));
    const usersData = JSON.parse(fs.readFileSync('./users_export.json', 'utf8'));

    console.log(`📊 Found ${entriesData.length} entries and ${usersData.length} users`);

    // Migrate users first
    console.log('👥 Migrating users...');
    const userMap = new Map();
    
    for (const user of usersData) {
      const userRef = db.collection('users').doc(user.id);
      
      const userDoc = {
        email: user.email,
        provider: user.provider,
        created_at: admin.firestore.Timestamp.fromDate(new Date(user.created_at)),
        last_sign_in_at: user.last_sign_in_at ? 
          admin.firestore.Timestamp.fromDate(new Date(user.last_sign_in_at)) : null,
        migrated_from: 'supabase',
        migrated_at: admin.firestore.Timestamp.now()
      };

      // Add optional fields if they exist
      if (user.name) userDoc.name = user.name;
      if (user.picture) userDoc.picture = user.picture;

      await userRef.set(userDoc);
      userMap.set(user.id, userRef);
      console.log(`  ✅ Migrated user: ${user.email}`);
    }

    // Migrate entries
    console.log('📝 Migrating entries...');
    let successCount = 0;
    let errorCount = 0;

    for (const entry of entriesData) {
      try {
        const entryRef = db.collection('entries').doc(entry.id);
        
        // Convert timestamps
        const createdAt = admin.firestore.Timestamp.fromDate(new Date(entry.created_at));
        const updatedAt = admin.firestore.Timestamp.fromDate(new Date(entry.updated_at));

        const entryDoc = {
          user_id: userMap.get(entry.user_id), // Reference to user document
          title: entry.title,
          content: entry.content,
          explanation: entry.explanation,
          category: entry.category,
          tags: Array.isArray(entry.tags) ? entry.tags : 
                (typeof entry.tags === 'string' && entry.tags.startsWith('{')) ? 
                JSON.parse(entry.tags.replace(/'/g, '"')) : [],
          is_favorite: entry.is_favorite,
          is_pinned: entry.is_pinned,
          is_flashcard: entry.is_flashcard,
          url: entry.url,
          created_at: createdAt,
          updated_at: updatedAt,
          migrated_from: 'supabase',
          migrated_at: admin.firestore.Timestamp.now()
        };

        await entryRef.set(entryDoc);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`  ✅ Migrated ${successCount} entries...`);
        }
      } catch (error) {
        console.error(`  ❌ Error migrating entry ${entry.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${successCount} entries`);
    console.log(`❌ Failed to migrate: ${errorCount} entries`);
    console.log(`👥 Users migrated: ${usersData.length}`);

    // Create summary document
    const summaryRef = db.collection('migration').doc('summary');
    await summaryRef.set({
      migrated_at: admin.firestore.Timestamp.now(),
      total_entries: entriesData.length,
      successful_entries: successCount,
      failed_entries: errorCount,
      total_users: usersData.length,
      source: 'supabase',
      version: '1.0'
    });

    console.log('📋 Migration summary saved to Firestore');

  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateToFirestore();
