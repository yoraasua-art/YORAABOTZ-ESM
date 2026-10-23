function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function auditPlugins(pluginList = []) {
  const issues = [];
  const keys = new Map();

  if (!Array.isArray(pluginList)) {
    return { ok: false, issues: ['pluginList bukan array'], totalPlugins: 0, totalCommands: 0 };
  }

  for (const plugin of pluginList) {
    const fileName = plugin?.name || '<tanpa nama>';
    if (!plugin || typeof plugin !== 'object') {
      issues.push(`${fileName}: plugin bukan object`);
      continue;
    }

    const name = normalize(plugin.name);
    if (!/^[a-z0-9_-]+$/.test(name)) {
      issues.push(`${fileName}: nama command tidak valid`);
    }
    if (typeof plugin.execute !== 'function') {
      issues.push(`${fileName}: execute() tidak tersedia`);
    }

    const aliases = Array.isArray(plugin.aliases) ? plugin.aliases : [];
    for (const aliasValue of aliases) {
      const alias = normalize(aliasValue);
      if (!/^[a-z0-9_-]+$/.test(alias)) {
        issues.push(`${name}: alias "${aliasValue}" tidak valid`);
        continue;
      }
      if (alias === name) {
        issues.push(`${name}: alias sama dengan command utama`);
        continue;
      }
      if (keys.has(alias) && keys.get(alias) !== name) {
        issues.push(`bentrok alias "${alias}" antara ${keys.get(alias)} dan ${name}`);
      } else {
        keys.set(alias, name);
      }
    }

    if (keys.has(name) && keys.get(name) !== name) {
      issues.push(`bentrok command "${name}" dengan alias plugin ${keys.get(name)}`);
    } else {
      keys.set(name, name);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    totalPlugins: pluginList.length,
    totalCommands: keys.size,
  };
}

module.exports = { auditPlugins };
