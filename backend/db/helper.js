const { getDB } = require('./mongo');

class MongoDBHelper {
  static async findOne(collection, query) {
    const db = getDB();
    return await db.collection(collection).findOne(query);
  }

  static async findMany(collection, query, options = {}) {
    const db = getDB();
    let cursor = db.collection(collection).find(query);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    return await cursor.toArray();
  }

  static async insertOne(collection, document) {
    const db = getDB();
    const result = await db.collection(collection).insertOne(document);
    return result.insertedId;
  }

  static async updateOne(collection, query, update, options = {}) {
    const db = getDB();
    const result = await db.collection(collection).updateOne(query, update, options);
    return result;
  }

  static async deleteOne(collection, query) {
    const db = getDB();
    const result = await db.collection(collection).deleteOne(query);
    return result;
  }

  static async replaceOne(collection, query, document, options = {}) {
    const db = getDB();
    const result = await db.collection(collection).replaceOne(query, document, options);
    return result;
  }

  // PostgreSQL style compatibility
  static async query(collection, query, params = []) {
    const db = getDB();
    
    // Simple query simulation for basic operations
    if (query.includes('SELECT') && query.includes('WHERE')) {
      const match = query.match(/WHERE (.+?)(?: ORDER BY| LIMIT|$)/);
      if (match) {
        const whereClause = match[1];
        const conditions = this.parseWhereClause(whereClause, params);
        return await this.findMany(collection, conditions);
      }
    }
    
    if (query.includes('INSERT INTO')) {
      const doc = this.parseInsertQuery(query, params);
      await this.insertOne(collection, doc);
      return { rows: [doc] };
    }
    
    if (query.includes('UPDATE')) {
      const { filter, update } = this.parseUpdateQuery(query, params);
      await this.updateOne(collection, filter, update);
      return { rows: [] };
    }
    
    if (query.includes('DELETE FROM')) {
      const filter = this.parseDeleteQuery(query, params);
      await this.deleteOne(collection, filter);
      return { rows: [] };
    }
    
    return { rows: [] };
  }

  static parseWhereClause(whereClause, params) {
    // Simple WHERE clause parser
    const conditions = {};
    const matches = whereClause.matchAll(/\$(\d+)/g);
    let paramIndex = 0;
    
    for (const match of matches) {
      const paramValue = params[paramIndex];
      const fieldMatch = whereClause.substring(0, match.index).match(/(\w+)\s*=\s*\$/);
      if (fieldMatch) {
        conditions[fieldMatch[1]] = paramValue;
      }
      paramIndex++;
    }
    
    return conditions;
  }

  static parseInsertQuery(query, params) {
    const doc = {};
    // Simple parsing - would need to be more sophisticated for complex queries
    return doc;
  }

  static parseUpdateQuery(query, params) {
    // Simple parsing - would need to be more sophisticated
    return { filter: {}, update: {} };
  }

  static parseDeleteQuery(query, params) {
    // Simple parsing - would need to be more sophisticated
    return {};
  }
}

module.exports = MongoDBHelper;
