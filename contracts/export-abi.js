import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const artifactPath = join(__dirname, 'artifacts', 'contracts', 'SimpleEscrow.sol', 'SimpleEscrow.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const output = {
  address: '0xfd949bF6EE48Ad2961F1733bf9a4C28191796fF8',
  abi: artifact.abi,
  bytecode: artifact.bytecode
};

const outputPath = join(__dirname, '..', 'securework-frontend', 'src', 'SimpleEscrow.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log('✅ Contract info exported to frontend!');
console.log('📂 Location:', outputPath);