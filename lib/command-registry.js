function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getCommandEntries(pluginList = [], { includeOwner = true } = {}) {
  const entries = [];
  for (const plugin of pluginList) {
    if (!plugin || typeof plugin !== 'object' || typeof plugin.execute !== 'function') continue;
    if (!includeOwner && plugin.category === 'owner') continue;
    const name = normalize(plugin.name);
    if (!name) continue;
    const aliases = [...new Set((Array.isArray(plugin.aliases) ? plugin.aliases : [])
      .map(normalize)
      .filter(alias => /^[a-z0-9_-]+$/.test(alias) && alias !== name))];
    entries.push({
      name,
      category: normalize(plugin.category) || 'other',
      aliases,
      premium: Boolean(plugin.premium),
      description: String(plugin.description || '').trim(),
    });
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

function buildLookup(pluginList = []) {
  const lookup = new Map();
  for (const entry of getCommandEntries(pluginList)) {
    lookup.set(entry.name, entry.name);
    for (const alias of entry.aliases) lookup.set(alias, entry.name);
  }
  return lookup;
}

function groupByCategory(pluginList = [], options = {}) {
  const grouped = new Map();
  for (const entry of getCommandEntries(pluginList, options)) {
    if (!grouped.has(entry.category)) grouped.set(entry.category, []);
    grouped.get(entry.category).push(entry);
  }
  return grouped;
}

function countCommands(pluginList = [], options = {}) {
  return getCommandEntries(pluginList, options).reduce((total, entry) => total + 1 + entry.aliases.length, 0);
}

module.exports = { normalize, getCommandEntries, buildLookup, groupByCategory, countCommands };
