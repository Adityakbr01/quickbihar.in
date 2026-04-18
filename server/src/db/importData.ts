import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = "mongodb://aditykbr01:pZyXlQPVhGCKLKRl@cluster0-shard-00-00.whbog.mongodb.net:27017,cluster0-shard-00-01.whbog.mongodb.net:27017,cluster0-shard-00-02.whbog.mongodb.net:27017/quickbihar?ssl=true&authSource=admin&replicaSet=atlas-y08dky-shard-0";

/**
 * Recursively transforms MongoDB EJSON format ($oid, $date, $numberInt, etc.) 
 * into proper JavaScript/Mongoose types.
 */
function transformEJSON(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformEJSON);
  } else if (obj !== null && typeof obj === 'object') {
    // Handle $oid
    if (obj.$oid) {
      return new mongoose.Types.ObjectId(obj.$oid);
    }
    // Handle $date
    if (obj.$date) {
      // Some EJSON formats might have $date as an object with $numberLong or a string
      const dateVal = typeof obj.$date === 'object' && obj.$date.$numberLong 
        ? parseInt(obj.$date.$numberLong) 
        : obj.$date;
      return new Date(dateVal);
    }
    // Handle numeric types
    if (obj.$numberInt) {
      return parseInt(obj.$numberInt);
    }
    if (obj.$numberLong) {
      return parseInt(obj.$numberLong);
    }
    if (obj.$numberDecimal) {
      return new mongoose.Types.Decimal128(obj.$numberDecimal);
    }
    
    // Recurse for nested objects
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = transformEJSON(obj[key]);
    }
    return newObj;
  }
  return obj;
}

async function importData() {
  console.log('🚀 Starting Data Import Process...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.json'));

    for (const file of files) {
      // Expected format: quickbihar.<collection>.json
      const parts = file.split('.');
      if (parts.length < 3) continue;
      
      const collectionName = parts[1];
      if (!collectionName) continue;

      console.log(`\n📦 Processing collection: [${collectionName}] from file: ${file}`);
      const filePath = path.join(__dirname, file);
      const rawData = fs.readFileSync(filePath, 'utf8');
      
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (e: any) {
        console.error(`❌ Failed to parse JSON in ${file}:`, e.message);
        continue;
      }

      if (!Array.isArray(data)) {
        console.warn(`⚠️ Warning: ${file} does not contain a JSON array. Skipping.`);
        continue;
      }

      if (data.length === 0) {
        console.log(`ℹ️ Collection ${collectionName} is empty. Skipping.`);
        continue;
      }

      const processedData = transformEJSON(data);
      const collection = mongoose.connection.db.collection(collectionName);

      try {
        // We use insertMany. Standard mongoimport has --drop flag.
        // We will insert and catch duplicates.
        const result = await collection.insertMany(processedData, { ordered: false });
        console.log(`✨ Successfully imported ${result.insertedCount} documents into [${collectionName}]`);
      } catch (err: any) {
        if (err.code === 11000) {
          const insertedCount = err.result?.nInserted || 0;
          console.warn(`⚠️ Warning: Duplicate keys encountered in [${collectionName}]. Imported ${insertedCount} new documents.`);
        } else {
          console.error(`❌ Error importing [${collectionName}]:`, err.message);
        }
      }
    }

    console.log('\n✨ All files processed!');
  } catch (error) {
    console.error('❌ Critical system error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

importData();
