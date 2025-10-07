const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataFile = path.join(__dirname, '../data.json');

const readData = () => {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

const getAllItems = (req, res) => {
  try {
    const items = readData();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

const createItem = (req, res) => {
  try {
    const items = readData();
    const newItem = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
};

const updateItem = (req, res) => {
  try {
    const items = readData();
    const itemId = req.params.id;
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    items[itemIndex] = { 
      ...items[itemIndex], 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    writeData(items);
    res.json(items[itemIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
};

const deleteItem = (req, res) => {
  try {
    const items = readData();
    const itemId = req.params.id;
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    items.splice(itemIndex, 1);
    writeData(items);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

module.exports = {
  getAllItems,
  createItem,
  updateItem,
  deleteItem
};
