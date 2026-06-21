fetch('https://vosstaxi.no').then(r=>r.text()).then(t=>console.log(t.match(/https:\/\/vosstaxi\.no[^"']*logo[^"']*/g)))
