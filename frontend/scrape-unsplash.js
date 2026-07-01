/**
 * Coded by Harith
 * Kampungcetak ®
 */
const https = require('https');

function scrapeUnsplash(keyword) {
    return new Promise((resolve) => {
        https.get(`https://unsplash.com/s/photos/${keyword}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const match = data.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+\?crop=[^\"]+/);
                if (match) resolve(match[0]);
                else resolve(null);
            });
        }).on('error', () => resolve(null));
    });
}

scrapeUnsplash('banner').then(console.log);
