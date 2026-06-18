const assert = require('assert');
// Create - C
exports.insertDocument = async (db, document, collection) => {
    const coll = db.collection(collection);
    const result = await coll.insertOne(document);
    assert.equal(result.acknowledged, true); 
    console.log("Inserted 1 documents into the collection " + collection);
    return result;
};
// Read - R
exports.findDocuments = async (db, collection) => {
    const coll = db.collection(collection);
    const docs = await coll.find({}).toArray();
    return docs;
};
// Update - U
exports.updateDocument = async (db, document, update, collection) => {
    const coll = db.collection(collection);
    const result = await coll.updateOne(document, { $set: update });
    assert.equal(result.acknowledged, true);            
    console.log("Updated the document with ", update);
    return result;
};
// Delete - D
exports.removeDocument = async (db, document, collection) => {
    const coll = db.collection(collection);
    const result = await coll.deleteOne(document);
    assert.equal(result.acknowledged, true);  
        
    console.log("Removed the document ", document);
    return result;
};


