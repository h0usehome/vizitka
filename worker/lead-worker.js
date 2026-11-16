/**
 * Cloudflare Worker: принимает заявку с сайта и пересылает её в Telegram.
 * Токен бота хранится в секретах Cloudflare и не попадает в код сайта.
 *
 * Нужные переменные (Settings → Variables and Secrets):
 *   BOT_TOKEN      — секрет, токен бота от @BotFather
 *   CHAT_ID        — id чата или группы, куда слать заявки (можно несколько через запятую)
 *   ALLOWED_ORIGIN — адрес сайта, например https://h0usehome.github.io
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : allowed[0] || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { ok: false });
    if (!okOrigin) return reply(403, { ok: false });

    let data;
    try { data = await request.json(); } catch { return reply(400, { ok: false }); }

    // Поле-ловушка: человек его не видит, а бот заполняет. Делаем вид, что всё хорошо.
    if (data.website) return reply(200, { ok: true });

    const clean = (v, max) => String(v || '').replace(/[<>]/g, '').trim().slice(0, max);
    const name = clean(data.name, 80);
    const phone = clean(data.phone, 24);
    const page = clean(data.page, 200);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 9) return reply(400, { ok: false });

    const text = `<b>Новая заявка с сайта</b>\nИмя: ${name}\nТелефон: ${phone}\nСтраница: ${page}`;
    const chats = String(env.CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
    const results = await Promise.all(chats.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
      })));
    return results.length && results.every((r) => r.ok) ? reply(200, { ok: true }) : reply(502, { ok: false });
  },
};
