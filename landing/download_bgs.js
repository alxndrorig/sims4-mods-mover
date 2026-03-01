const https = require('https');
const fs = require('fs');

const images = [
  { url: 'https://static.wikia.nocookie.net/sims/images/4/4e/Willow_Creek_neighborhood_with_lake_at_sunset.png', dest: 'public/bg1.png' },
  { url: 'https://static.wikia.nocookie.net/sims/images/d/df/Neighborhood_preview_Oasis_Springs_2.png', dest: 'public/bg2.png' },
  { url: 'https://static.wikia.nocookie.net/sims/images/7/7b/Windenburg.jpg', dest: 'public/bg3.jpg' },
  { url: 'https://static.wikia.nocookie.net/sims/images/5/52/San_Myshuno_preview.jpg', dest: 'public/bg4.jpg' }
];

images.forEach(({url, dest}) => {
  https.get(url, (res) => {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${dest}`);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${dest}: ${err.message}`);
  });
});
