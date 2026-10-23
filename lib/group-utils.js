// Helper bersama untuk command grup: cek admin, cari peserta, dsb.
// Mencocokkan lewat nomor/LID supaya tetap jalan di grup yang memakai LID.

function digits(jid) {
  return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

function participantIds(participant) {
  return [participant?.id, participant?.lid, participant?.jid, participant?.phoneNumber]
    .filter(Boolean)
    .map(digits)
    .filter(Boolean);
}

function sameParticipant(participant, jid) {
  const wanted = digits(jid);
  return Boolean(wanted) && participantIds(participant).includes(wanted);
}

function findParticipant(participants, jid) {
  return (participants || []).find(participant => sameParticipant(participant, jid)) || null;
}

function botIdsOf(sock) {
  return [sock?.user?.id, sock?.user?.lid].filter(Boolean);
}

async function getGroupRoles(sock, from, sender) {
  const meta = await sock.groupMetadata(from);
  const participants = meta.participants || [];
  const senderParticipant = findParticipant(participants, sender);
  const botParticipant = botIdsOf(sock).map(id => findParticipant(participants, id)).find(Boolean) || null;
  return {
    meta,
    participants,
    senderParticipant,
    senderIsAdmin: Boolean(senderParticipant?.admin),
    botIsAdmin: Boolean(botParticipant?.admin),
    isBot: jid => botIdsOf(sock).some(id => digits(id) === digits(jid)),
    find: jid => findParticipant(participants, jid),
  };
}

/**
 * Validasi umum command admin grup. Mengirim pesan error dan mengembalikan
 * null bila tidak lolos; selain itu mengembalikan hasil getGroupRoles.
 * options: { needBotAdmin = true, ownerBypass = true }
 */
async function requireGroupAdmin(sock, msg, ctx, options = {}) {
  const { from, sender, isGroup } = ctx;
  const { needBotAdmin = true, ownerBypass = true } = options;
  const reply = text => sock.sendMessage(from, { text }, { quoted: msg });
  if (!isGroup(from)) {
    await reply('❌ Command ini hanya bisa digunakan di grup.');
    return null;
  }
  let roles;
  try {
    roles = await getGroupRoles(sock, from, sender);
  } catch (error) {
    await reply(`❌ Gagal membaca data grup: ${error.message}`);
    return null;
  }
  const owner = ownerBypass && typeof ctx.isSenderOwner === 'function' && ctx.isSenderOwner();
  if (!roles.senderIsAdmin && !owner) {
    await reply('❌ Hanya admin grup yang dapat menggunakan command ini.');
    return null;
  }
  if (needBotAdmin && !roles.botIsAdmin) {
    await reply('❌ Jadikan bot sebagai admin grup terlebih dahulu.');
    return null;
  }
  return roles;
}

function targetFromMessage(msg, ctx) {
  const mentioned = ctx.mentioned?.[0];
  if (mentioned) return mentioned;
  const context = msg?.message?.extendedTextMessage?.contextInfo;
  return context?.participant || null;
}

module.exports = {
  digits,
  participantIds,
  sameParticipant,
  findParticipant,
  getGroupRoles,
  requireGroupAdmin,
  targetFromMessage,
};
