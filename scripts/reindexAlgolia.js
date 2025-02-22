require('dotenv').config();
const admin = require('firebase-admin');
const algoliasearch = require('algoliasearch');

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  serviceAccount = require('../serviceAccountKey.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Algolia
const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY
);
const carsIndex = algoliaClient.initIndex('cars');

async function reindexCars() {
  try {
    console.log('Starting reindexing of cars to Algolia...');
    
    // Get all cars from Firestore
    const carsSnapshot = await admin.firestore().collection('cars').get();
    const cars = [];

    carsSnapshot.forEach(doc => {
      const carData = doc.data();
      // Ensure all fields are properly formatted for Algolia
      const algoliaRecord = {
        objectID: doc.id,
        name: carData.name || '',
        brand: carData.brand || '',
        model: carData.model || '',
        transmission: carData.transmission || '',
        seats: carData.seats || 0,
        year: carData.year || 0,
        rating: carData.rating || 0,
        advancePayment: carData.advancePayment || false,
        rareCar: carData.rareCar || false,
        featured: carData.featured || false,
        fuelType: carData.fuelType || '',
        engineCapacity: carData.engineCapacity || '',
        power: carData.power || '',
        dailyPrice: carData.dailyPrice || 0,
        type: carData.type || '',
        tags: Array.isArray(carData.tags) ? carData.tags : [],
        description: carData.description || '',
        images: Array.isArray(carData.images) ? carData.images : [],
        available: typeof carData.available === 'boolean' ? carData.available : true,
        location: carData.location || '',
        categories: Array.isArray(carData.categories) ? carData.categories : [],
        // Convert Firestore Timestamp to Unix timestamp for Algolia
        createdAt: carData.createdAt?.toMillis() || Date.now(),
        updatedAt: carData.updatedAt?.toMillis() || Date.now()
      };
      cars.push(algoliaRecord);
    });

    console.log(`Found ${cars.length} cars to index`);

    if (cars.length > 0) {
      // Configure index settings for better search
      await carsIndex.setSettings({
        searchableAttributes: [
          'name',
          'brand',
          'model',
          'description',
          'type',
          'fuelType',
          'transmission'
        ],
        attributesForFaceting: [
          'brand',
          'type',
          'fuelType',
          'transmission',
          'available',
          'featured',
          'rareCar'
        ],
        customRanking: [
          'desc(featured)',
          'desc(rating)',
          'desc(dailyPrice)'
        ]
      });

      // Clear existing index
      await carsIndex.clearObjects();
      console.log('Cleared existing index');

      // Save objects to Algolia
      const result = await carsIndex.saveObjects(cars);
      console.log(`Successfully indexed ${result.objectIDs.length} cars`);
    }

    console.log('Reindexing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during reindexing:', error);
    process.exit(1);
  }
}

reindexCars();
