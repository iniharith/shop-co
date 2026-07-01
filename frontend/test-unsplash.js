/**
 * Coded by Harith
 * Kampungcetak ®
 */
const https = require('https');

async function searchUnsplash(query) {
    return new Promise((resolve, reject) => {
        https.get(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=1`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.results && json.results.length > 0) {
                        resolve(json.results[0].urls.regular);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

(async () => {
    try {
        const url = await searchUnsplash('business card');
        console.log(url);
    } catch (e) {
        console.error(e);
    }
})();
