# Congre-Admin: Backend Alternatives Analysis

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## 1. Executive Summary

This document analyzes alternative backend options for Congre-Admin beyond the current Google Apps Script (GAS) + Google Sheets implementation. Each option is evaluated for technical feasibility, cost, complexity, and alignment with project goals (Zero-Knowledge encryption, GPL v3 licensing, community-driven development).

**Current Implementation:** GAS + Google Sheets (free, no-code setup, but limited)

**Recommended Hybrid Approach:** 
- **Tier 1 (Free):** Google Sheets (current)
- **Tier 2 (Self-hosted):** SQLite + optional sync
- **Tier 3 (Enterprise):** PostgreSQL with advanced features

---

## 2. Backend Options Overview

| Option | Type | Cost | Complexity | Self-Host | GPL Compatible |
|--------|------|------|------------|-----------|----------------|
| **Google Sheets (Current)** | Spreadsheet | Free | Low | ❌ No | ✅ Yes |
| **SQLite** | SQL (Embedded) | Free | Low | ✅ Yes | ✅ Yes |
| **PostgreSQL** | SQL (Server) | Free | Medium | ✅ Yes | ✅ Yes |
| **MySQL/MariaDB** | SQL (Server) | Free | Medium | ✅ Yes | ✅ Yes |
| **MongoDB** | NoSQL | Free-Paid | Medium | ✅ Yes | ✅ Yes |
| **Firebase** | NoSQL (BaaS) | Free-Paid | Low | ❌ No | ⚠️ Partial |
| **Supabase** | PostgreSQL (BaaS) | Free-Paid | Low | ✅ Yes | ✅ Yes |
| **Manual JSON Files** | File-based | Free | Low | ✅ Yes | ✅ Yes |
| **IPFS + P2P** | Distributed | Free | High | ✅ Yes | ✅ Yes |

---

## 3. Detailed Analysis

### 3.1. Google Sheets (Current Implementation)

**Architecture:**
```
Frontend (React PWA) → HTTPS → Google Apps Script → Google Sheets
```

**Advantages:**
- ✅ **Free** - No hosting costs
- ✅ **No setup** - Works out of the box
- ✅ **Familiar** - Users know spreadsheets
- ✅ **Built-in sync** - Google handles replication
- ✅ **Mobile access** - Google Sheets app available
- ✅ **Backup included** - Google version history

**Disadvantages:**
- ❌ **No Zero-Knowledge** - Google can read all data
- ❌ **Rate limits** - 6 min execution timeout
- ❌ **Vendor lock-in** - Tied to Google ecosystem
- ❌ **Limited queries** - No complex queries possible
- ❌ **Performance** - Slow for large datasets (>1000 rows)
- ❌ **10M cell limit** - Per spreadsheet
- ❌ **Internet required** - No true offline mode

**Best For:**
- Small congregations (<50 publishers)
- Quick deployment
- Non-technical users
- Prototyping and testing

**Cost Analysis:**
| Item | Cost |
|------|------|
| Hosting | $0 (Google) |
| Storage | $0 (15GB free with Google account) |
| Bandwidth | $0 |
| Maintenance | $0 |
| **Total** | **$0/year** |

---

### 3.2. SQLite (Embedded SQL Database)

**Architecture:**
```
Frontend (React PWA) → WASM SQLite → Local .db file → Optional: Sync Service
```

**Advantages:**
- ✅ **Free** - Public domain license
- ✅ **Zero configuration** - No server setup
- ✅ **Fast** - Native performance
- ✅ **Offline-first** - Works without internet
- ✅ **Self-hosted** - Full data control
- ✅ **Zero-Knowledge compatible** - Encrypt before write
- ✅ **Mature** - 30+ years of development
- ✅ **WASM support** - Runs in browser via SQL.js

**Disadvantages:**
- ❌ **No built-in sync** - Must implement separately
- ❌ **File-based** - Manual backup required
- ❌ **No concurrent writes** - Single writer limitation
- ❌ **Limited to one device** - Without sync solution

**Best For:**
- Offline-first deployments
- Single-device usage
- Privacy-focused congregations
- Self-hosting enthusiasts

**Cost Analysis:**
| Item | Cost |
|------|------|
| Database | $0 (Public domain) |
| Hosting | $0 (Local file) |
| Storage | $0 (Local disk) |
| Sync Service (optional) | $5-10/month (VPS) |
| **Total** | **$0-120/year** |

**Implementation Example:**
```javascript
// Using sql.js (WASM SQLite)
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();

// Create tables
db.run(`
  CREATE TABLE personas (
    id TEXT PRIMARY KEY,
    identidad BLOB,  -- Encrypted
    enc_contacto BLOB,  -- Encrypted
    _v INTEGER,
    _ts TEXT
  )
`);

// Insert encrypted data
db.run(
  'INSERT INTO personas VALUES (?, ?, ?, ?, ?)',
  [id, encryptedIdentidad, encryptedContacto, version, timestamp]
);

// Export for backup
const data = db.export();
const blob = new Blob([data], { type: 'application/x-sqlite3' });
```

---

### 3.3. PostgreSQL (Server-Based SQL)

**Architecture:**
```
Frontend (React PWA) → API Layer → PostgreSQL → Storage
```

**Advantages:**
- ✅ **Free** - Open source (PostgreSQL License)
- ✅ **Full-featured** - Advanced queries, triggers, views
- ✅ **Scalable** - Handles millions of records
- ✅ **ACID compliant** - Transaction safety
- ✅ **Extensions** - JSONB, full-text search, encryption
- ✅ **Self-hosted** - Full data control
- ✅ **Zero-Knowledge compatible** - pgcrypto extension
- ✅ **Multi-user** - Proper concurrency

**Disadvantages:**
- ❌ **Requires server** - Hosting cost or self-host
- ❌ **Setup complexity** - Database administration needed
- ❌ **Maintenance** - Backups, updates, monitoring
- ❌ **Internet required** - For remote access

**Best For:**
- Large congregations (>100 publishers)
- Multi-congregation deployments
- Advanced reporting needs
- Technical congregations

**Cost Analysis:**
| Item | Cost |
|------|------|
| Database | $0 (Open source) |
| Hosting (VPS) | $5-20/month |
| Storage | $0 (included in VPS) |
| Backup Service | $0 (self-managed) or $5/month |
| **Total** | **$60-300/year** |

**Implementation Example:**
```javascript
// Using pg (PostgreSQL client)
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  database: 'congre_admin',
  user: 'congre_user',
  password: process.env.DB_PASSWORD,
});

// Insert encrypted data
await pool.query(
  'INSERT INTO personas (id, identidad, enc_contacto, _v, _ts) VALUES ($1, $2, $3, $4, $5)',
  [id, encryptedIdentidad, encryptedContacto, version, timestamp]
);

// Query with JSONata-like filtering
const result = await pool.query(`
  SELECT * FROM personas 
  WHERE enc_servicio->>'etiquetas' ? 'Anciano'
`);
```

---

### 3.4. MongoDB (NoSQL Document Database)

**Architecture:**
```
Frontend (React PWA) → API Layer → MongoDB → Storage
```

**Advantages:**
- ✅ **Free** - Server Side Public License (SSPL)
- ✅ **Flexible schema** - Easy to evolve data model
- ✅ **JSON-native** - Natural fit for JavaScript
- ✅ **Scalable** - Horizontal scaling (sharding)
- ✅ **Rich queries** - Aggregation pipeline
- ✅ **Self-hosted** - Full data control
- ✅ **Zero-Knowledge compatible** - Encrypt fields before save

**Disadvantages:**
- ❌ **Requires server** - Hosting cost or self-host
- ❌ **Memory intensive** - Higher resource usage
- ❌ **No transactions** (single document only)
- ❌ **SSPL license** - Some restrictions for SaaS providers
- ❌ **Maintenance** - Database administration needed

**Best For:**
- Rapid prototyping
- Flexible data models
- JSON-heavy workloads
- Technical congregations

**Cost Analysis:**
| Item | Cost |
|------|------|
| Database | $0 (SSPL) |
| Hosting (VPS) | $5-20/month |
| MongoDB Atlas (managed) | $0-9/month (free tier available) |
| **Total** | **$0-240/year** |

**Implementation Example:**
```javascript
// Using MongoDB native driver
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('congre_admin');
const personas = db.collection('personas');

// Insert encrypted document
await personas.insertOne({
  _id: id,
  identidad: encryptedIdentidad,
  enc_contacto: encryptedContacto,
  enc_servicio: encryptedServicio,
  _v: version,
  _ts: timestamp
});

// Query with aggregation
const ancianos = await personas.aggregate([
  { $match: { 'enc_servicio.etiquetas': 'Anciano' } }
]).toArray();
```

---

### 3.5. Firebase (Backend-as-a-Service)

**Architecture:**
```
Frontend (React PWA) → Firebase SDK → Firestore → Google Cloud
```

**Advantages:**
- ✅ **Free tier** - Generous free limits
- ✅ **Real-time sync** - Built-in real-time updates
- ✅ **Offline support** - Local cache with sync
- ✅ **No server setup** - Fully managed
- ✅ **Authentication** - Built-in auth system
- ✅ **Scalable** - Google infrastructure

**Disadvantages:**
- ❌ **Vendor lock-in** - Tied to Google/Firebase
- ❌ **No Zero-Knowledge** - Google can read data
- ❌ **Cost at scale** - Expensive for large datasets
- ❌ **Query limitations** - Limited query capabilities
- ❌ **GPL compatibility** - ⚠️ Partial (proprietary service)

**Best For:**
- Rapid prototyping
- Small congregations
- Real-time collaboration needs
- Non-technical users

**Cost Analysis:**
| Item | Cost |
|------|------|
| Database | $0 (Free tier: 1GB storage) |
| Hosting | $0 (Firebase Hosting free tier) |
| Authentication | $0 (Free tier included) |
| Beyond free tier | ~$0.06/GB/month |
| **Total** | **$0-50/year** (small congregation) |

**Implementation Example:**
```javascript
// Using Firebase Firestore
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const db = getFirestore();

// Add encrypted document
await addDoc(collection(db, 'personas'), {
  id: id,
  identidad: encryptedIdentidad,  // Encrypted before sending
  enc_contacto: encryptedContacto,
  _v: version,
  _ts: timestamp,
  // Zero-Knowledge: Google sees only ciphertext
});
```

---

### 3.6. Supabase (PostgreSQL BaaS)

**Architecture:**
```
Frontend (React PWA) → Supabase JS Client → PostgreSQL → Storage
```

**Advantages:**
- ✅ **Free tier** - Generous free limits (500MB database)
- ✅ **PostgreSQL** - Full SQL power
- ✅ **Real-time** - Built-in real-time subscriptions
- ✅ **Authentication** - Built-in auth with RLS
- ✅ **Self-hostable** - Can self-host entire stack
- ✅ **Open source** - MIT License (GPL compatible)
- ✅ **Zero-Knowledge compatible** - Client-side encryption + RLS

**Disadvantages:**
- ❌ **Newer platform** - Less mature than Firebase
- ❌ **Limited free tier** - 500MB database limit
- ❌ **Requires PostgreSQL knowledge** - For advanced features

**Best For:**
- congregations wanting SQL power without complexity
- Self-hosting with managed option
- Real-time collaboration
- GPL-compatible open source stack

**Cost Analysis:**
| Item | Cost |
|------|------|
| Database | $0 (Free tier: 500MB) |
| Hosting (managed) | $0 (Free tier) or $25/month (Pro) |
| Self-hosted | $5-10/month (VPS) |
| **Total** | **$0-300/year** |

**Implementation Example:**
```javascript
// Using Supabase JS Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Insert encrypted data
const { data, error } = await supabase
  .from('personas')
  .insert({
    id: id,
    identidad: encryptedIdentidad,
    enc_contacto: encryptedContacto,
    _v: version,
    _ts: timestamp
  });

// Real-time subscription
supabase
  .channel('personas')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'personas' },
    payload => console.log('Change received!', payload)
  )
  .subscribe();
```

---

### 3.7. Manual JSON Files (File-Based Sharing)

**Architecture:**
```
Frontend (React PWA) → Local Storage → Export JSON → Manual Share → Import JSON
```

**Advantages:**
- ✅ **Free** - No infrastructure needed
- ✅ **Complete control** - Files stay on user devices
- ✅ **Zero-Knowledge** - Encrypt before export
- ✅ **Offline** - Works without internet
- ✅ **Simple** - No server setup
- ✅ **GPL compatible** - No vendor lock-in
- ✅ **Portable** - JSON files work anywhere

**Disadvantages:**
- ❌ **Manual sync** - Users must manually share files
- ❌ **No real-time** - Changes don't sync automatically
- ❌ **Conflict resolution** - Manual merge required
- ❌ **Error-prone** - Users can lose/corrupt files
- ❌ **No collaboration** - One person edits at a time

**Best For:**
- Very small congregations (<20 publishers)
- Offline-only deployments
- Maximum privacy (no cloud)
- Backup strategy (alongside other backends)

**Cost Analysis:**
| Item | Cost |
|------|------|
| Software | $0 |
| Storage | $0 (Local disk) |
| Sharing | $0 (Email, USB, etc.) |
| **Total** | **$0/year** |

**Implementation Example:**
```javascript
// Export data to JSON
async function exportData() {
  const data = await db.getAll('personas');
  
  // Encrypt entire export
  const encrypted = await encryptData(data, masterKey);
  
  const blob = new Blob([JSON.stringify(encrypted)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `congre-backup-${new Date().toISOString()}.json`;
  a.click();
}

// Import data from JSON
async function importData(file, masterKey) {
  const text = await file.text();
  const encrypted = JSON.parse(text);
  const data = await decryptData(encrypted, masterKey);
  
  // Merge with existing data
  await db.bulkPut('personas', data);
}
```

---

### 3.8. IPFS + P2P (Distributed Storage)

**Architecture:**
```
Frontend (React PWA) → IPFS JS → IPFS Network → Distributed Storage
```

**Advantages:**
- ✅ **Decentralized** - No single point of failure
- ✅ **Censorship-resistant** - Data can't be removed
- ✅ **Free** - No hosting costs (community nodes)
- ✅ **Zero-Knowledge compatible** - Encrypt before pinning
- ✅ **GPL compatible** - Open source (MIT/Apache)
- ✅ **Permanent** - Data persists as long as network exists

**Disadvantages:**
- ❌ **Complex** - Requires understanding of IPFS/p2p
- ❌ **Slow** - Slower than centralized storage
- ❌ **Unreliable** - Data availability depends on pinning
- ❌ **Large bundles** - IPFS JS library is large (~2MB)
- ❌ **No built-in auth** - Must implement separately

**Best For:**
- Maximum decentralization
- Censorship-resistant deployments
- Technical congregations
- Experimental/early adopters

**Cost Analysis:**
| Item | Cost |
|------|------|
| IPFS Network | $0 (Public network) |
| Pinning Service | $0-10/month (optional) |
| **Total** | **$0-120/year** |

**Implementation Example:**
```javascript
// Using IPFS HTTP Client
import { create } from 'ipfs-http-client';

const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

// Add encrypted data to IPFS
async function pinData(data) {
  const encrypted = await encryptData(data, masterKey);
  const result = await ipfs.add(JSON.stringify(encrypted));
  return result.path;  // IPFS hash (CID)
}

// Retrieve data from IPFS
async function getData(cid) {
  const encrypted = await ipfs.cat(cid);
  const data = await decryptData(JSON.parse(encrypted), masterKey);
  return data;
}
```

---

## 4. Comparison Matrix

### 4.1. Technical Comparison

| Feature | GSheets | SQLite | PostgreSQL | MongoDB | Firebase | Supabase | JSON Files | IPFS |
|---------|---------|--------|------------|---------|----------|----------|------------|------|
| **Zero-Knowledge** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Offline-First** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ⚠️ |
| **Real-Time Sync** | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ |
| **Multi-User** | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Self-Host** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Setup Complexity** | Low | Low | Medium | Medium | Low | Low | Low | High |
| **Query Power** | Low | Medium | High | High | Low | High | N/A | Low |
| **Scalability** | Low | Low | High | High | High | High | Low | Medium |

### 4.2. Cost Comparison (Annual)

| Backend | Free Tier | Small (<50) | Medium (50-200) | Large (>200) |
|---------|-----------|-------------|-----------------|--------------|
| **GSheets** | ✅ $0 | ✅ $0 | ✅ $0 | ⚠️ $0 (limits) |
| **SQLite** | ✅ $0 | ✅ $0 | ⚠️ $60 (sync) | ⚠️ $120 (sync) |
| **PostgreSQL** | ⚠️ $0 (self) | ⚠️ $60 | ⚠️ $120 | ❌ $300+ |
| **MongoDB** | ✅ $0 (Atlas) | ✅ $0 | ⚠️ $60 | ❌ $240+ |
| **Firebase** | ✅ $0 | ✅ $0 | ⚠️ $50 | ❌ $500+ |
| **Supabase** | ✅ $0 | ✅ $0 | ⚠️ $60 | ❌ $300+ |
| **JSON Files** | ✅ $0 | ✅ $0 | ❌ (impractical) | ❌ (impractical) |
| **IPFS** | ✅ $0 | ✅ $0 | ⚠️ $60 (pinning) | ⚠️ $120 (pinning) |

### 4.3. GPL v3 Compatibility

| Backend | License | GPL Compatible | Open Source | Self-Host | Notes |
|---------|---------|----------------|-------------|-----------|-------|
| **GSheets** | Proprietary | ✅ Yes | ❌ No | ❌ No | Service, not software |
| **SQLite** | Public Domain | ✅ Yes | ✅ Yes | ✅ Yes | Fully compatible |
| **PostgreSQL** | PostgreSQL License | ✅ Yes | ✅ Yes | ✅ Yes | Fully compatible |
| **MongoDB** | SSPL | ⚠️ Partial | ✅ Yes | ✅ Yes | SSPL has restrictions |
| **Firebase** | Proprietary | ⚠️ Partial | ❌ No | ❌ No | Service, not software |
| **Supabase** | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Fully compatible |
| **JSON Files** | N/A | ✅ Yes | ✅ Yes | ✅ Yes | Format, not software |
| **IPFS** | MIT/Apache | ✅ Yes | ✅ Yes | ✅ Yes | Fully compatible |

---

## 5. Recommended Strategy

### 5.1. Hybrid Backend Architecture

**Recommendation:** Implement a **backend abstraction layer** that supports multiple backends:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React PWA)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Zero-     │  │   JSONata   │  │   UI        │         │
│  │   Knowledge │  │   Engine    │  │   Components│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Abstraction Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  DataService│  │  SyncQueue  │  │  Encryption │         │
│  │  Interface  │  │  (Offline)  │  │  Wrapper    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Google       │   │  SQLite       │   │  PostgreSQL   │
│  Sheets       │   │  (Local)      │   │  (Self-host)  │
│  (Free tier)  │   │  (Offline)    │   │  (Enterprise) │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 5.2. Deployment Tiers

**Tier 1: Free (Google Sheets)**
- **Target:** Small congregations, testing, prototyping
- **Features:** All core features
- **Limitations:** 10M cells, 6 min timeout, no Zero-Knowledge
- **Cost:** $0/year

**Tier 2: Self-Hosted (SQLite + Optional Sync)**
- **Target:** Privacy-focused, offline-first, medium congregations
- **Features:** Zero-Knowledge, offline, full control
- **Limitations:** Manual sync or VPS cost
- **Cost:** $0-120/year

**Tier 3: Enterprise (PostgreSQL/Supabase)**
- **Target:** Large congregations, multi-congregation, advanced features
- **Features:** Full SQL, real-time, multi-user, Zero-Knowledge
- **Limitations:** Requires technical knowledge or hosting cost
- **Cost:** $0-300/year

### 5.3. Implementation Roadmap

**Phase 1 (Months 1-3):** Google Sheets Backend
- Implement current GAS + GSheets design
- Focus on core features (CLM, Territories, Publishers)
- Test with pilot congregations

**Phase 2 (Months 4-6):** Backend Abstraction Layer
- Create DataService interface
- Implement SQLite adapter (sql.js WASM)
- Add export/import functionality

**Phase 3 (Months 7-9):** Sync Solution
- Implement sync queue (IndexedDB)
- Add optional VPS sync server
- Conflict resolution strategy

**Phase 4 (Months 10-12):** PostgreSQL Adapter
- Implement PostgreSQL adapter
- Add Supabase integration
- Multi-congregation support

---

## 6. Migration Strategy

### 6.1. Data Portability

**Requirement:** All backends MUST support export/import in standard format.

**Export Format:**
```json
{
  "version": "1.0",
  "exported_at": "2026-03-20T10:00:00Z",
  "congregation_id": "uuid",
  "tables": {
    "personas": [...],
    "reuniones": [...],
    "territorios": [...]
  },
  "encryption": {
    "algorithm": "AES-GCM",
    "version": "1.0"
  }
}
```

### 6.2. Migration Paths

```
GSheets → SQLite: Export JSON → Import to SQLite
SQLite → PostgreSQL: Export JSON → Import to PostgreSQL
PostgreSQL → GSheets: Export JSON → Import to GSheets
Any → Any: Export JSON → Import to target backend
```

### 6.3. Backup Strategy

**Recommendation:** 3-2-1 backup rule
- **3** copies of data
- **2** different media types
- **1** offsite backup

**Implementation:**
1. **Primary:** Active backend (GSheets/SQLite/PostgreSQL)
2. **Secondary:** Local JSON export (weekly)
3. **Tertiary:** Encrypted cloud backup (monthly)

---

## 7. Decision Framework

### Questions to Ask:

1. **What is the congregation size?**
   - <50 publishers → GSheets or SQLite
   - 50-200 publishers → SQLite or Supabase
   - >200 publishers → PostgreSQL

2. **Is Zero-Knowledge required?**
   - Yes → SQLite, PostgreSQL, Supabase, JSON Files, IPFS
   - No → GSheets, Firebase (easier setup)

3. **Is offline support required?**
   - Yes → SQLite, JSON Files
   - No → Any backend

4. **Is multi-user collaboration needed?**
   - Yes → PostgreSQL, Supabase, Firebase
   - No → SQLite, JSON Files

5. **What is the technical expertise?**
   - Low → GSheets, Firebase, Supabase (managed)
   - Medium → Supabase (self-host), SQLite
   - High → PostgreSQL, IPFS

6. **What is the budget?**
   - $0 → GSheets, SQLite, JSON Files
   - $50-100/year → Supabase (Pro), SQLite + VPS
   - $100-300/year → PostgreSQL (managed)

---

## 8. Conclusion

**Recommended Approach:** Start with **Google Sheets** for rapid deployment, then implement **backend abstraction layer** to support **SQLite** (offline/privacy) and **PostgreSQL/Supabase** (enterprise).

**Rationale:**
1. **GSheets** enables quick launch with zero infrastructure
2. **SQLite** provides offline-first and Zero-Knowledge for privacy-focused users
3. **PostgreSQL** scales for large congregations and advanced features
4. **Abstraction layer** ensures data portability and prevents vendor lock-in

**GPL v3 Considerations:**
- All recommended backends are GPL-compatible
- Self-hosting option preserves user freedom
- Data portability prevents lock-in

**Next Steps:**
1. Complete GSheets implementation (current)
2. Design DataService interface
3. Implement SQLite adapter (sql.js)
4. Add export/import functionality
5. Optional: Implement Supabase adapter

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20  
**License:** GPL v3 (part of Congre-Admin documentation)
