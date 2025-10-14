const express = require('express');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware - VOLONTAIREMENT SANS SÉCURITÉ
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const db = new Database('./db/blog.db');

// Initialiser la base de données
db.exec(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  comment TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id)
)`);

// Ajouter quelques articles par défaut
const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts').get();
if (postsCount.count === 0) {
  const insertPost = db.prepare('INSERT INTO posts (title, author, content) VALUES (?, ?, ?)');
  insertPost.run(
    'Bienvenue sur mon blog !',
    'Admin',
    'Ceci est mon premier article. Bienvenue sur ce blog old school ! N\'hésitez pas à laisser vos commentaires ci-dessous.'
  );
  insertPost.run(
    'Les bases de la sécurité web',
    'Yazid',
    'Aujourd\'hui nous allons parler de sécurité web. Il est important de toujours valider et échapper les entrées utilisateur pour éviter les failles XSS...'
  );
  insertPost.run(
    'Mon voyage en montagne',
    'Blogueur123',
    'La semaine dernière, je suis parti en randonnée dans les Alpes. Les paysages étaient magnifiques ! Voici mon récit...'
  );
}

// Routes

// Page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Page article
app.get('/post/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'post.html'));
});

// Page admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API - Obtenir tous les articles
app.get('/api/posts', (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM posts ORDER BY timestamp DESC').all();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - Obtenir un article spécifique
app.get('/api/posts/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - Créer un article (SANS VALIDATION)
app.post('/api/posts', (req, res) => {
  const { title, author, content } = req.body;

  try {
    // VULNÉRABILITÉ : Pas de validation
    const stmt = db.prepare('INSERT INTO posts (title, author, content) VALUES (?, ?, ?)');
    const info = stmt.run(title, author, content);
    res.json({ success: true, postId: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - Poster un commentaire (VULNÉRABLE XSS)
app.post('/api/comments', (req, res) => {
  const { post_id, username, comment } = req.body;

  try {
    // VULNÉRABILITÉ : Pas de sanitisation
    const stmt = db.prepare('INSERT INTO comments (post_id, username, comment) VALUES (?, ?, ?)');
    const info = stmt.run(post_id, username, comment);
    res.json({ success: true, commentId: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - Obtenir les commentaires d'un article (RENVOIE HTML NON ÉCHAPPÉ)
app.get('/api/comments/:post_id', (req, res) => {
  try {
    const comments = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY timestamp DESC').all(req.params.post_id);
    // VULNÉRABILITÉ : Renvoie le HTML brut sans échapper
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - Reset (pour les tests)
app.post('/api/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM posts').run();
    db.prepare('DELETE FROM comments').run();

    // Réinsérer les articles par défaut
    const insertPost = db.prepare('INSERT INTO posts (title, author, content) VALUES (?, ?, ?)');
    insertPost.run(
      'Bienvenue sur mon blog !',
      'Admin',
      'Ceci est mon premier article. Bienvenue sur ce blog old school ! N\'hésitez pas à laisser vos commentaires ci-dessous.'
    );
    insertPost.run(
      'Les bases de la sécurité web',
      'Yazid',
      'Aujourd\'hui nous allons parler de sécurité web. Il est important de toujours valider et échapper les entrées utilisateur pour éviter les failles XSS...'
    );
    insertPost.run(
      'Mon voyage en montagne',
      'Blogueur123',
      'La semaine dernière, je suis parti en randonnée dans les Alpes. Les paysages étaient magnifiques ! Voici mon récit...'
    );

    res.json({ success: true, message: 'Database reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'blog-system' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📝 Blog System running on http://localhost:${PORT}`);
  console.log('⚠️  WARNING: This system is INTENTIONALLY VULNERABLE');
});
