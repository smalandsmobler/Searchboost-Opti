// ══════════════════════════════════════════════════════════════
// Searchboost Opti — Portal Authentication Routes
//
// Importeras i index.js:
//   require('./portal-auth')(app, getParam, getBigQuery);
//
// Krav: npm install jsonwebtoken bcryptjs
//   (bcryptjs ar en ren JS-implementation — inga native deps)
// ══════════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Cache for JWT secret (24h)
let _jwtSecret = null;
let _jwtSecretTime = 0;
const JWT_SECRET_TTL = 86400000; // 24h

module.exports = function(app, getParam, getBigQuery) {

  // ── Helper: hamta JWT-secret fran SSM (eller generera fallback) ──
  async function getJwtSecret() {
    const now = Date.now();
    if (_jwtSecret && (now - _jwtSecretTime) < JWT_SECRET_TTL) {
      return _jwtSecret;
    }
    try {
      _jwtSecret = await getParam('/seo-mcp/portal/jwt-secret');
      _jwtSecretTime = now;
    } catch (e) {
      // Fallback: generera en default secret (sparas enbart i minnet)
      console.warn('Portal JWT secret ej i SSM, genererar temporar:', e.message);
      if (!_jwtSecret) {
        _jwtSecret = 'sb-portal-' + crypto.randomBytes(32).toString('hex');
      }
      _jwtSecretTime = now;
    }
    return _jwtSecret;
  }

  // ── Helper: signera JWT ──
  async function signToken(payload) {
    const secret = await getJwtSecret();
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  // ── Helper: verifiera JWT ──
  async function verifyToken(token) {
    const secret = await getJwtSecret();
    return jwt.verify(token, secret);
  }

  // ── Middleware: verifyPortalToken ──
  // Satter req.portalCustomer = { id, name, email }
  async function verifyPortalToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Autentisering kravs' });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = await verifyToken(token);
      req.portalCustomer = {
        id: decoded.customer_id,
        name: decoded.name,
        email: decoded.email
      };
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Ogiltig eller utgangen token' });
    }
  }

  // ── Helper: ensure BigQuery table exists ──
  async function ensureCustomerUsersTable() {
    const { bq, dataset } = await getBigQuery();
    const tableId = 'customer_users';
    try {
      const [tables] = await bq.dataset(dataset).getTables();
      const exists = tables.some(function(t) { return t.id === tableId; });
      if (!exists) {
        await bq.dataset(dataset).createTable(tableId, {
          schema: {
            fields: [
              { name: 'email', type: 'STRING', mode: 'REQUIRED' },
              { name: 'password_hash', type: 'STRING', mode: 'REQUIRED' },
              { name: 'customer_id', type: 'STRING', mode: 'REQUIRED' },
              { name: 'name', type: 'STRING', mode: 'NULLABLE' },
              { name: 'created_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
              { name: 'last_login', type: 'TIMESTAMP', mode: 'NULLABLE' }
            ]
          }
        });
        console.log('Created BigQuery table: customer_users');
      }
    } catch (e) {
      // Table might already exist in sandbox mode, swallow error
      console.warn('ensureCustomerUsersTable:', e.message);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // POST /api/portal/login
  // Body: { email, password }
  // Returns: { token, customer: { id, name, url } }
  // ══════════════════════════════════════════════════════════════

  app.post('/api/portal/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'E-post och losenord kravs' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { bq, dataset } = await getBigQuery();

      // Hamta anvandare fran BigQuery
      const query = `SELECT email, password_hash, customer_id, name
        FROM \`${dataset}.customer_users\`
        WHERE LOWER(email) = @email
        LIMIT 1`;

      const [rows] = await bq.query({
        query,
        params: { email: normalizedEmail },
        types: { email: 'STRING' }
      });

      if (!rows || rows.length === 0) {
        return res.status(401).json({ error: 'Fel e-post eller losenord' });
      }

      const user = rows[0];

      // Verifiera losenord
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Fel e-post eller losenord' });
      }

      // Uppdatera last_login
      try {
        await bq.query({
          query: `UPDATE \`${dataset}.customer_users\` SET last_login = CURRENT_TIMESTAMP() WHERE LOWER(email) = @email`,
          params: { email: normalizedEmail },
          types: { email: 'STRING' }
        });
      } catch (e) {
        // Sandbox mode kanske inte tilllater UPDATE — ignorera
        console.warn('Could not update last_login:', e.message);
      }

      // Hamta kundinformation (URL, namn mm)
      let customerUrl = '';
      let customerName = user.name || user.customer_id;
      try {
        customerUrl = await getParam(`/seo-mcp/wordpress/${user.customer_id}/url`);
      } catch (e) {
        // Forsok via integrations
        try {
          customerUrl = await getParam(`/seo-mcp/integrations/${user.customer_id}/gsc-property`);
        } catch (e2) { /* ok */ }
      }

      try {
        const companyName = await getParam(`/seo-mcp/integrations/${user.customer_id}/company-name`);
        if (companyName) customerName = companyName;
      } catch (e) { /* ok */ }

      // Signera JWT
      const token = await signToken({
        customer_id: user.customer_id,
        name: customerName,
        email: normalizedEmail
      });

      return res.json({
        token,
        customer: {
          id: user.customer_id,
          name: customerName,
          url: customerUrl
        }
      });

    } catch (err) {
      console.error('Portal login error:', err);
      return res.status(500).json({ error: 'Serverfel vid inloggning' });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // GET /api/portal/me (Bearer auth)
  // Returns: { customer_id, name, url }
  // ══════════════════════════════════════════════════════════════

  app.get('/api/portal/me', verifyPortalToken, async (req, res) => {
    try {
      const customerId = req.portalCustomer.id;
      let customerUrl = '';

      try {
        customerUrl = await getParam(`/seo-mcp/wordpress/${customerId}/url`);
      } catch (e) {
        try {
          customerUrl = await getParam(`/seo-mcp/integrations/${customerId}/gsc-property`);
        } catch (e2) { /* ok */ }
      }

      return res.json({
        customer_id: customerId,
        name: req.portalCustomer.name,
        url: customerUrl,
        email: req.portalCustomer.email
      });
    } catch (err) {
      console.error('Portal /me error:', err);
      return res.status(500).json({ error: 'Serverfel' });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // POST /api/portal/users (kraver vanlig API-nyckel, inte JWT)
  // Skapar ett kundkonto i BigQuery customer_users
  // Body: { email, password, customer_id, name }
  // ══════════════════════════════════════════════════════════════

  app.post('/api/portal/users', async (req, res) => {
    // OBS: Denna endpoint anvander vanlig X-Api-Key auth (redan hanterat av middleware i index.js)
    try {
      const { email, password, customer_id, name } = req.body;
      if (!email || !password || !customer_id) {
        return res.status(400).json({ error: 'email, password och customer_id kravs' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { bq, dataset } = await getBigQuery();

      // Kolla om anvandaren redan finns
      const [existing] = await bq.query({
        query: `SELECT email FROM \`${dataset}.customer_users\` WHERE LOWER(email) = @email LIMIT 1`,
        params: { email: normalizedEmail },
        types: { email: 'STRING' }
      });

      if (existing && existing.length > 0) {
        return res.status(409).json({ error: 'Anvandaren finns redan' });
      }

      // Hasha losenord
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Satt in ny anvandare via DML INSERT (BigQuery sandbox-kompatibelt)
      await ensureCustomerUsersTable();

      const insertQuery = `INSERT INTO \`${dataset}.customer_users\`
        (email, password_hash, customer_id, name, created_at)
        VALUES (@email, @password_hash, @customer_id, @name, CURRENT_TIMESTAMP())`;

      await bq.query({
        query: insertQuery,
        params: {
          email: normalizedEmail,
          password_hash: passwordHash,
          customer_id: customer_id,
          name: name || ''
        },
        types: {
          email: 'STRING',
          password_hash: 'STRING',
          customer_id: 'STRING',
          name: 'STRING'
        }
      });

      console.log(`Portal user created: ${normalizedEmail} -> ${customer_id}`);

      return res.json({
        ok: true,
        message: 'Kundkonto skapat',
        email: normalizedEmail,
        customer_id: customer_id
      });

    } catch (err) {
      console.error('Portal create user error:', err);
      return res.status(500).json({ error: 'Serverfel vid skapande av konto' });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // POST /api/portal/users/:email/reset-password (kraver API-nyckel)
  // Body: { new_password }
  // ══════════════════════════════════════════════════════════════

  app.post('/api/portal/users/:email/reset-password', async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email).trim().toLowerCase();
      const { new_password } = req.body;
      if (!new_password) {
        return res.status(400).json({ error: 'new_password kravs' });
      }

      const { bq, dataset } = await getBigQuery();

      // Kontrollera att anvandaren finns
      const [existing] = await bq.query({
        query: `SELECT email FROM \`${dataset}.customer_users\` WHERE LOWER(email) = @email LIMIT 1`,
        params: { email },
        types: { email: 'STRING' }
      });

      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Anvandaren hittades inte' });
      }

      const passwordHash = await bcrypt.hash(new_password, 12);

      await bq.query({
        query: `UPDATE \`${dataset}.customer_users\` SET password_hash = @hash WHERE LOWER(email) = @email`,
        params: { hash: passwordHash, email },
        types: { hash: 'STRING', email: 'STRING' }
      });

      return res.json({ ok: true, message: 'Losenord aterstall' });
    } catch (err) {
      console.error('Portal reset password error:', err);
      return res.status(500).json({ error: 'Serverfel' });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // GET /api/portal/users (kraver API-nyckel)
  // Lista alla portalanvandare
  // ══════════════════════════════════════════════════════════════

  app.get('/api/portal/users', async (req, res) => {
    try {
      const { bq, dataset } = await getBigQuery();
      const [rows] = await bq.query({
        query: `SELECT email, customer_id, name, created_at, last_login
          FROM \`${dataset}.customer_users\`
          ORDER BY created_at DESC`
      });

      return res.json({ users: rows || [] });
    } catch (err) {
      console.error('Portal list users error:', err);
      return res.status(500).json({ error: 'Serverfel' });
    }
  });

  // ── Make middleware available for other routes that need portal auth ──
  app.portalAuth = verifyPortalToken;

  console.log('Portal auth routes registered: /api/portal/login, /api/portal/me, /api/portal/users');
};
