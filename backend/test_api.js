const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('https://shop-co-production.up.railway.app/api/tasks');
    console.log("Tasks length:", res.data?.data?.length || res.data?.tasks?.length || res.data?.length);
    console.log("Response keys:", Object.keys(res.data));
    console.log("Response type:", typeof res.data);
    if (res.data?.success !== undefined) console.log("Success flag:", res.data.success);
    
    // Also test artworks
    const artworksRes = await axios.get('https://shop-co-production.up.railway.app/api/files');
    console.log("\nArtworks keys:", Object.keys(artworksRes.data));
  } catch (e) {
    console.error(e.message);
  }
})();
