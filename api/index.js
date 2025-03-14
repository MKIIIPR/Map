const express = require("express");
const path = require("path");
const mysql = require('mysql2');

const app = express();
//const port = 3000;

const http = require('http');

const port = process.env.PORT || 3000;

// Statische Dateien freigeben
app.use(express.static(path.join(__dirname, "public")));

// MySQL-Datenbankverbindung
const db = mysql.createConnection({
    host: 'localhost',
    user: 'aocuser',
    password: 'FodB#JURSV1vGsHr5!iv', // Dein MySQL-Passwort
    database: 'aocgathering_' // Deine Datenbankname
});

// ?berpr?fen der Verbindung zur Datenbank
db.connect((err) => {
    if (err) {
        console.error('Fehler bei der Verbindung zur Datenbank: ', err);
    } else {
        console.log('Erfolgreich mit der MySQL-Datenbank verbunden!');
    }
});

// **Landing Page**
app.get('/', (req, res) => {
    try {
        // Verbindungspr?fung, wenn die DB-Verbindung besteht
        db.query('SELECT 1', (err, results) => {
            if (err) {
                res.status(500).send('Datenbankverbindung fehlgeschlagen!');
            } else {
                res.send(`
                    <h1>Hallo Welt!</h1>
                    <p>Verbindung zur Datenbank besteht!</p>
                `);
            }
        });
    } catch (err) {
        // Falls beim ?berpr?fen der Verbindung ein Fehler auftritt
        console.error('Fehler bei der Verbindung zur Datenbank: ', err);
        res.status(500).send(`
            <h1>Hallo Welt!</h1>
            <p>Datenbankverbindung fehlgeschlagen!</p>
        `);
    }
});

// **1. CREATE: Neue Ressourcenposition hinzuf?gen**
app.post('/api/resource_positions', (req, res) => {
    const { id, resourceId, description, lat, lng, rarity, image, lastHarvest, timerMod } = req.body;

    if (!resourceId || !id) {
        return res.status(400).json({ message: 'ResourceId und ID sind erforderlich!' });
    }

    const lastHarvestDate = new Date(lastHarvest);
    const respawnAt = new Date(lastHarvestDate.getTime() + (timerMod * 60000));

    const query = 
        INSERT INTO ResourcePosition (Id, ResourceId, Description, Lat, Lng, Rarity, Image, LastHarvest, TimerMod) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);

    db.query(query, [id, resourceId, description, lat, lng, rarity, image, lastHarvestDate, timerMod], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Erstellen der Ressourcenposition', error: err });
        }
        res.status(201).json({ message: 'Ressourcenposition erstellt' });
    });
});

// **2. READ: Alle Ressourcenpositionen abrufen**
app.get('/api/resource_positions', (req, res) => {
    db.query('SELECT * FROM resource_positions', (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Abrufen der Daten' });
        }
        res.json(results);
    });
});

// **2. READ: Alle Ressourcen abrufen**
app.get('/api/resources', (req, res) => {
    db.query('SELECT * FROM resources', (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Abrufen der Daten' });
        }
        res.json(results);
    });
});

// **3. READ: Eine spezifische Ressourcenposition abrufen**
app.get('/api/resources/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM resources WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Abrufen der Daten' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Ressourcenposition nicht gefunden' });
        }
        res.json(results[0]);
    });
});

// **3. READ: Eine spezifische Ressourcenposition abrufen**
app.get('/api/resource_positions/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM resource_positions WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Abrufen der Daten' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Ressourcenposition nicht gefunden' });
        }
        res.json(results[0]);
    });
});

// **4. UPDATE: Eine Ressourcenposition aktualisieren**
app.put('/api/resource_positions/:id', (req, res) => {
    const { id } = req.params;
    const {
        resource,
        desc,
        posX,
        posY,
        rarity,
        img,
        lastHarvest
    } = req.body;

    const lastHarvestDate = new Date(lastHarvest);
    const respawnAt = new Date(lastHarvestDate.getTime() + (resource.respawnTimer * 60000));

    const query = `
    UPDATE resource_positions 
    SET resource_id = ?, description = ?, posX = ?, posY = ?, rarity = ?, img = ?, lastHarvest = ?, respawnAt = ? 
    WHERE id = ?`;

    db.query(query, [resource.id, desc, posX, posY, rarity, img, lastHarvestDate, respawnAt, id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Aktualisieren der Ressourcenposition' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Ressourcenposition nicht gefunden' });
        }
        res.status(200).json({ message: 'Ressourcenposition aktualisiert' });
    });
});

// **5. DELETE: Eine Ressourcenposition l?schen**
app.delete('/api/resource_positions/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM resource_positions WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim L?schen der Ressourcenposition' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Ressourcenposition nicht gefunden' });
        }
        res.status(200).json({ message: 'Ressourcenposition gel?scht' });
    });
});

// **6. DELETE: Eine Ressource l?schen**
app.delete('/api/resources/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM resources WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim L?schen der Ressource' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Ressource nicht gefunden' });
        }
        res.status(200).json({ message: 'Ressource gel?scht' });
    });
});

// API-Server starten
app.listen(port, () => {
  console.log(`Server l?uft auf http://localhost:${port}`);
});
