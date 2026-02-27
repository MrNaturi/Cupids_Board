class BoardState {
  constructor() {
    this.items = this.loadFromStorage() || [];
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cupidsBoard');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading from storage:', error);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('cupidsBoard', JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  addItem(item) {

    item.id = this.generateId();
    item.timestamp = new Date().toISOString();
    this.items.unshift(item);
    this.saveToStorage();
    return item;
  }

  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveToStorage();
  }

  updateItem(id, updates) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates };
      this.saveToStorage();
    }
  }

  getItems() {
    return [...this.items];
  }

  generateId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  searchItems(query) {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return this.items;

    return this.items.filter(item => {
      const searchableContent = [
        item.content,
        item.caption,
        item.title,
        item.type
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableContent.includes(lowerQuery);
    });
  }
}