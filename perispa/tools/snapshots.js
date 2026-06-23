/**
 * perispa — Snapshot/Backup tools
 * Automatisk versionshantering av sidinnehåll
 * Sparar snapshots lokalt i perispa/snapshots/
 */

const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SNAPSHOTS_DIR = path.join(__dirname, '..', 'snapshots');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

function ensureDir() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

function snapshotPath(site, pageId) {
  return path.join(SNAPSHOTS_DIR, `${site}_${pageId}`);
}

module.exports = function registerSnapshotTools(server, getSite, wpFetch) {

  // --- Create snapshot ---
  server.tool('perispa_create_snapshot', 'Skapa en snapshot/backup av en sidas innehåll', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    label: z.string().optional().describe('Valfri etikett (t.ex. "före SEO-ändring")'),
  }, async (args) => {
    try {
      ensureDir();
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });

      const snapshot = {
        id: crypto.randomUUID(),
        created: new Date().toISOString(),
        site: s.slug,
        page_id: args.page_id,
        type: args.type,
        label: args.label || null,
        title: res.data.title?.raw || res.data.title?.rendered || '',
        content: res.data.content?.raw || res.data.content?.rendered || '',
        excerpt: res.data.excerpt?.raw || res.data.excerpt?.rendered || '',
        meta: res.data.meta || {},
        status: res.data.status,
        content_hash: crypto.createHash('md5').update(res.data.content?.raw || '').digest('hex'),
      };

      const dir = snapshotPath(s.slug, args.page_id);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = `${snapshot.id}.json`;
      fs.writeFileSync(path.join(dir, filename), JSON.stringify(snapshot, null, 2));

      return text({
        snapshot_id: snapshot.id,
        created: snapshot.created,
        label: snapshot.label,
        content_hash: snapshot.content_hash,
        content_length: snapshot.content.length,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- List snapshots ---
  server.tool('perispa_list_snapshots', 'Lista alla snapshots för en sida', {
    site: z.string().optional(),
    page_id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const dir = snapshotPath(s.slug, args.page_id);

      if (!fs.existsSync(dir)) return text({ snapshots: [], total: 0 });

      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      const snapshots = files.map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        return {
          snapshot_id: data.id,
          created: data.created,
          label: data.label,
          title: data.title,
          content_hash: data.content_hash,
          content_length: data.content?.length || 0,
        };
      }).sort((a, b) => new Date(b.created) - new Date(a.created));

      return text({ total: snapshots.length, snapshots });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Get snapshot ---
  server.tool('perispa_get_snapshot', 'Hämta en specifik snapshot', {
    site: z.string().optional(),
    page_id: z.number(),
    snapshot_id: z.string(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const filePath = path.join(snapshotPath(s.slug, args.page_id), `${args.snapshot_id}.json`);

      if (!fs.existsSync(filePath)) return err('Snapshot finns inte');

      const snapshot = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return text(snapshot);
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Restore snapshot ---
  server.tool('perispa_restore_snapshot', 'Återställ en sida till en tidigare snapshot', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    snapshot_id: z.string(),
    create_backup: z.boolean().optional().default(true).describe('Skapa backup av nuvarande innehåll först'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const filePath = path.join(snapshotPath(s.slug, args.page_id), `${args.snapshot_id}.json`);

      if (!fs.existsSync(filePath)) return err('Snapshot finns inte');

      const snapshot = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';

      // Backup nuvarande version först
      if (args.create_backup) {
        const current = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        const backupSnapshot = {
          id: crypto.randomUUID(),
          created: new Date().toISOString(),
          site: s.slug,
          page_id: args.page_id,
          type: args.type,
          label: `auto-backup före restore av ${args.snapshot_id}`,
          title: current.data.title?.raw || '',
          content: current.data.content?.raw || '',
          excerpt: current.data.excerpt?.raw || '',
          meta: current.data.meta || {},
          status: current.data.status,
          content_hash: crypto.createHash('md5').update(current.data.content?.raw || '').digest('hex'),
        };

        const dir = snapshotPath(s.slug, args.page_id);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${backupSnapshot.id}.json`), JSON.stringify(backupSnapshot, null, 2));
      }

      // Restore
      const body = { content: snapshot.content };
      if (snapshot.excerpt) body.excerpt = snapshot.excerpt;

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body });

      return text({
        restored: true,
        page_id: args.page_id,
        snapshot_id: args.snapshot_id,
        snapshot_date: snapshot.created,
        snapshot_label: snapshot.label,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Diff snapshots ---
  server.tool('perispa_diff_snapshots', 'Jämför två snapshots eller en snapshot med nuvarande version', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    snapshot_a: z.string().describe('Snapshot ID A (eller "current" för nuvarande)'),
    snapshot_b: z.string().describe('Snapshot ID B (eller "current" för nuvarande)'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const dir = snapshotPath(s.slug, args.page_id);

      let contentA, contentB, labelA, labelB;

      if (args.snapshot_a === 'current') {
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
        const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        contentA = res.data.content?.raw || res.data.content?.rendered || '';
        labelA = 'current';
      } else {
        const dataA = JSON.parse(fs.readFileSync(path.join(dir, `${args.snapshot_a}.json`), 'utf-8'));
        contentA = dataA.content;
        labelA = `${args.snapshot_a} (${dataA.created})`;
      }

      if (args.snapshot_b === 'current') {
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
        const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        contentB = res.data.content?.raw || res.data.content?.rendered || '';
        labelB = 'current';
      } else {
        const dataB = JSON.parse(fs.readFileSync(path.join(dir, `${args.snapshot_b}.json`), 'utf-8'));
        contentB = dataB.content;
        labelB = `${args.snapshot_b} (${dataB.created})`;
      }

      // Simple line diff
      const linesA = contentA.split('\n');
      const linesB = contentB.split('\n');
      const changes = [];
      const maxLines = Math.max(linesA.length, linesB.length);

      for (let i = 0; i < maxLines; i++) {
        if (linesA[i] !== linesB[i]) {
          changes.push({
            line: i + 1,
            a: (linesA[i] || '').slice(0, 200),
            b: (linesB[i] || '').slice(0, 200),
          });
        }
      }

      return text({
        a: labelA,
        b: labelB,
        a_length: contentA.length,
        b_length: contentB.length,
        identical: contentA === contentB,
        changed_lines: changes.length,
        changes: changes.slice(0, 50),
      });
    } catch (e) {
      return err(e.message);
    }
  });
};
