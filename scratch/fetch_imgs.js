fetch('https://vosstaxi.no').then(r=>r.text()).then(t => {
  const matches = t.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  console.log(matches);
});
