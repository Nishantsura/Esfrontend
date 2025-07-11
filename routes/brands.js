const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();
const brandsRef = db.collection('brands');

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // Debug log

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No bearer token'); // Debug log
      return res.status(401).json({ error: 'No bearer token' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Verifying token...'); // Debug log
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Decoded token:', decodedToken); // Debug log
    
    if (!decodedToken.email?.endsWith('@esrent.ae')) {
      console.log('Not an esrent email:', decodedToken.email); // Debug log
      return res.status(403).json({ error: 'Not an authorized email domain' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
};

// Get brand by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const snapshot = await brandsRef.where('slug', '==', slug).get();
    const brands = [];
    snapshot.forEach(doc => {
      brands.push({ id: doc.id, ...doc.data() });
    });
    res.json(brands.length > 0 ? brands[0] : null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brand by slug' });
  }
});

// Get featured brands
router.get('/featured', async (req, res) => {
  try {
    const snapshot = await brandsRef.where('featured', '==', true).get();
    const brands = [];
    snapshot.forEach(doc => {
      brands.push({ id: doc.id, ...doc.data() });
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured brands' });
  }
});

// Get all brands
router.get('/', async (req, res) => {
  try {
    const snapshot = await brandsRef.get();
    const brands = [];
    snapshot.forEach(doc => {
      brands.push({ id: doc.id, ...doc.data() });
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Get brand by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await brandsRef.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

// Create new brand
router.post('/', requireAdmin, async (req, res) => {
  console.log('Brand creation request received from user:', req.user?.email);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { name, logo, slug, featured = false } = req.body;
    if (!name || !logo || !slug) {
      console.log('Validation failed. Missing fields:', { name: !!name, logo: !!logo, slug: !!slug });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Validation passed. Creating brand data...');
    const brandData = {
      name,
      logo,
      slug,
      featured,
      carCount: 0
    };

    console.log('Saving brand to Firebase:', JSON.stringify(brandData, null, 2));
    const docRef = await brandsRef.add(brandData);
    console.log('Brand created successfully:', docRef.id);
    res.status(201).json({ id: docRef.id, ...brandData });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ 
      error: 'Failed to create brand',
      details: error.message 
    });
  }
});

// Update brand
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, logo, slug, featured, carCount } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (logo) updates.logo = logo;
    if (slug) updates.slug = slug;
    if (featured !== undefined) updates.featured = featured;
    if (carCount !== undefined) updates.carCount = carCount;

    await brandsRef.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

// Delete brand
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await brandsRef.doc(req.params.id).delete();
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

module.exports = router;
