try { const u = new URL('https://\"addeloop.com\"'); console.log(u.href); } catch(e) { console.log('ERROR:', e.message); }
