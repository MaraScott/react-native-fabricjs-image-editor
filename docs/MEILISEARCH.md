# Meilisearch Integration

This documentation site uses [Meilisearch](https://www.meilisearch.com/) as its search engine for fast, typo-tolerant search.

## Features

- ⚡ **Lightning Fast**: Sub-millisecond search results
- 🔍 **Typo Tolerant**: Finds results even with spelling mistakes
- 🎯 **Relevant Results**: Smart ranking algorithm
- 🌐 **Open Source**: Self-hosted search engine
- 🐳 **Docker Ready**: Easy deployment with Docker Compose

## Quick Start

### 1. Start Meilisearch Server

```bash
npm run meilisearch:start
```

This will start Meilisearch in a Docker container on port 7700.

### 2. Index Documentation

```bash
npm run meilisearch:index
```

This will index all markdown files from the `docs/` directory.

### 3. Start Documentation Site

```bash
npm start
```

The search bar will now be powered by Meilisearch!

## All-in-One Setup

Run everything at once:

```bash
npm run search:setup && npm start
```

## Architecture

### Components

1. **Meilisearch Server** (`docker-compose.meilisearch.yml`)
   - Runs in Docker container
   - Port: 7700
   - Data persisted in Docker volume

2. **Indexing Script** (`scripts/index-meilisearch.js`)
   - Crawls all `.md` files in `docs/`
   - Extracts title, content, headings
   - Uploads to Meilisearch index

3. **Search Component** (`src/components/MeilisearchBar/`)
   - React component with search input
   - Uses `@meilisearch/instant-meilisearch` adapter
   - Real-time search as you type
   - Displays highlighted results

4. **Theme Integration** (`src/theme/SearchBar.tsx`)
   - Swizzled Docusaurus search bar
   - Replaces default search with Meilisearch

## Configuration

### Environment Variables

Create a `.env` file:

```bash
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=docs_search_master_key_change_in_production
MEILI_SEARCH_KEY=docs_search_master_key_change_in_production
```

⚠️ **Important**: Change the master key in production!

### Meilisearch Settings

The indexing script configures:

- **Searchable Attributes**: `title`, `content`, `hierarchy`
- **Filterable Attributes**: `sidebar_position`
- **Ranking Rules**: Standard Meilisearch ranking
- **Primary Key**: File path-based ID

## Usage

### Search Features

- **Instant Results**: See results as you type
- **Fuzzy Matching**: Handles typos gracefully
- **Highlighting**: Matched terms are highlighted
- **Hierarchy Display**: Shows document structure
- **Content Preview**: 150 character preview

### Keyboard Shortcuts

- `Escape`: Close search results
- Click outside: Close search results

## Maintenance

### Reindex Documentation

After updating documentation:

```bash
npm run meilisearch:index
```

### View Meilisearch Dashboard

Open [http://localhost:7700](http://localhost:7700) in your browser.

### Stop Meilisearch

```bash
npm run meilisearch:stop
```

### Clear Index

```bash
docker exec fabric-editor-meilisearch curl -X DELETE http://localhost:7700/indexes/docs \
  -H "Authorization: Bearer docs_search_master_key_change_in_production"
```

## Production Deployment

### 1. Secure the Master Key

Generate a secure key:

```bash
openssl rand -base64 32
```

Update in:
- `docker-compose.meilisearch.yml`
- Environment variables
- `docusaurus.config.ts`

### 2. Use HTTPS

Configure reverse proxy (nginx/traefik) for HTTPS.

### 3. Set API Keys

Create separate keys for indexing and searching:

```bash
# In Meilisearch dashboard or via API
# Indexing key: read/write on 'docs' index
# Search key: read-only on 'docs' index
```

### 4. Automate Reindexing

Add to your CI/CD pipeline:

```yaml
# Example: GitHub Actions
- name: Index to Meilisearch
  run: |
    npm run meilisearch:index
  env:
    MEILI_HOST: ${{ secrets.MEILI_HOST }}
    MEILI_MASTER_KEY: ${{ secrets.MEILI_MASTER_KEY }}
```

## Troubleshooting

### Cannot Connect to Meilisearch

```bash
# Check if container is running
docker ps | grep meilisearch

# Check logs
docker logs fabric-editor-meilisearch

# Restart container
npm run meilisearch:stop
npm run meilisearch:start
```

### No Search Results

```bash
# Check index stats
curl http://localhost:7700/indexes/docs/stats \
  -H "Authorization: Bearer docs_search_master_key_change_in_production"

# Reindex
npm run meilisearch:index
```

### Search Bar Not Appearing

1. Check browser console for errors
2. Verify `MeilisearchBar` component is imported
3. Check `SearchBar.tsx` theme override
4. Clear Docusaurus cache: `npm run clear`

## Resources

- [Meilisearch Documentation](https://www.meilisearch.com/docs)
- [Meilisearch GitHub](https://github.com/meilisearch/meilisearch)
- [instant-meilisearch](https://github.com/meilisearch/meilisearch-js-plugins/tree/main/packages/instant-meilisearch)
- [Docusaurus Search](https://docusaurus.io/docs/search)

## License

Meilisearch is licensed under the MIT License.
