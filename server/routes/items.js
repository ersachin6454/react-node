const express = require('express');
const router = express.Router();
const { getAllItems, createItem, updateItem, deleteItem } = require('../controllers/itemController');

// GET all items
router.get('/', getAllItems);

// POST create new item
router.post('/', createItem);

// PUT update item
router.put('/:id', updateItem);

// DELETE item
router.delete('/:id', deleteItem);

module.exports = router;
