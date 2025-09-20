const admin = require('firebase-admin');

// This is a simple test script to verify Firestore connection
// Run this after setting up your service account key

async function testFirestoreConnection() {
  try {
    console.log('🔍 Testing Firestore connection...');
    
    // Initialize Firebase Admin SDK
    const serviceAccount = require('./firebase-service-account.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'onmindsep20'
    });

    const db = admin.firestore();

    // Test basic connection
    console.log('✅ Firebase Admin SDK initialized');

    // Test reading from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users in Firestore`);

    const entriesSnapshot = await db.collection('entries').get();
    console.log(`📝 Found ${entriesSnapshot.size} entries in Firestore`);

    if (usersSnapshot.size > 0) {
      console.log('\n👥 Users:');
      usersSnapshot.forEach(doc => {
        console.log(`  - ${doc.data().email} (${doc.id})`);
      });
    }

    if (entriesSnapshot.size > 0) {
      console.log('\n📋 Entry categories:');
      const categories = new Set();
      entriesSnapshot.forEach(doc => {
        categories.add(doc.data().category);
      });
      categories.forEach(category => {
        const count = entriesSnapshot.docs.filter(doc => 
          doc.data().category === category
        ).length;
        console.log(`  - ${category}: ${count} entries`);
      });
    }

    console.log('\n🎉 Firestore connection successful!');
    console.log('✅ You can now run the migration script: node migrate-to-firestore.js');

  } catch (error) {
    console.error('❌ Firestore connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure firebase-service-account.json exists');
    console.log('2. Verify the service account has Firestore permissions');
    console.log('3. Check your Firebase project ID is correct');
  } finally {
    process.exit(0);
  }
}

testFirestoreConnection();
