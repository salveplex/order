fetch('https://vosstaxi.no').then(r=>r.text()).then(t=>console.log(t.match(/src=[\"\']([^\"\']+?(?:logo|voss)[^\"\']+)[\"\']/ig)))
