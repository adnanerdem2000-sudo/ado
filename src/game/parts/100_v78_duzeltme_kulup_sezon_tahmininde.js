/* ================= v78: düzeltme — kulüp sezon tahmininde sonsuz döngü koruması (sezon ortası gelen oyuncu istatistiği) ================= */
const CSE_IN={};
clubSeasonEst=(old=>function(cid){if(CSE_IN[cid])return {};CSE_IN[cid]=1;try{return old.apply(this,arguments);}finally{delete CSE_IN[cid];}})(clubSeasonEst);

