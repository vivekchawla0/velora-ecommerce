const axios = require('axios');

const candidateReplacements = {
  monitor_1: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80',
  monitor_2: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  powerbank_1: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
  powerbank_2: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
  facemist_1: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80',
  facemist_2: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80',
  book_1: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  book_2: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  book_3: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
  book_4: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80',
  book_5: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
  chair_1: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80',
  chair_2: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&auto=format&fit=crop&q=80',
  chair_3: 'https://images.unsplash.com/photo-1589384267710-7a25be15f7dc?w=800&auto=format&fit=crop&q=80',
};

async function testCandidates() {
  console.log('Testing replacement candidate URLs...');
  for (const [k, url] of Object.entries(candidateReplacements)) {
    try {
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 });
      console.log(`[PASS ${res.status}] ${k}: ${url}`);
    } catch (e) {
      console.log(`[FAIL] ${k}: ${e.message}`);
    }
  }
}

testCandidates();
