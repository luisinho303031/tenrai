
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const obrasDir = __dirname;

const processObra = async (obraName) => {
    const obraPath = path.join(obrasDir, obraName);
    const capitulosJsonPath = path.join(obraPath, 'capitulos.json');
    const capitulosDir = path.join(obraPath, 'capitulos');

    if (!fs.existsSync(capitulosJsonPath)) {
        return;
    }

    // Read capitulos.json
    const data = JSON.parse(fs.readFileSync(capitulosJsonPath, 'utf8'));

    // Create capitulos folder if not exists
    if (!fs.existsSync(capitulosDir)) {
        fs.mkdirSync(capitulosDir);
    }

    // Iterate and create individual files
    for (const cap of data.capitulos) {
        const filePath = path.join(capitulosDir, `${cap.id}.json`);
        // We write the chapter object directly. 
        // Note: The user said "vai ter ex 1.json, contendo tudo do cap id numero titulo data e imaagens"
        // The structure in capitulos.json is { "capitulos": [ ... ] }
        // The individual file should probably be just the chapter object.
        fs.writeFileSync(filePath, JSON.stringify(cap, null, 2));
    }

    console.log(`Processed ${obraName}`);
};

const main = async () => {
    const entries = fs.readdirSync(obrasDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            await processObra(entry.name);
        }
    }
};

main();
