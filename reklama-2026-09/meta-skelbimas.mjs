#!/usr/bin/env node
// Meta skelbimo kurimas ir patikra.
//
// Raktas NIEKADA nerasomas i faila. Jis paduodamas per aplinkos kintamaji:
//
//   PowerShell:  $env:FB_TOKEN = "<raktas>"; node meta-skelbimas.mjs tikrink
//   bash:        FB_TOKEN=<raktas> node meta-skelbimas.mjs tikrink
//
// Komandos:
//   tikrink   nieko nekeicia - parodo kampanija, grupes, vaizdus, skelbimus
//   kurk      sukuria skelbimo turini ir SUSTABDYTA skelbima
//   sutrauk   sustabdo nebereikalinga antra reklamu grupe

// Windows: process.exit() su dar atviru fetch lizdu paleidzia libuv tvirtinima
// ("UV_HANDLE_CLOSING") ir islejimo kodas virsta 127. Todel stabdoma metant,
// o kodas nustatomas process.exitCode - Node isseina pats, kai ciklas issituscina.
class Stabdyk extends Error {
  constructor(kodas = 1) {
    super('stabdyk');
    this.kodas = kodas;
  }
}
const stok = (kodas = 1) => {
  throw new Stabdyk(kodas);
};

const TOKEN = process.env.FB_TOKEN;
if (!TOKEN) {
  console.error('FB_TOKEN nenustatytas. Zr. komentara failo virsuje.');
  process.exitCode = 2;
}

const ACT = process.env.FB_ACT || 'act_1795776818513375';
const CAMPAIGN = process.env.FB_CAMPAIGN || '120254377001750440';

const VERSIJOS = ['v24.0', 'v23.0', 'v22.0', 'v21.0', 'v20.0'];
let V = process.env.FB_API || null;

const base = () => `https://graph.facebook.com/${V}`;
const eil = (o) => JSON.stringify(o, null, 2);

async function call(path, { method = 'GET', body = null, params = {} } = {}) {
  const url = new URL(`${base()}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const opts = { method, headers: { Authorization: `Bearer ${TOKEN}` } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  let j;
  try {
    j = await r.json();
  } catch {
    j = { _tekstas: await r.text() };
  }
  return { ok: r.ok, status: r.status, j };
}

async function parinkVersija() {
  if (V) return;
  for (const kand of VERSIJOS) {
    V = kand;
    const r = await call('me', { params: { fields: 'id' } });
    if (r.ok) {
      console.log(`API versija: ${V}`);
      return;
    }
    // Rakto klaida reiskia, kad versija gera, o raktas blogas - toliau eiti nera prasmes.
    const kodas = r.j?.error?.code;
    if (kodas === 190 || kodas === 102) {
      console.error(`Raktas atmestas (${V}): ${r.j?.error?.message}`);
      stok(1);
    }
  }
  console.error('Nepavyko parinkti API versijos. Nustatyk FB_API rankomis.');
  stok(1);
}

async function tikrink() {
  console.log('\n=== KAMPANIJA ===');
  const c = await call(CAMPAIGN, {
    params: { fields: 'id,name,status,effective_status,objective,special_ad_categories,created_time' },
  });
  console.log(eil(c.ok ? c.j : c.j?.error || c.j));

  console.log('\n=== REKLAMU GRUPES ===');
  const a = await call(`${CAMPAIGN}/adsets`, {
    params: {
      fields: 'id,name,status,effective_status,daily_budget,targeting,optimization_goal,billing_event',
      limit: '25',
    },
  });
  if (a.ok) {
    const d = a.j.data || [];
    for (const s of d) {
      const geo = s.targeting?.geo_locations?.countries?.join(',') || '-';
      const os = s.targeting?.user_os?.join(',') || 'visos';
      const b = s.daily_budget ? `${(s.daily_budget / 100).toFixed(2)} EUR/d` : '-';
      console.log(`- ${s.id}  ${s.name}  [${s.effective_status}]  biudzetas=${b}  salys=${geo}  OS=${os}`);
    }
    if (!d.length) console.log('(grupiu nera)');
  } else console.log(eil(a.j?.error || a.j));

  console.log('\n=== SKELBIMAI ===');
  const ads = await call(`${CAMPAIGN}/ads`, {
    params: { fields: 'id,name,status,effective_status,creative', limit: '25' },
  });
  if (ads.ok) {
    const d = ads.j.data || [];
    console.log(d.length ? d.map((x) => `- ${x.id} ${x.name} [${x.effective_status}]`).join('\n') : '(skelbimu NERA)');
  } else console.log(eil(ads.j?.error || ads.j));

  console.log('\n=== VAIZDAI BIBLIOTEKOJE ===');
  const im = await call(`${ACT}/adimages`, {
    params: { fields: 'hash,name,width,height,created_time', limit: '25' },
  });
  if (im.ok) {
    const d = im.j.data || [];
    console.log(d.length ? d.map((x) => `- ${x.hash}  ${x.name}  ${x.width}x${x.height}`).join('\n') : '(vaizdu NERA)');
  } else console.log(eil(im.j?.error || im.j));
}

async function kurk() {
  const fs = await import('node:fs/promises');
  const spec = JSON.parse(await fs.readFile(new URL('./spec-skelbimas.json', import.meta.url), 'utf8'));

  console.log('Tikrinu, ar vaizdas bibliotekoje...');
  const im = await call(`${ACT}/adimages`, { params: { fields: 'hash,width,height', limit: '50' } });
  const rastas = (im.j?.data || []).some((x) => x.hash === spec.link_data.image_hash);
  console.log(rastas ? 'Vaizdas rastas.' : 'DEMESIO: vaizdo su tokia zyme biblioteka negrazino.');

  if (!rastas) {
    console.log('Ikeliu is naujo: app-1x1.png');
    const buf = await fs.readFile(new URL('./app-1x1.png', import.meta.url));
    const fd = new FormData();
    fd.set('access_token', TOKEN);
    fd.set('filename', new Blob([buf], { type: 'image/png' }), 'app-1x1.png');
    const r = await fetch(`${base()}/${ACT}/adimages`, { method: 'POST', body: fd });
    const j = await r.json();
    if (!r.ok) {
      console.error(`Ikelti nepavyko: ${eil(j?.error || j)}`);
      stok(1);
    }
    const h = Object.values(j.images || {})[0]?.hash;
    if (!h) {
      console.error(`Atsakyme nera zymes: ${eil(j)}`);
      stok(1);
    }
    console.log(`Nauja zyme: ${h}`);
    spec.link_data.image_hash = h;
    // Irasom atgal, kad kitas paleidimas nekeltu to paties failo is naujo.
    await fs.writeFile(new URL('./spec-skelbimas.json', import.meta.url), `${JSON.stringify(spec, null, 2)}
`, 'utf8');
  }

  console.log('\nKuriu skelbimo turini...');
  const cr = await call(`${ACT}/adcreatives`, {
    method: 'POST',
    body: {
      name: 'organizatoriai - sasaja telefone 1x1',
      object_story_spec: spec,
      degrees_of_freedom_spec: {
        creative_features_spec: { standard_enhancements: { enroll_status: 'OPT_OUT' } },
      },
    },
  });
  if (!cr.ok) {
    console.error('\nTURINIO SUKURTI NEPAVYKO:');
    console.error(eil(cr.j?.error || cr.j));
    console.error('\nJei klaidoje minima programele arba leidimai - reiskia,');
    console.error('kad "Litchidev Page Manager" vis dar Development busenoje.');
    stok(1);
  }
  console.log(`Turinys sukurtas: ${cr.j.id}`);

  const as = await call(`${CAMPAIGN}/adsets`, {
    params: { fields: 'id,name,effective_status,targeting', limit: '25' },
  });
  const visos = as.j?.data || [];
  // Adresas dabar tinka abiem platformoms, tad skelbimas kabinamas ant grupes BE
  // OS apribojimo. Jei tokios nera - imama pirma, bet tada verta paleisti `sutrauk`.
  const grupe = visos.find((x) => !x.targeting?.user_os) || visos[0];
  if (!grupe) {
    console.error('Reklamu grupes nerasta - skelbimo pakabinti nera kur.');
    stok(1);
  }
  console.log(`Kabinu ant grupes: ${grupe.id} (${grupe.name})`);

  const ad = await call(`${ACT}/ads`, {
    method: 'POST',
    body: {
      name: 'organizatoriai - sasaja telefone 1x1',
      adset_id: grupe.id,
      creative: { creative_id: cr.j.id },
      status: 'PAUSED',
    },
  });
  if (!ad.ok) {
    console.error('Skelbimo sukurti nepavyko:');
    console.error(eil(ad.j?.error || ad.j));
    stok(1);
  }
  console.log(`\nSKELBIMAS SUKURTAS: ${ad.j.id} - busena SUSTABDYTA.`);
  console.log('Ads Manager -> Ads. Paleisi pats, kai nuspresi biudzeta.');
}

async function sutrauk() {
  const as = await call(`${CAMPAIGN}/adsets`, {
    params: { fields: 'id,name,status,effective_status,targeting', limit: '25' },
  });
  const d = as.j?.data || [];
  if (!d.length) {
    console.log('Grupiu nera.');
    return;
  }

  // Lieka Android grupe - tiesiog todel, kad Lietuvoje Android dalis didesne.
  // Nuo jos nuimamas OS apribojimas: adresas dabar tinka abiem platformoms.
  const lieka = d.find((x) => (x.targeting?.user_os || []).includes('Android')) || d[0];
  const t = { ...(lieka.targeting || {}) };
  delete t.user_os;

  const r = await call(lieka.id, {
    method: 'POST',
    body: { name: 'Organizatoriai - visi irenginiai', targeting: t },
  });
  if (!r.ok) {
    console.error(`Grupes pakeisti nepavyko: ${eil(r.j?.error || r.j)}`);
    stok(1);
  }
  console.log(`${lieka.id} -> "Organizatoriai - visi irenginiai", OS apribojimas nuimtas`);

  for (const g of d.filter((x) => x.id !== lieka.id)) {
    if (g.status === 'PAUSED') {
      console.log(`${g.id} ${g.name} -> jau sustabdyta, nelieciu`);
      continue;
    }
    const pr = await call(g.id, { method: 'POST', body: { status: 'PAUSED' } });
    console.log(`${g.id} ${g.name} -> ${pr.ok ? 'SUSTABDYTA' : eil(pr.j?.error || pr.j)}`);
  }
  console.log('Nereikalingu grupiu NENAIKINU - tik sustabdau.');
}

async function main() {
  const cmd = process.argv[2] || 'tikrink';
  await parinkVersija();
  if (cmd === 'tikrink') await tikrink();
  else if (cmd === 'kurk') await kurk();
  else if (cmd === 'sutrauk') await sutrauk();
  else {
    console.error('Komandos: tikrink | kurk | sutrauk');
    stok(2);
  }
}

if (TOKEN) {
  try {
    await main();
  } catch (e) {
    if (e instanceof Stabdyk) process.exitCode = e.kodas;
    else throw e;
  }
}
