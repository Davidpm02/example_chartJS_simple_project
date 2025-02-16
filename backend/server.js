const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conectar a la base de datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error(err);
  console.log('Conectado a SQLite');
});


// Endpoint para obtener las tablas
app.get('/getTables', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/getData/:tableName', (req, res) => {
    const tableName = req.params.tableName;
    // Validar y sanitizar tableName según sea necesario
    const query = `SELECT * FROM ${tableName};`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
