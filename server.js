const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3306;

// Middleware, um JSON-Daten zu verarbeiten
app.use(express.json());

// MySQL-Datenbankverbindung
const db = mysql.createConnection({
    host: 'localhost',
    user: 'aocuser',
    password: 'FodB#JURSV1vGsHr5!iv', // Dein MySQL-Passwort
    database: 'aocgathering_' // Deine Datenbankname
});

// �berpr�fen der Verbindung zur Datenbank
db.connect((err) => {
    if (err) {
        console.error('Fehler bei der Verbindung zur Datenbank: ', err);
        return;
    }
    console.log('Erfolgreich mit der MySQL-Datenbank verbunden!');
});

// **1. CREATE: Neue Ressourcenposition hinzuf�gen**
app.post('/api/resource_positions', (req, res) => {
    const {
        id,
        resource,
        desc,
        posX,
        posY,
        rarity,
        img,
        lastHarvest
    } = req.body;

    if (!resource || !id) {
        return res.status(400).json({ message: 'Resource und ID sind erforderlich!' });
    }

    // Die Ressource in die Datenbank einf�gen
    const resourceQuery = 'INSERT INTO resources (id, name, type, respawnTimer) VALUES (?, ?, ?, ?)';
    db.query(resourceQuery, [resource.id, resource.name, resource.type, resource.respawnTimer], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Erstellen der Ressource' });
        }

        // Berechne respawnAt (respawnTimer in Minuten hinzuf�gen)
        const lastHarvestDate = new Date(lastHarvest);
        const respawnAt = new Date(lastHarvestDate.getTime() + (resource.respawnTimer * 60000));

        // Die Ressourcenposition in die Datenbank einf�gen
        const query = `
      INSERT INTO resource_positions 
      (id, resource_id, description, posX, posY, rarity, img, lastHarvest, respawnAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(query, [id, resource.id, desc, posX, posY, rarity, img, lastHarvestDate, respawnAt], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Fehler beim Erstellen der Ressourcenposition' });
            }
            res.status(201).json({ message: 'Ressourcenposition erstellt' });
        });
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

// **5. DELETE: Eine Ressourcenposition l�schen**
app.delete('/api/resource_positions/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM resource_positions WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim L�schen der Ressourcenposition' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Ressourcenposition nicht gefunden' });
        }
        res.status(200).json({ message: 'Ressourcenposition gel�scht' });
    });
});

// **6. DELETE: Eine Ressource l�schen**
app.delete('/api/resources/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM resources WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim L�schen der Ressource' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Ressource nicht gefunden' });
        }
        res.status(200).json({ message: 'Ressource gel�scht' });
    });
});

// API-Server starten
app.listen(port, () => {
    console.log(`API l�uft unter http://localhost:${port}`);
});
