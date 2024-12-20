const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();
const categoriesRef = db.collection('categories');

// Get categories by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const snapshot = await categoriesRef.where('type', '==', type).get();
    const categories = [];
    snapshot.forEach(doc => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories by type' });
  }
});

// Get category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const snapshot = await categoriesRef.where('slug', '==', slug).get();
    const categories = [];
    snapshot.forEach(doc => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    res.json(categories.length > 0 ? categories[0] : null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category by slug' });
  }
});

// Get featured categories
router.get('/featured', async (req, res) => {
  try {
    const snapshot = await categoriesRef.where('featured', '==', true).get();
    const categories = [];
    snapshot.forEach(doc => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured categories' });
  }
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = categoriesRef;
    
    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();
    const categories = [];
    snapshot.forEach(doc => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await categoriesRef.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      type,
      image,
      description,
      featured = false
    } = req.body;

    if (!name || !slug || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['carType', 'fuelType', 'tag'].includes(type)) {
      return res.status(400).json({ error: 'Invalid category type' });
    }

    const categoryData = {
      name,
      slug,
      type,
      image,
      description,
      featured,
      carCount: 0
    };

    const docRef = await categoriesRef.add(categoryData);
    res.status(201).json({ id: docRef.id, ...categoryData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id;

    if (updates.type && !['carType', 'fuelType', 'tag'].includes(updates.type)) {
      return res.status(400).json({ error: 'Invalid category type' });
    }

    await categoriesRef.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    await categoriesRef.doc(req.params.id).delete();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
