/* ================= v180: her ülkenin bayrağı — eksik 28 ülke bayrağı ve adı; iki harfli lig ülke kodları (RS, UA…) üç harfli bayrak koduna çevrilir ================= */
Object.assign(NAT_TR,{MOZ:'Mozambik',THA:'Tayland',MWI:'Malavi',AFG:'Afganistan',SRI:'Sri Lanka',GUY:'Guyana',GRL:'Grönland',BAN:'Bangladeş',NAM:'Namibya',SKN:'Saint Kitts ve Nevis',
  BER:'Bermuda',SIN:'Singapur',LCA:'Saint Lucia',BRB:'Barbados',GRN:'Grenada',MSR:'Montserrat',OMA:'Umman',ATG:'Antigua ve Barbuda',AND:'Andorra',GUF:'Fransız Guyanası',
  SSD:'Güney Sudan',SMR:'San Marino',SDN:'Sudan',STP:'São Tomé ve Príncipe',PUR:'Porto Riko',TKM:'Türkmenistan',NCL:'Yeni Kaledonya',VIN:'Saint Vincent ve Grenadinler'});
Object.assign(EUCC3,{AR:'ARG',US:'USA',MX:'MEX',RU:'RUS',JP:'JPN',NO:'NOR',SE:'SWE',PO:'POL',CZ:'CZE',UA:'UKR',HR:'CRO',RS:'SRB'});
flagImg=(old=>function(n,cls){if(n&&!FLAGS[n]&&EUCC3[n]&&FLAGS[EUCC3[n]])n=EUCC3[n];return old.call(this,n,cls);})(flagImg);
