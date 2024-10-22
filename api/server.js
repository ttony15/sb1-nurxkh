import express from 'express';
import cors from 'cors';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();
const port = 3001;

app.use(cors());

app.get('/api/total-staking-points', async (req, res) => {
  try {
    const response = await axios.get('https://www.enkixyz.com/fantasy', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const stakingPointText = $('body').text().match(/Staking Point: ([\d.]+[KMBT])/i);
    
    if (stakingPointText && stakingPointText[1]) {
      let points = parseFloat(stakingPointText[1]);
      const unit = stakingPointText[1].slice(-1).toUpperCase();
      
      switch (unit) {
        case 'K': points *= 1e3; break;
        case 'M': points *= 1e6; break;
        case 'B': points *= 1e9; break;
        case 'T': points *= 1e12; break;
      }
      
      res.json({ totalStakingPoints: points });
    } else {
      res.status(404).json({ error: 'Staking points not found' });
    }
  } catch (error) {
    console.error('Error fetching staking points:', error.message);
    res.status(500).json({ error: 'Failed to fetch staking points', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});