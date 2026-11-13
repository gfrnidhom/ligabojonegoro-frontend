import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { matchData, forceRefresh } = body;

    const routerBaseUrl = process.env.NINE_ROUTER_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
    const routerApiKey = process.env.NINE_ROUTER_API_KEY || '';
    const routerModel = process.env.NINE_ROUTER_MODEL || 'gemini-2.5-flash';

    // 1. If matchData already has persisted summary in statistics and not force refresh
    if (!forceRefresh && matchData?.statistics?.ai_summary) {
      return NextResponse.json({
        summary: matchData.statistics.ai_summary,
        model: matchData.statistics.ai_summary_model || routerModel,
        updatedAt: matchData.statistics.ai_summary_updated_at,
        cached: true,
      });
    }

    // 2. Format detailed match events & statistics for prompt
    const home = matchData?.home_team?.name || 'Tuan Rumah';
    const away = matchData?.away_team?.name || 'Tim Tamu';
    const hScore = matchData?.home_score ?? 0;
    const aScore = matchData?.away_score ?? 0;
    const stats = matchData?.statistics || matchData?.stats || {};
    const events = matchData?.events || [];

    const eventDetails = events.map(e => {
      const min = e.minute ? `Menit ${e.minute}'` : 'Menit -';
      const team = e.team_id === matchData?.home_team?.id ? home : away;
      const player = e.player?.name || 'Pemain';

      if (e.event_type === 'goal') return `- ${min}: Gol untuk ${team} oleh ${player}`;
      if (e.event_type === 'penalty') return `- ${min}: Gol penalti untuk ${team} oleh ${player}`;
      if (e.event_type === 'own_goal') return `- ${min}: Gol bunuh diri oleh ${player} (${team})`;
      if (e.event_type === 'disallowed_goal') {
        return `- ${min}: GOL DIANULIR (-1) untuk ${team} oleh ${player}. Alasan: ${e.event_data?.reason || 'Pelanggaran'}`;
      }
      if (e.event_type === 'yellow_card') return `- ${min}: Kartu kuning untuk ${player} (${team})`;
      if (e.event_type === 'red_card') return `- ${min}: Kartu merah untuk ${player} (${team})`;
      return null;
    }).filter(Boolean);

    const prompt = `
Anda adalah seorang analis dan jurnalis olahraga profesional untuk kompetisi Liga Bojonegoro.
Buat ringkasan dan analisis pertandingan yang padat, menarik, dramatis, namun tetap analitis dan faktual berdasarkan data berikut:

Pertandingan: ${home} vs ${away}
Skor Akhir: ${hScore} - ${aScore}
Status: ${matchData?.status === 'finished' ? 'Selesai (Full Time)' : (matchData?.status || 'Selesai')}

Rentetan Kejadian:
${eventDetails.length > 0 ? eventDetails.join('\n') : '- Pertandingan berlangsung normal tanpa kartu merah atau gol penalti.'}

Statistik Pertandingan:
- Penguasaan Bola: ${stats.possession_home || 50}% (${home}) vs ${stats.possession_away || 50}% (${away})
- Total Tembakan: ${stats.shots_home ?? 0} vs ${stats.shots_away ?? 0}
- Tepat Sasaran: ${stats.shots_on_target_home ?? 0} vs ${stats.shots_on_target_away ?? 0}
- Tendangan Sudut: ${stats.corners_home ?? 0} vs ${stats.corners_away ?? 0}
- Pelanggaran: ${stats.fouls_home ?? 0} vs ${stats.fouls_away ?? 0}

Instruksi:
- Tulis dalam 1-2 paragraf mengalir padat dalam Bahasa Indonesia jurnalistik olahraga yang seru dan objektif.
- Jangan gunakan format markdown judul (#), bullet points, sapaan pembuka (seperti "Halo"), atau kata penutup klise.
- Langsung masuk ke narasi jalannya pertandingan.
    `.trim();

    // 3. Call 9Router OpenAI-compatible API
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (routerApiKey) {
        headers['Authorization'] = `Bearer ${routerApiKey}`;
      }

      const res = await fetch(`${routerBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: routerModel,
          messages: [
            {
              role: 'system',
              content: 'Anda adalah seorang jurnalis dan analis olahraga profesional. Tulis ulasan pertandingan sepak bola dalam 1-2 paragraf narasi tanpa judul atau sapaan pembuka/penutup.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
          // 9router streams (SSE) unless told otherwise; we need a single JSON body
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          // Clean up any stray markdown fences
          const cleaned = text.replace(/^```(?:markdown)?\s*/i, '').replace(/\s*```$/, '').trim();
          return NextResponse.json({
            summary: cleaned,
            model: `9Router (${routerModel})`,
            isFallback: false,
          });
        }
      }
      console.warn('9Router returned non-OK status:', res.status);
    } catch (routerErr) {
      console.warn('9Router connection failed, falling back:', routerErr.message);
    }

    // 4. Fallback Generator if 9Router is offline
    const hPoss = parseInt(stats.possession_home) || 50;
    const aPoss = parseInt(stats.possession_away) || 50;
    const hShots = parseInt(stats.shots_home) || 0;
    const aShots = parseInt(stats.shots_away) || 0;

    let resultText = '';
    if (hScore > aScore) resultText = `${home} sukses mengamankan kemenangan berharga atas tamunya ${away} dengan keunggulan ${hScore}-${aScore}.`;
    else if (aScore > hScore) resultText = `${away} berhasil mencuri poin penuh dari markas ${home} usai menyudahi laga dengan skor ${hScore}-${aScore}.`;
    else resultText = `Pertarungan ketat antara ${home} dan ${away} harus berakhir tanpa pemenang setelah kedua tim bermain imbang ${hScore}-${aScore}.`;

    let possText = '';
    if (hPoss > 55) possText = `Tuan rumah ${home} mendikte jalannya permainan dengan dominasi penguasaan bola mencapai ${hPoss}%.`;
    else if (aPoss > 55) possText = `Tim tamu ${away} bermain agresif dan berhasil memegang kendali lini tengah dengan ${aPoss}% penguasaan bola.`;
    else possText = `Pertarungan di lini tengah berjalan sengit dengan persentase penguasaan bola yang berimbang.`;

    let attackText = (hShots > 0 || aShots > 0)
      ? ` Laga berlangsung terbuka di mana ${home} mencatatkan ${hShots} tembakan berbanding ${aShots} tembakan dari kubu ${away}.`
      : '';

    const fallbackSummary = `${resultText} ${possText}${attackText}`;

    return NextResponse.json({
      summary: fallbackSummary,
      model: 'Rule-based Engine (Fallback)',
      isFallback: true
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Gagal memproses ringkasan pertandingan.' },
      { status: 500 }
    );
  }
}
