import { createLocalDriver } from './drivers/local.js';
import { createR2Driver } from './drivers/r2.js';

let cachedDriver = null;

export function getStorageDriver() {
  if (cachedDriver) return cachedDriver;
  const driver = process.env.STORAGE_DRIVER || 'local';
  if (driver === 'r2') {
    cachedDriver = createR2Driver();
  } else {
    cachedDriver = createLocalDriver();
  }
  return cachedDriver;
}

export function getPrivateBucket() {
  return process.env.R2_BUCKET_PRIVATE || 'hospitium-local-private';
}

export function getPublicBucket() {
  return process.env.R2_BUCKET_PUBLIC || 'hospitium-local-public';
}

export function resetStorageDriverForTests() {
  cachedDriver = null;
}
