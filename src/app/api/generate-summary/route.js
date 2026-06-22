import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { matchData } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Fallback if API key is not configured
    if (!apiKey) {
      return NextResponse.json({ 
        summary: `Ini adalah ringkasan simulasi karena GEMINI_API_KEY belum dikonfigurasi di server. Pertandingan antara ${matchData?.home_team?.name || 'Tuan Rumah'} dan ${matchData?.away_team?.name || 'Tim Tamu'} berakhir dengan skor ${matchData?.home_score} - ${matchData?.away_score}. Pertandingan berlangsung sengit dengan penguasaan bola ${matchData?.stats?.possession_home || 50}% berbanding ${matchData?.stats?.possession_away || 50}%. Silakan tambahkan GEMINI_API_KEY di file .env.local untuk mengaktifkan ringkasan AI yang sesungguhnya.`
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Construct a comprehensive prompt based on match data
    const prompt = `
      Anda adalah seorang komentator dan analis sepak bola profesional yang sedang menulis ringkasan pertandingan untuk sebuah portal berita olahraga.
      Buatkan satu paragraf ringkasan pertandingan yang sangat menarik, dramatis, namun tetap analitis dan faktual berdasarkan data statistik berikut:
      
      Pertandingan: ${matchData?.home_team?.name} vs ${matchData?.away_team?.name}
      Skor Akhir: ${matchData?.home_score} - ${matchData?.away_score}
      Status: ${matchData?.status === 'finished' ? 'Selesai' : matchData?.status}
      
      Statistik Kunci:
      - Penguasaan Bola: ${matchData?.stats?.possession_home || 50}% (Home) vs ${matchData?.stats?.possession_away || 50}% (Away)
      - Total Tembakan: ${matchData?.stats?.shots_home || 0} vs ${matchData?.stats?.shots_away || 0}
      - Tembakan Tepat Sasaran: ${matchData?.stats?.shots_on_target_home || 0} vs ${matchData?.stats?.shots_on_target_away || 0}
      - Tendangan Sudut: ${matchData?.stats?.corners_home || 0} vs ${matchData?.stats?.corners_away || 0}
      - Pelanggaran: ${matchData?.stats?.fouls_home || 0} vs ${matchData?.stats?.fouls_away || 0}
      - Kartu Kuning: ${matchData?.stats?.yellow_cards_home || 0} vs ${matchData?.stats?.yellow_cards_away || 0}
      - Kartu Merah: ${matchData?.stats?.red_cards_home || 0} vs ${matchData?.stats?.red_cards_away || 0}
      
      Instruksi tambahan:
      - Format hasil dalam 1-2 paragraf saja, langsung intinya.
      - Gunakan bahasa Indonesia yang bergaya jurnalistik olahraga (contoh: "mendominasi jalannya laga", "tampil efektif", "hujan kartu", dsb).
      - Jangan menyertakan sapaan pembuka atau penutup (misal: "Halo", "Berikut adalah ringkasannya"). Langsung tuliskan narasi pertandingannya.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ 
      error: 'Gagal membuat ringkasan. Terjadi kesalahan pada server AI.',
      details: error.message 
    }, { status: 500 });
  }
}
