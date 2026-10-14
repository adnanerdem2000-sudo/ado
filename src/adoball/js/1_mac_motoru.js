    const commentaryTemplates = {
        buildUp: [
            "{team}, orta alanda kısa paslarla boşluk arıyor; top {player} ile buluştu.",
            "{player} ayağında topu sakladı, şimdi takım arkadaşına vererek oyunu yönlendiriyor.",
            "Tempo bu dakikalarda yükseldi, {team} organize bir şekilde rakip yarı alana yerleşiyor.",
            "{player} enfes bir çalımla rakibinden sıyrıldı, pasını aktardı.",
            "{team} takımı sağ kanattan etkili paslaşmalarla bindirme yapıyor."
        ],
        shotOnTarget: [
            "Tehlikeli pozisyon! {player} ceza sahası dışından sert vurdu, kaleci son anda çeldi!",
            "{player} kaleyi cepheden gördü ve vurdu! Kaleci için zor bir top oldu.",
            "Ceza sahası içinde karambol! {player} vuruşunu yaptı ancak savunma veya kaleci siper oldu.",
            "{player} kaleciyle karşı karşıya kaldı, vuruşunda kaleci inanılmaz bir refleks gösterdi!"
        ],
        shotOffTarget: [
            "{player} şansını uzaklardan denedi ancak top çerçeveyi bulmadı, aut.",
            "Gelişen akın sonucunda {player} kafayı vurdu ama meşin yuvarlak dışarı gitti.",
            "{player} ceza yayı üzerinden vuruşunu yaptı, top kalenin hemen yanından auta çıkıyor."
        ],
        goal: [
            "İNANILMAZ BİR GOL! {player} topu ağlara gönderdi, tribünler yıkılıyor!",
            "Ve GOL! {team} adına ağları sarsan isim {player} oldu! Mükemmel bir gol izliyoruz!",
            "{player} ceza sahasında topla buluştu, düzgün ve sert bir vuruşla topu köşeye bıraktı: GOL!",
            "Harika bir pas ve GOL! {player} takımını öne geçiren o kritik vuruşu yapıyor!"
        ],
        penaltyGoal: [
            "Penaltı atışında topun başına {player} geçti... Ve gol! Kaleci ayrı köşeye, top ayrı köşeye gitti!",
            "{player} penaltı noktasından hata yapmadı ve meşin yuvarlağı ağlarla buluşturdu!"
        ],
        varCancel: [
            "Hakem kulaklığından gelen tavsiye üzerine VAR monitörüne gidiyor... Pozisyonda faul tespit edildi, gol iptal!",
            "VAR incelemesi tamamlandı; hakem golü ofsayt gerekçesiyle geçersiz kılıyor."
        ],
        yellowCard: [
            "Sert müdahale! Hakem pozisyonun ardından {player} kartsız geçmiyor, sarı kart.",
            "{player} rakibinin hücumunu durdurmak için yaptığı faul sonrasında sarı kartla cezalandırıldı."
        ],
        redCard: [
            "VAR incelemesi sonrası hakem kararını değiştiriyor: {player} için doğrudan kırmızı kart!",
            "Sahadaki VAR ekranına giden hakem, {player}'in müdahalesini kırmızı kartlık buluyor. {team} 10 kişi kalıyor!"
        ]
    };

    function getCommentary(category, data) {
        let list = commentaryTemplates[category];
        let template = list[Math.floor(Math.random() * list.length)];
        return template.replace(/{player}/g, `<span class="event-player">${data.player}</span>`)
                       .replace(/{team}/g, `<strong>${data.team}</strong>`);
    }

    const rawPlayerData = [
        ["Kylian Mbappé","SF",97,77,88,93,85,75,94,90,73,30,26,93], ["Erling Haaland","SF",89,93,82,80,65,53,96,94,83,32,38,96],
        ["Harry Kane","SF",79,83,83,82,85,87,95,93,86,39,40,94], ["Ousmane Dembélé","SF",93,54,73,88,81,75,77,82,45,30,35,80],
        ["Victor Osimhen","SF",90,85,80,82,70,60,89,86,84,35,30,88], ["Marcus Thuram","SF",87,83,81,83,76,65,84,85,80,40,35,85],
        ["Hugo Ekitiké","SF",84,72,74,80,72,62,77,78,70,30,28,76], ["Cristiano Ronaldo","SF",77,76,73,80,78,70,89,92,90,30,24,92],
        ["Benjamin Šeško","SF",86,81,77,78,70,60,82,84,80,35,30,80], ["Danny Welbeck","SF",78,76,74,75,73,65,76,78,75,40,35,78],
        ["Vedat Muriqi","SF",65,92,85,70,68,60,82,84,92,45,40,82], ["Marko Arnautović","SF",68,82,68,78,75,68,81,83,78,40,35,82],
        ["Cédric Bakambu","SF",85,76,75,76,70,60,78,80,72,35,30,79],
        
        ["Khvicha Kvaratskhelia","SLK",88,70,78,90,83,75,82,84,65,40,35,84], ["Raphinha","SLK",91,68,84,87,82,78,81,85,60,50,45,83],
        ["Luis Díaz","SLK",92,72,83,88,78,70,80,82,65,40,35,82], ["Bradley Barcola","SLK",90,65,75,85,78,70,76,75,60,35,30,77],
        ["Jérémy Doku","SLK",95,62,72,92,76,68,70,75,55,30,28,75], ["Cody Gakpo","SLK",85,78,80,84,80,75,84,86,70,45,40,84],
        ["Barış Alper Yılmaz","SLK",91,85,90,78,72,68,75,82,70,65,60,78], ["Kerem Aktürkoğlu","SLK",88,62,82,82,75,70,78,79,55,40,35,78],
        ["Wilfried Zaha","SLK",89,74,78,86,75,70,78,82,65,40,35,78], ["Ansu Fati","SLK",86,60,65,83,76,68,78,79,60,35,30,78],
        ["Dorgeles Nene","SLK",90,60,70,78,68,60,72,70,55,30,28,72],

        ["Jude Bellingham","MOO",83,83,93,88,87,84,86,85,78,80,75,88], ["Bruno Fernandes","MOO",75,68,94,84,90,92,84,88,60,65,60,86],
        ["Dominik Szoboszlai","MOO",84,74,86,84,85,86,80,90,65,65,60,82], ["Lionel Messi","MOO",80,60,70,94,91,90,87,85,60,30,20,89],
        ["Cole Palmer","MOO",81,62,78,86,85,83,82,81,60,50,45,83], ["Arda Güler","MOO",78,55,68,85,84,82,75,78,50,45,40,78],
        ["Phil Foden","MOO",85,60,84,90,86,82,85,84,55,50,45,86], ["Rayan Cherki","MOO",80,68,72,86,80,76,74,76,50,35,30,76],
        ["Jamal Musiala","MOO",86,62,80,93,84,78,80,78,55,55,50,85], ["Lorenzo Pellegrini","MOO",76,70,84,82,85,83,78,82,65,65,60,82],
        ["Marco Asensio","MOO",77,65,72,82,83,80,78,86,55,40,35,80], ["Bilal El Khannouss","MOO",78,60,75,82,78,75,72,74,50,45,40,75],
        ["Christian Eriksen","MOO",68,58,72,80,88,87,74,80,55,55,50,78], ["Ernest Muçi","MOO",84,65,75,80,75,70,76,78,55,40,35,76],

        ["Lamine Yamal","SĞK",85,55,70,87,80,75,78,76,50,35,30,79], ["Michael Olise","SĞK",84,65,78,86,82,80,78,80,55,45,40,80],
        ["Bukayo Saka","SĞK",86,72,86,87,83,78,82,84,60,65,60,85], ["Désiré Doué","SĞK",82,65,72,84,78,72,74,76,55,45,40,76],
        ["Bryan Mbeumo","SĞK",86,78,84,82,78,72,80,82,65,50,45,82], ["Federico Chiesa","SĞK",90,70,78,86,78,72,81,84,60,45,40,82],
        ["Pedro Neto","SĞK",91,65,78,86,78,72,76,80,55,40,35,80], ["Mason Greenwood","SĞK",85,70,78,84,78,72,82,84,65,45,40,82],
        ["Leroy Sané","SĞK",92,68,80,88,80,75,81,85,55,40,35,82], ["Edon Zhegrova","SĞK",88,60,74,85,76,70,75,78,50,35,30,77],
        ["Oleksandr Zubkov","SĞK",82,72,78,78,75,70,74,78,60,45,40,76], ["Václav Černý","SĞK",84,64,74,80,74,68,76,78,55,40,35,76],

        ["Vitinha","MO",78,65,85,85,88,84,76,80,55,70,68,80], ["Pedri","MO",78,60,86,88,90,86,72,74,55,72,68,82],
        ["Federico Valverde","MO",90,80,92,84,86,85,80,86,65,80,78,85], ["Declan Rice","MO",76,83,92,78,87,85,74,82,70,88,86,82],
        ["Scott McTominay","MO",74,86,88,74,78,76,78,84,80,78,75,80], ["Alexis Mac Allister","MO",75,74,86,84,88,85,78,82,60,78,75,82],
        ["Fabián Ruiz","MO",72,72,82,84,88,86,76,80,60,76,74,80], ["Luka Modrić","MO",72,58,74,88,92,90,76,80,55,70,68,80],
        ["Eduardo Camavinga","MO",82,76,86,85,86,82,70,78,65,82,80,80], ["Gabriel Sara","MO",78,72,82,80,82,80,75,78,60,70,68,78],
        ["İlkay Gündoğan","MO",70,70,80,86,89,86,82,80,65,72,70,84], ["Matías Vecino","MO",68,78,82,74,78,76,72,78,75,76,74,76],
        ["Suat Serdar","MO",74,75,80,78,78,75,70,76,65,76,74,76],

        ["Rodri","MDO",65,84,92,80,92,90,78,86,75,88,88,85], ["Moisés Caicedo","MDO",78,78,90,80,84,82,68,76,60,85,83,78],
        ["Joshua Kimmich","MDO",74,72,92,83,90,90,74,78,65,82,80,82], ["Aurélien Tchouaméni","MDO",78,85,88,80,85,84,72,82,75,86,85,78],
        ["Ryan Gravenberch","MDO",78,78,82,84,82,80,74,80,65,76,74,78], ["Manuel Locatelli","MDO",70,76,84,80,85,85,70,78,65,82,80,78],
        ["Mikel Merino","MDO",74,82,88,82,84,82,76,78,80,82,80,80], ["Orkun Kökçü","MDO",75,72,84,82,86,84,78,82,60,72,70,78],
        ["Leandro Paredes","MDO",68,74,78,82,88,88,70,80,60,78,76,76], ["Sofyan Amrabat","MDO",72,84,90,78,82,82,65,78,65,82,80,75],
        ["Senny Mayulu","MDO",76,68,75,78,75,72,60,65,55,68,65,70], ["Rani Khedira","MDO",68,82,84,72,75,72,60,70,70,82,80,72],
        ["Axel Witsel","MDO",60,82,72,75,84,82,70,78,75,82,82,75],

        ["Nuno Mendes","SLB",90,72,85,84,80,74,65,76,60,80,78,76], ["Marc Cucurella","SLB",82,70,90,78,80,75,60,70,65,82,80,78],
        ["Federico Dimarco","SLB",80,70,88,82,84,86,70,84,65,76,75,78], ["Nico O'Reilly","SLB",78,65,75,74,72,68,55,60,50,68,65,70],
        ["Alejandro Grimaldo","SLB",84,68,90,85,86,84,74,82,60,78,76,80], ["Alejandro Balde","SLB",92,68,82,82,78,72,60,70,55,78,75,76],
        ["Djed Spence","SLB",88,74,80,78,72,68,58,68,60,74,72,74], ["Milos Kerkez","SLB",86,72,84,76,74,70,60,72,60,75,74,75],
        ["Álvaro Carreras","SLB",82,68,78,75,72,68,55,65,55,72,70,72], ["Luke Shaw","SLB",80,80,82,80,82,80,60,76,65,82,80,78],
        ["Nuno Tavares","SLB",88,78,84,78,72,68,60,72,65,74,70,74], ["Eren Elmalı","SLB",84,75,86,75,72,68,55,68,60,76,74,75],

        ["Gabriel Magalhães","STP",72,88,82,65,76,78,50,70,88,88,86,60], ["Willian Pacho","STP",80,84,80,68,72,68,45,60,80,82,80,55],
        ["Alessandro Bastoni","STP",74,82,84,74,82,82,50,65,84,86,88,60], ["Micky van de Ven","STP",90,82,80,70,76,72,40,65,78,84,82,55],
        ["Joško Gvardiol","STP",82,84,84,78,80,78,60,76,82,86,85,65], ["Nico Schlotterbeck","STP",78,82,82,72,78,76,55,74,84,84,82,60],
        ["David Alaba","STP",78,76,80,80,85,84,65,80,75,84,85,70], ["Levi Colwill","STP",75,80,78,70,78,76,45,65,78,82,80,55],
        ["Pau Torres","STP",74,78,78,72,82,82,45,65,80,84,82,55], ["Daley Blind","STP",60,72,70,76,86,88,55,75,72,80,82,65],
        ["Ayden Heaven","STP",72,70,68,65,68,65,40,55,70,68,65,50], ["Virgil van Dijk","STP",78,92,82,70,80,82,60,80,90,92,90,65],
        ["William Saliba","STP",82,86,84,72,78,76,45,65,84,88,88,55], ["Dayot Upamecano","STP",84,88,78,70,76,74,45,65,84,84,82,55],
        ["Jonathan Tah","STP",76,92,80,60,68,68,40,65,86,85,84,50], ["Ibrahima Konaté","STP",80,88,76,68,74,72,45,65,85,84,82,50],
        ["Pau Cubarsí","STP",72,74,72,74,80,78,40,60,75,78,76,55], ["Dean Huijsen","STP",70,76,74,68,74,72,45,60,76,75,74,50],
        ["Abdukodir Khusanov","STP",76,82,78,65,68,65,40,60,78,76,74,50], ["Merih Demiral","STP",72,88,80,60,65,60,45,60,88,82,80,50],
        ["Victor Lindelöf","STP",70,78,78,68,78,78,45,65,80,80,80,55], ["Çağlar Söyüncü","STP",72,84,78,65,70,68,45,65,84,80,82,50],

        ["Achraf Hakimi","SĞB",92,76,92,84,82,78,72,80,65,78,76,82], ["Jules Koundé","SĞB",84,82,86,78,82,80,55,68,82,86,85,74],
        ["Pedro Porro","SĞB",84,72,88,82,80,78,70,82,65,78,75,78], ["Jurriën Timber","SĞB",82,80,82,78,82,80,55,65,78,84,82,72],
        ["Denzel Dumfries","SĞB",84,88,90,75,76,72,68,78,82,78,76,80], ["Trent Alexander-Arnold","SĞB",78,70,86,82,88,92,72,84,65,78,76,82],
        ["Matheus Nunes","SĞB",84,74,84,85,82,78,70,76,60,72,70,78], ["João Cancelo","SĞB",84,70,86,86,85,84,72,80,65,78,75,82],
        ["Kieran Trippier","SĞB",74,70,84,78,84,86,60,78,65,78,78,76], ["Zeki Çelik","SĞB",80,76,86,74,74,70,55,70,72,78,76,75],
        ["Guéla Doué","SĞB",82,74,80,76,72,68,50,65,65,74,72,72], ["Gonzalo Montiel","SĞB",82,72,84,76,75,72,55,68,65,78,76,74],
        ["Jayden Bogle","SĞB",84,68,82,78,72,68,60,70,60,72,70,75],

        ["Thibaut Courtois","KL",90,85,89,76,86], ["Gianluigi Donnarumma","KL",89,90,83,75,85],
        ["Jan Oblak","KL",86,84,88,74,82], ["Gregor Kobel","KL",88,86,84,76,83],
        ["David Raya","KL",86,84,82,88,80], ["Emiliano Martínez","KL",85,83,84,80,83],
        ["Manuel Neuer","KL",85,82,87,90,84], ["Alex Meret","KL",82,80,82,75,80],
        ["Uğurcan Çakır","KL",80,82,78,70,78], ["Bart Verbruggen","KL",78,80,76,75,75],
        ["James Trafford","KL",76,78,74,72,74], ["Jack Butland","KL",78,76,78,70,75],
        ["Yvon Mvogo","KL",76,78,75,70,74]
        /* [oyuncu50] 10.10.2026: 50 yeni gercek oyuncu (FC 27) */,
        ["Lautaro Martínez","SF",80,65,83,85,80,70,91,86,85,49,45,92], ["Julián Alvarez","SF",86,72,82,87,83,78,86,87,77,55,60,87], ["Alexander Isak","SF",81,75,75,82,78,63,87,88,82,33,35,88], ["Viktor Gyökeres","SF",81,91,78,78,77,64,88,86,81,40,40,87], ["Serhou Guirassy","SF",72,85,81,81,80,69,86,86,90,41,42,87],
        ["Vinícius Júnior","SLK",93,68,84,91,82,78,87,83,50,37,21,86], ["Nico Williams","SLK",93,61,81,86,78,78,79,76,62,31,36,82], ["Rodrygo","SLK",87,59,76,87,80,74,79,76,67,36,24,83], ["Rafael Leão","SLK",93,77,74,83,84,76,81,79,73,25,22,76], ["Matheus Cunha","SLK",77,68,82,84,81,77,84,89,68,40,43,81],
        ["Mohamed Salah","SĞK",84,71,79,86,84,81,85,80,59,42,38,86], ["Antoine Semenyo","SĞK",82,77,84,84,81,75,86,85,66,48,40,86], ["Jarrod Bowen","SĞK",75,66,85,82,80,76,84,80,82,40,49,83], ["Kingsley Coman","SĞK",87,68,72,87,81,76,73,77,61,25,29,80], ["Yan Diomande","SĞK",93,73,78,87,79,70,81,76,64,42,50,81],
        ["Florian Wirtz","MOO",77,52,85,88,87,85,81,77,43,48,64,84], ["Kevin De Bruyne","MOO",59,67,61,84,89,88,78,88,59,65,65,84], ["Paulo Dybala","MOO",77,62,72,86,84,83,81,85,68,41,32,81], ["Kenan Yıldız","MOO",85,71,81,85,84,75,80,82,72,59,54,80], ["Eberechi Eze","MOO",74,67,76,87,84,80,80,81,56,58,55,80],
        ["João Neves","MO",72,73,92,87,90,81,72,77,90,87,84,85], ["Nicolò Barella","MO",77,56,92,86,86,84,76,80,62,84,82,84], ["Bruno Guimarães","MO",59,73,90,84,88,85,73,78,76,82,78,75], ["Enzo Fernández","MO",68,67,88,83,88,86,78,78,71,76,72,78], ["Martin Ødegaard","MO",65,55,77,87,90,87,76,81,55,65,68,77],
        ["Hakan Çalhanoğlu","MDO",68,56,78,82,88,84,75,88,65,81,84,73], ["Sandro Tonali","MDO",79,82,89,80,86,81,69,82,70,82,81,74], ["Granit Xhaka","MDO",45,76,84,74,88,84,67,87,72,78,80,72], ["Martín Zubimendi","MDO",65,67,85,80,86,81,69,76,74,79,81,72], ["N'Golo Kanté","MDO",74,71,90,80,79,73,64,69,57,87,84,72],
        ["Theo Hernández","SLB",89,82,85,82,81,74,75,82,76,79,73,80], ["Alphonso Davies","SLB",93,75,77,84,84,77,64,70,74,74,72,77], ["Piero Hincapié","SLB",83,77,81,72,78,74,41,54,79,86,83,64], ["David Raum","SLB",83,77,85,81,79,83,59,65,64,78,77,75], ["Riccardo Calafiori","SLB",71,76,80,77,81,74,64,74,80,81,80,73],
        ["Konrad Laimer","SĞB",86,69,84,77,83,78,69,72,68,79,86,73], ["Marcos Llorente","SĞB",91,78,93,82,82,79,80,82,69,81,78,82], ["Reece James","SĞB",76,87,68,78,83,84,67,79,77,84,83,72], ["Giovanni Di Lorenzo","SĞB",83,75,89,72,79,73,72,72,74,81,79,69], ["Jeremie Frimpong","SĞB",94,47,82,82,78,72,65,58,54,73,73,75],
        ["Marquinhos","STP",74,79,73,73,84,78,59,57,88,88,90,70], ["Rúben Dias","STP",58,87,69,69,80,70,33,60,85,88,87,40], ["Gleison Bremer","STP",85,89,73,68,67,61,43,64,86,87,87,58], ["Marc Guéhi","STP",69,83,76,72,80,71,44,48,82,85,86,55], ["Éder Militão","STP",79,79,84,72,78,73,48,62,86,85,86,64],
        ["Mike Maignan","KL",89,83,84,81,86], ["Alisson Becker","KL",86,85,86,82,85], ["Joan García","KL",88,85,84,80,83], ["Diogo Costa","KL",84,85,84,86,84], ["Jordan Pickford","KL",87,84,82,89,84]
    ];

    const outKeys = ["pac", "str", "sta", "dri", "pas", "lon", "fin", "sho", "hea", "tac", "mar", "posi", "pen", "fk", "cor", "vis", "bal"];
    const outNames = ["Hız", "Güç", "Dayanıklılık", "Dripling", "Kısa Pas", "Uzun Pas", "Bitiricilik", "Şut Gücü", "Kafa Vuruşu", "Top Kapma", "Markaj", "Pozisyon", "Penaltı Kullanma", "Duran Top (Frikik)", "Korner Kullanma", "Vizyon", "Denge"];
    const gkKeys = ["gk_ref", "gk_div", "gk_pos", "gk_kic", "gk_1v1"];
    const gkNames = ["Refleks", "Uçma", "Yer Tutma", "Pas/Dağıtım", "Birebir"];

    // Her özelliğin ne işe yaradığını anlatan kısa açıklamalar - oyuncu düzenleme ekranında ve
    // veritabanı tablosunda başlıkların yanındaki "ⓘ" simgesine gelince (mouse hover) gösterilir.
    const statDescriptions = {
        pac: "Sprint hızı ve topla koşarken ulaşılan hız. Kanat oyuncuları ve santraforlarda kritik.",
        str: "Fiziksel mücadelelerde, ikili top kapışmalarında ve topu koruma anında güç.",
        sta: "Maç boyunca performansı koruyabilme, uzun süre yüksek tempoda oynayabilme.",
        dri: "Topu ayakta tutma, rakibi çalımlama ve dar alanda kontrol becerisi.",
        pas: "Kısa ve orta mesafe paslarda isabet, oyunu inşa etme kalitesi.",
        lon: "Uzun paslar, alan değiştiren toplar ve orta (cross) isabetliliği.",
        fin: "Kaleci karşısında soğukkanlılık, pozisyonu gole çevirme becerisi.",
        sho: "Şutlardaki güç - özellikle uzaktan şutlarda ve sert vuruşlarda etkili.",
        hea: "Kafa vuruşlarında hem hücumda gol arama hem savunmada uzaklaştırma becerisi.",
        tac: "Top kapma, müdahale ve topu rakipten temiz şekilde alma başarısı.",
        mar: "Rakip oyuncuyu takip etme, boşluk kapatma ve savunmada pozisyon alma.",
        posi: "Sahada doğru anda doğru yerde olma - hem hücumda boşluğa girme hem savunmada kapanma.",
        agg: "Faul yapma eğilimi. Yüksek olduğunda sarı/kırmızı kart görme ihtimali artar.",
        pen: "Penaltı atışlarında soğukkanlılık ve isabet - penaltı anında gol olasılığını doğrudan etkiler.",
        fk: "Duran top (frikik) atışlarında doğrudan kale arama başarısı.",
        cor: "Korner atışlarında kaliteli, tehlikeli ortalar yapma becerisi - kornerden gol şansını etkiler.",
        vis: "Oyunu okuma, doğru anda arkadaşını görüp öldürücü pas verme yeteneği - asist üretimini doğrudan etkiler.",
        bal: "Baskı altında ayakta kalma, denge kaybetmeden topu koruma ve müdahalelere direnme.",
        lead: "Takım kaptanının liderlik gücü - kötü bir karar (kırmızı kart, kaçan penaltı vb.) sonrası takımın moral kaybını ne kadar hafiflettiğini belirler. Yüksek liderlikli bir kaptan, momentum düşüşünü belirgin şekilde azaltır.",
        gk_ref: "Yakın mesafeden gelen sert şutlarda refleks kurtarış becerisi.",
        gk_div: "Uçarak yapılan kurtarışlarda menzil ve başarı oranı.",
        gk_pos: "Kale çizgisinde ve kutu içinde doğru pozisyon alma.",
        gk_kic: "Ayakla/elle uzun top dağıtımı ve top çıkarma kalitesi.",
        gk_1v1: "Kaleci ile karşı karşıya kalan rakibe karşı (ve penaltılarda) başarı oranı."
    };
    function statTooltip(key) {
        const desc = statDescriptions[key] || '';
        return desc ? ` <span class="stat-info-icon" title="${desc.replace(/"/g, '&quot;')}">ⓘ</span>` : '';
    }
    
    const posNamesList = ["KL", "SLB", "STP", "STP", "SĞB", "MDO", "MO", "MOO", "SLK", "SĞK", "SF"];

    // Pozisyona göre varsayılan "faul eğilimi" (agresiflik) - oyuncu veritabanından düzenlenebilir
    const defaultAggByPos = { KL: 12, STP: 62, SLB: 52, SĞB: 52, MDO: 66, MO: 44, MOO: 34, SLK: 28, SĞK: 28, SF: 36 };
    function getFoulTendency(player) {
        if (!player) return 40;
        if (player.agg !== undefined && player.agg !== null) return player.agg;
        return defaultAggByPos[player.pos] !== undefined ? defaultAggByPos[player.pos] : 40;
    }

    // Liderlik: takım kaptanının, kötü bir karar sonrası oluşan momentum düşüşünü ne kadar
    // hafiflettiğini belirleyen özel bir özellik (agg gibi genel OVR hesabının dışında tutulur -
    // çünkü tek işlevi kaptanlık/momentum mekaniğidir, saha performansını doğrudan değiştirmez).
    function getLeadership(player) {
        if (!player) return 50;
        if (player.lead !== undefined && player.lead !== null) return player.lead;
        return 50;
    }

    // Eski kayıtlarda / içe aktarılan dosyalarda olmayan yeni özellikleri (penaltı, frikik, korner,
    // vizyon, denge, liderlik) ilgili diğer özelliklerden türeterek gerçekçi bir başlangıç değeri
    // üretir. Örn. bir oyuncunun Penaltı Kullanma'sı yoksa, Bitiricilik ve Şut Gücü'nden hesaplanır.
    function migratePlayerAdvancedStats(p) {
        const clamp = v => Math.max(1, Math.min(99, Math.round(v)));
        const jitter = () => (Math.random() * 10 - 5);
        if (p.pos === 'KL') {
            if (p.pen === undefined) p.pen = clamp((p.gk_kic || 50) * 0.4 + 30 + jitter());
            if (p.fk === undefined) p.fk = clamp((p.gk_kic || 50) * 0.6 + 15 + jitter());
            if (p.cor === undefined) p.cor = clamp((p.gk_kic || 50) * 0.5 + 20 + jitter());
            if (p.vis === undefined) p.vis = clamp((p.gk_pos || 50) * 0.5 + 20 + jitter());
            if (p.bal === undefined) p.bal = clamp((p.gk_div || 50) * 0.4 + 30 + jitter());
            if (p.lead === undefined) p.lead = clamp((p.gk_pos || 50) * 0.4 + 30 + jitter() * 2);
        } else {
            if (p.pen === undefined) p.pen = clamp((p.fin || 50) * 0.55 + (p.sho || 50) * 0.35 + jitter());
            if (p.fk === undefined) p.fk = clamp((p.sho || 50) * 0.45 + (p.pas || 50) * 0.3 + (p.lon || 50) * 0.15 + jitter());
            if (p.cor === undefined) p.cor = clamp((p.lon || 50) * 0.45 + (p.pas || 50) * 0.3 + (p.posi || 50) * 0.15 + jitter());
            if (p.vis === undefined) p.vis = clamp((p.pas || 50) * 0.5 + (p.posi || 50) * 0.3 + (p.dri || 50) * 0.1 + jitter());
            if (p.bal === undefined) p.bal = clamp((p.dri || 50) * 0.4 + (p.str || 50) * 0.3 + (p.sta || 50) * 0.2 + jitter());
            // Liderlik doğrudan bir futbol becerisi değil, karakter özelliği - bu yüzden diğerlerinden
            // daha az bağıntılı ve daha rastgele üretilir (güç/pozisyon algısı hafif bir taban oluşturur).
            if (p.lead === undefined) p.lead = clamp(35 + (p.str || 50) * 0.15 + (p.posi || 50) * 0.15 + jitter() * 3);
        }
    }
    
    // Her mevkinin "birincil" (en önemli) özellikleri - eskiden SADECE bunlar overall'a katkı
    // sağlıyordu, listede olmayan özellikler (örn. bir stoperin dripling'i) hesaba hiç girmiyordu.
    // Set-parça / yaratıcılık özellikleri (pen, fk, cor, vis, bal) artık pozisyona göre overall'a
    // gerçek katkı sağlıyor: örn. bir santraforda "Penaltı Kullanma" birincil özellik, bir 10
    // numarada "Vizyon" birincil özellik, bir kanat oyuncusunda "Korner Kullanma" birincil özellik.
    const primaryWeights = {
        "STP": { str:0.13, tac:0.30, mar:0.27, hea:0.18, bal:0.12 },
        "SLB": { pac:0.20, sta:0.17, tac:0.20, mar:0.13, pas:0.13, cor:0.09, bal:0.08 },
        "SĞB": { pac:0.20, sta:0.17, tac:0.20, mar:0.13, pas:0.13, cor:0.09, bal:0.08 },
        "MDO": { sta:0.17, str:0.13, tac:0.22, mar:0.17, pas:0.17, bal:0.14 },
        "MO":  { pas:0.24, lon:0.15, sta:0.15, dri:0.10, posi:0.10, vis:0.18, fk:0.08 },
        "MOO": { pas:0.18, dri:0.18, posi:0.15, sho:0.10, fin:0.10, vis:0.19, fk:0.10 },
        "SLK": { pac:0.22, dri:0.20, pas:0.11, fin:0.10, posi:0.10, cor:0.17, vis:0.10 },
        "SĞK": { pac:0.22, dri:0.20, pas:0.11, fin:0.10, posi:0.10, cor:0.17, vis:0.10 },
        "SF":  { fin:0.26, sho:0.15, posi:0.15, pac:0.11, hea:0.08, pen:0.20, bal:0.05 }
    };
    // Tüm oyuncu özelliklerinin, hangi mevkide olursa olsun overall gücüne EN AZINDAN küçük bir
    // katkısı olmasını sağlamak için: her özelliğe sabit bir "taban" ağırlık verilir, pozisyona özel
    // "birincil" özellikler ise geri kalanı paylaşır. Böylece bir stoperin dripling'ini ya da bir
    // kanat oyuncusunun kafa vuruşunu değiştirmek artık hiçbir zaman "sıfır etki" yaratmaz, sadece
    // birincil özellikler kadar baskın olmaz. Özellik sayısı arttıkça (17 oldu) taban payı da
    // orantılı büyütüldü ki her özellik hâlâ fark yaratabilsin.
    const PRIMARY_SHARE = 0.72;
    const BASE_SHARE = 1 - PRIMARY_SHARE;
    const posWeights = { "KL": { gk_ref:0.3, gk_div:0.25, gk_pos:0.25, gk_1v1:0.15, gk_kic:0.05 } };
    Object.keys(primaryWeights).forEach(pos => {
        const baseEach = BASE_SHARE / outKeys.length;
        const w = {};
        outKeys.forEach(k => { w[k] = baseEach; });
        Object.keys(primaryWeights[pos]).forEach(k => { w[k] += primaryWeights[pos][k] * PRIMARY_SHARE; });
        posWeights[pos] = w;
    });


    let playerDatabase = [];
    let savedTeams = [];
    let settings = { pWeight: 70, mWeight: 10, hWeight: 8, sWeight: 7, lWeight: 5 };

    function initApp() {
        if (!localStorage.getItem('fm_players_v16')) {
            playerDatabase = rawPlayerData.map((p, i) => {
                let obj = { id: i, name: p[0], pos: p[1] };
                if (p[1] === 'KL') {
                    obj.gk_ref = p[2]; obj.gk_div = p[3]; obj.gk_pos = p[4]; obj.gk_kic = p[5]; obj.gk_1v1 = p[6];
                } else {
                    // Not: outKeys artık pen/fk/cor/vis/bal'ı da içeriyor ama ham veri dizisinde
                    // (rawPlayerData) bunlar için sütun yok - bu 5 özellik migratePlayerAdvancedStats
                    // ile aşağıda diğer ilişkili özelliklerden otomatik türetiliyor.
                    outKeys.forEach((k, idx) => { if (p[idx+2] !== undefined) obj[k] = p[idx+2]; });
                }
                obj.agg = defaultAggByPos[p[1]] !== undefined ? defaultAggByPos[p[1]] : 40;
                migratePlayerAdvancedStats(obj);
                return obj;
            });
            localStorage.setItem('fm_players_v16', JSON.stringify(playerDatabase));
        } else {
            playerDatabase = JSON.parse(localStorage.getItem('fm_players_v16'));
            let migrated = false;
            playerDatabase.forEach(p => {
                if (p.agg === undefined || p.agg === null) {
                    p.agg = defaultAggByPos[p.pos] !== undefined ? defaultAggByPos[p.pos] : 40;
                    migrated = true;
                }
                if (p.pen === undefined || p.fk === undefined || p.cor === undefined || p.vis === undefined || p.bal === undefined || p.lead === undefined) {
                    migratePlayerAdvancedStats(p);
                    migrated = true;
                }
            });
            if (migrated) localStorage.setItem('fm_players_v16', JSON.stringify(playerDatabase));
        }
        if (localStorage.getItem('fm_teams_v16')) savedTeams = JSON.parse(localStorage.getItem('fm_teams_v16'));
        // GÖÇ: Daha önce (bu düzeltmeden önce) kurulmuş takımlarda, iki stoper gibi aynı mevkiden
        // birden fazla slot varsa ikisinin de VARSAYILAN olarak aynı oyuncuya düştüğü bir hata
        // vardı. Kayıtlı takımlarda bu tekrarı burada tek seferlik otomatik onarıyoruz.
        let teamsRepaired = false;
        savedTeams.forEach(team => {
            if (!team.squad || new Set(team.squad).size === team.squad.length) return;
            const usedIds = new Set();
            team.squad.forEach((id, idx) => {
                if (usedIds.has(id)) {
                    const pos = posNamesList[idx];
                    const alt = playerDatabase.find(p => p.pos === pos && !usedIds.has(p.id) && !team.squad.includes(p.id));
                    if (alt) { team.squad[idx] = alt.id; usedIds.add(alt.id); teamsRepaired = true; }
                } else {
                    usedIds.add(id);
                }
            });
        });
        if (teamsRepaired) localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
        if (localStorage.getItem('fm_settings_v16')) settings = JSON.parse(localStorage.getItem('fm_settings_v16'));
        soundEnabled = localStorage.getItem('fm_sound_v16') !== '0';
        updateSoundButton();

        renderSavedTeams();
        renderPlayerTable();
        showScreen('squad-screen');
    }

    /* OVR (06.10.2026 revizyonu): ağırlıklar 134 gerçek oyuncunun EA SPORTS FC 27 OVR'sine en küçük kareler + eski ağırlıklara
       doğru düzenlileştirme ile yeniden uyduruldu (her özelliğin pozitif katkısı korunur, mevki başına sabit terim). Formülün
       açıklayamadığı küçük fark (FC'nin alt özelliklerinden gelen) gerçek oyuncuda 'oa' (genelde ±1) olarak eklenir; böylece
       varsayılan değerlerde OVR = FC 27 OVR, özellik değiştikçe OVR yine formülle hareket eder. */
    const OVR_FIT = {"SF": {"w": {"pac": 0.07781, "str": 0.03803, "sta": 0.10967, "dri": 0.08094, "pas": 0.0243, "lon": 0.00824, "fin": 0.27437, "sho": 0.10244, "hea": 0.04329, "tac": 0.01787, "mar": 0.01277, "posi": 0.14787, "pen": 0.00824, "fk": 0.00824, "cor": 0.00824, "vis": 0.1078, "bal": 0.00824}, "b": -2.555}, "SLK": {"w": {"pac": 0.10822, "str": 0.00824, "sta": 0.00824, "dri": 0.25314, "pas": 0.25067, "lon": 0.12387, "fin": 0.00824, "sho": 0.00824, "hea": 0.00824, "tac": 0.00824, "mar": 0.00824, "posi": 0.15393, "pen": 0.00824, "fk": 0.00824, "cor": 0.09642, "vis": 0.02003, "bal": 0.00824}, "b": -4.278}, "MOO": {"w": {"pac": 0.05309, "str": 0.00824, "sta": 0.04742, "dri": 0.41435, "pas": 0.15213, "lon": 0.00824, "fin": 0.00824, "sho": 0.00824, "hea": 0.02824, "tac": 0.00824, "mar": 0.00824, "posi": 0.15251, "pen": 0.00824, "fk": 0.00824, "cor": 0.04615, "vis": 0.15465, "bal": 0.05185}, "b": -11.173}, "S\u011eK": {"w": {"pac": 0.10415, "str": 0.00824, "sta": 0.05652, "dri": 0.32182, "pas": 0.11415, "lon": 0.11829, "fin": 0.00824, "sho": 0.00824, "hea": 0.00824, "tac": 0.0265, "mar": 0.00824, "posi": 0.13266, "pen": 0.00824, "fk": 0.00824, "cor": 0.02387, "vis": 0.12642, "bal": 0.00824}, "b": -4.195}, "MO": {"w": {"pac": 0.00824, "str": 0.00824, "sta": 0.12677, "dri": 0.10094, "pas": 0.19468, "lon": 0.11238, "fin": 0.03444, "sho": 0.01929, "hea": 0.02344, "tac": 0.05599, "mar": 0.01143, "posi": 0.10154, "pen": 0.01382, "fk": 0.03288, "cor": 0.00824, "vis": 0.15642, "bal": 0.00824}, "b": 1.879}, "MDO": {"w": {"pac": 0.01842, "str": 0.09533, "sta": 0.13732, "dri": 0.02057, "pas": 0.14318, "lon": 0.02035, "fin": 0.02692, "sho": 0.01977, "hea": 0.01896, "tac": 0.17137, "mar": 0.13336, "posi": 0.02395, "pen": 0.01118, "fk": 0.01032, "cor": 0.02009, "vis": 0.0193, "bal": 0.10825}, "b": 5.069}, "SLB": {"w": {"pac": 0.08187, "str": 0.00824, "sta": 0.09125, "dri": 0.3273, "pas": 0.30631, "lon": 0.00824, "fin": 0.00824, "sho": 0.00824, "hea": 0.00824, "tac": 0.01148, "mar": 0.38021, "posi": 0.00824, "pen": 0.00915, "fk": 0.00824, "cor": 0.02686, "vis": 0.00824, "bal": 0.00824}, "b": -20.974}, "STP": {"w": {"pac": 0.04634, "str": 0.19256, "sta": 0.02253, "dri": 0.00824, "pas": 0.0315, "lon": 0.00824, "fin": 0.00824, "sho": 0.00824, "hea": 0.03171, "tac": 0.09785, "mar": 0.6, "posi": 0.00824, "pen": 0.00824, "fk": 0.00824, "cor": 0.00824, "vis": 0.00824, "bal": 0.00824}, "b": -6.243}, "S\u011eB": {"w": {"pac": 0.09401, "str": 0.03926, "sta": 0.11044, "dri": 0.02844, "pas": 0.16452, "lon": 0.05669, "fin": 0.00824, "sho": 0.00824, "hea": 0.03729, "tac": 0.25062, "mar": 0.17058, "posi": 0.00824, "pen": 0.00824, "fk": 0.00824, "cor": 0.0463, "vis": 0.02064, "bal": 0.0695}, "b": -6.2}, "KL": {"w": {"gk_ref": 0.309, "gk_div": 0.28126, "gk_pos": 0.27579, "gk_1v1": 0.1746, "gk_kic": 0.05476}, "b": -7.316}};
    function getOverall(player) {
        if(!player) return 50;
        const f = OVR_FIT[player.pos];
        if(!f) return 50;
        let ovr = f.b;
        for (let key in f.w) ovr += (player[key] || 0) * f.w[key];
        let oa = 0;
        try { const R = window.ADO_REAL && player.name != null ? window.ADO_REAL.lookup(player.name) : null; if (R && R.oa) oa = R.oa; } catch (e) { }
        return Math.max(1, Math.min(99, Math.round(ovr) + oa));
    }

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('#nav-buttons .btn').forEach(b => b.classList.toggle('nav-active', b.dataset.screen === id));
        document.body.classList.toggle('match-mode', id === 'match-screen');
        if(id === 'quick-match-screen') populateMatchDropdowns();
        if(id === 'tournament-screen') generateTourneySlots();
        if(id === 'settings-screen') loadSettingsIntoSliders();
    }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }

    // ESC tuşu her zaman o an açık olan pencereyi (oyuncu düzenleme, turnuva kadrosu, fikstür
    // önizlemesi vb.) kapatır - "kapatma işaretini göremiyorum" durumunda bile klavyeden çıkış yolu
    // olsun diye.
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            if (getComputedStyle(overlay).display !== 'none') overlay.style.display = 'none';
        });
    });

    function showAlert(elementId, message) {
        let alertBox = document.getElementById(elementId);
        alertBox.innerText = message;
        alertBox.style.display = 'block';
        setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
    }

    const presetTeamColors = [
        '#e60023', '#ff6b00', '#ffc93c', '#2ecc71', '#00a3ff',
        '#0047ab', '#6c3ce9', '#ff2d95', '#ffffff', '#111111',
        '#8b5a2b', '#00d4c8'
    ];

    // ------- TAKIM LOGOSU / ARMA ŞABLONLARI -------
    const crestTemplates = {
        shield:  'polygon(50% 0%, 100% 15%, 100% 55%, 50% 100%, 0% 55%, 0% 15%)',
        circle:  'circle(50% at 50% 50%)',
        hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        pentagon:'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        star:    'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        banner:  'polygon(0% 0%, 100% 0%, 100% 68%, 50% 100%, 0% 68%)',
        roundsq: 'inset(0% round 22%)'
    };
    const crestOrder = ['shield', 'circle', 'hexagon', 'pentagon', 'diamond', 'star', 'banner', 'roundsq'];

    function getTeamInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.trim().slice(0, 2).toUpperCase();
    }

    /* [ui] arma yazısı kontrastı: bağıl parlaklık (sRGB doğrusallaştırılmış) .42'yi aşan zeminde koyu yazı + açık gölge; değilse varsayılan (beyaz) */
    function crestInk(hex) {
        var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim()); if (!m) return '';
        var h = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1], n = parseInt(h, 16), f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
        var L = .2126 * f((n >> 16) & 255) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255);
        return L > .179 ? 'color:#06101f;text-shadow:0 1px 2px rgba(255,255,255,.45);' : '';
    }
    // Her yerde takım arması göstermek için ortak yardımcı fonksiyon
    function renderTeamCrestHTML(team, sizePx, heroGlow) {
        if (!team) return '';
        const size = sizePx || 34;
        const shape = (team.logo && crestTemplates[team.logo]) ? team.logo : 'shield';
        const clip = crestTemplates[shape];
        const fontSize = Math.round(size * 0.38);
        const color = team.color || '#888';
        // "heroGlow": maç ekranındaki skorbord logoları için, takımın kendi renginde parlayan bir
        // ışıltı ve hafif giriş animasyonu ekler - daha görkemli/vitrin niteliğinde görünsün diye.
        const glowStyle = heroGlow ? `box-shadow: 0 4px 18px rgba(0,0,0,0.6), 0 0 24px ${color}99; animation: crestHeroIn 0.5s ease;` : '';
        const ink = crestInk(color);                                         // [ui] açık renkte (beyaz/sarı) koyu kısaltma
        return `<div class="team-crest ${heroGlow ? 'team-crest-hero' : ''}" style="width:${size}px; height:${size}px; min-width:${size}px; background:${color}; clip-path:${clip}; -webkit-clip-path:${clip}; ${glowStyle}">
            <span style="font-size:${fontSize}px;${ink}">${getTeamInitials(team.name)}</span>
        </div>`;
    }
    // ------- /TAKIM LOGOSU -------

    function renderColorSwatches() {
        const grid = document.getElementById('tb-color-swatches');
        grid.innerHTML = presetTeamColors.map(c =>
            `<div class="kit-swatch" style="background:${c};" onclick="selectTeamColor('${c}')" title="${c}"></div>`
        ).join('');
    }

    function selectTeamColor(hex) {
        document.getElementById('tb-color').value = hex;
        document.getElementById('tb-kit-jersey').style.background = hex;
        document.getElementById('tb-kit-hex').innerText = hex.toUpperCase();
        document.querySelectorAll('#tb-color-swatches .kit-swatch').forEach(sw => {
            sw.classList.toggle('selected', sw.style.backgroundColor && rgbToHex(sw.style.backgroundColor) === hex.toLowerCase());
        });
        updateLogoPreview();
    }

    function rgbToHex(rgb) {
        const m = rgb.match(/\d+/g);
        if (!m) return rgb;
        return '#' + m.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join('');
    }

    function renderLogoSwatches() {
        const grid = document.getElementById('tb-logo-swatches');
        if (!grid) return;
        grid.innerHTML = crestOrder.map(shape =>
            `<div class="logo-swatch" style="clip-path:${crestTemplates[shape]}; -webkit-clip-path:${crestTemplates[shape]};" onclick="selectTeamLogo('${shape}')" title="${shape}"></div>`
        ).join('');
    }

    function selectTeamLogo(shape) {
        const logoInput = document.getElementById('tb-logo');
        if (!logoInput) return;
        logoInput.value = shape;
        document.querySelectorAll('#tb-logo-swatches .logo-swatch').forEach((sw, i) => {
            sw.classList.toggle('selected', crestOrder[i] === shape);
        });
        updateLogoPreview();
    }

    function updateLogoPreview() {
        const preview = document.getElementById('tb-logo-preview');
        if (!preview) return;
        const name = document.getElementById('tb-name') ? document.getElementById('tb-name').value : '';
        const color = document.getElementById('tb-color') ? document.getElementById('tb-color').value : '#00ffcc';
        const logo = document.getElementById('tb-logo') ? document.getElementById('tb-logo').value : 'shield';
        preview.innerHTML = renderTeamCrestHTML({ name, color, logo }, 56);
    }

    function openNewTeamForm() {
        document.getElementById('team-builder').style.display = 'block';
        populatePitchSlots();
        renderColorSwatches();
        renderLogoSwatches();
        selectTeamColor('#00ffcc');
        selectTeamLogo('shield');
    }
    function cancelTeamForm() { document.getElementById('team-builder').style.display = 'none'; }

    function populatePitchSlots() {
        // Aynı mevkiden birden fazla slot varsa (örn. iki stoper), her biri VARSAYILAN olarak
        // farklı bir oyuncuyu seçili göstermeli. Eskiden ikisi de aynı listenin ilk oyuncusuna
        // (tarayıcının <select> için otomatik seçtiği ilk seçenek) düşüp AYNI oyuncuyu iki
        // pozisyonda birden gösteriyordu - kullanıcı elle değiştirmediği sürece kadroda gerçek bir
        // oyuncu tekrarı oluşuyordu.
        const usedIds = new Set();
        posNamesList.forEach((pos, idx) => {
            let selectElem = document.getElementById(`slot-${idx}`);
            let matchingPlayers = playerDatabase.filter(p => p.pos === pos);
            selectElem.innerHTML = matchingPlayers.map(p => `<option value="${p.id}">${p.name} (${getOverall(p)})</option>`).join('');
            const defaultPlayer = matchingPlayers.find(p => !usedIds.has(p.id)) || matchingPlayers[0];
            if (defaultPlayer) {
                selectElem.value = defaultPlayer.id;
                usedIds.add(defaultPlayer.id);
            }
            selectElem.onchange = refreshTeamRoleDropdowns;
        });
        refreshTeamRoleDropdowns();
    }

    // Kaptan / Penaltı / Frikik / Korner kullanıcısı dropdown'larını, o an sahadaki 11 oyuncuyla
    // günceller - sadece kadrodaki oyuncular seçilebilsin diye. Her dropdown'da isim yanında O
    // GÖREVLE İLGİLİ özellik değeri gösterilir (örn. kaptan listesinde Liderlik, penaltı listesinde
    // Penaltı Kullanma gücü) - böylece hangi oyuncunun o iş için daha uygun olduğu tek bakışta
    // görülür. Mümkünse önceki seçim korunur.
    function refreshTeamRoleDropdowns() {
        const squadIds = [];
        for (let i = 0; i < 11; i++) {
            const el = document.getElementById(`slot-${i}`);
            const val = el && el.value ? parseInt(el.value) : NaN;
            if (!isNaN(val)) squadIds.push(val);
        }
        const roleConfigs = [
            { selId: 'tb-captain', label: 'Liderlik', getValue: p => getLeadership(p) },
            { selId: 'tb-pen-taker', label: 'Penaltı', getValue: p => p.pen },
            { selId: 'tb-fk-taker', label: 'Frikik', getValue: p => p.fk },
            { selId: 'tb-cor-taker', label: 'Korner', getValue: p => p.cor }
        ];
        roleConfigs.forEach(cfg => {
            const el = document.getElementById(cfg.selId);
            if (!el) return;
            const prev = el.value;
            // Her dropdown, o özelliğe göre en iyiden en kötüye SIRALANIR - en uygun oyuncu en üstte
            // çıkar, uzun bir kadroda elle arama yapmaya gerek kalmaz.
            const players = squadIds.map(getPlayerFromId).filter(Boolean);
            players.sort((a, b) => (cfg.getValue(b) || 0) - (cfg.getValue(a) || 0));
            el.innerHTML = players.map(p => {
                const val = cfg.getValue(p);
                return `<option value="${p.id}">${p.name} (${p.pos}) — ${cfg.label}: ${val !== undefined && val !== null ? val : '-'}</option>`;
            }).join('');
            if (squadIds.includes(parseInt(prev))) el.value = prev;
        });
    }

    function randomizeSquad() {
        const usedIds = new Set();
        posNamesList.forEach((pos, idx) => {
            let selectElem = document.getElementById(`slot-${idx}`);
            let matchingPlayers = playerDatabase.filter(p => p.pos === pos && !usedIds.has(p.id));
            if (!matchingPlayers.length) matchingPlayers = playerDatabase.filter(p => p.pos === pos); // havuz tükendiyse tekrara izin ver
            if(matchingPlayers.length > 0) {
                let randomPlayer = matchingPlayers[Math.floor(Math.random() * matchingPlayers.length)];
                selectElem.value = randomPlayer.id;
                usedIds.add(randomPlayer.id);
            }
        });
        refreshTeamRoleDropdowns();
    }

    function saveTeam() {
        let name = document.getElementById('tb-name').value.trim();
        if(!name) { showAlert('team-form-alert', 'Hata: Lütfen geçerli bir takım adı giriniz.'); return; }
        let color = document.getElementById('tb-color').value || "#00ffcc";
        let logo = (document.getElementById('tb-logo') && document.getElementById('tb-logo').value) || 'shield';
        let manager = parseInt(document.getElementById('tb-manager').value) || 75;
        let stadium = parseInt(document.getElementById('tb-stadium').value) || 75;
        let squad = [];
        for(let i=0; i<11; i++) {
            let val = parseInt(document.getElementById(`slot-${i}`).value);
            if(isNaN(val)) { showAlert('team-form-alert', 'Hata: Kadrodaki tüm pozisyonlar eksiksiz doldurulmalıdır!'); return; }
            squad.push(val);
        }
        if (new Set(squad).size !== squad.length) {
            showAlert('team-form-alert', 'Hata: Aynı futbolcu birden fazla pozisyonda seçilemez! Lütfen tekrar eden oyuncuyu değiştirin.');
            return;
        }
        let captainId = parseInt(document.getElementById('tb-captain').value) || null;
        let penaltyTakerId = parseInt(document.getElementById('tb-pen-taker').value) || null;
        let freeKickTakerId = parseInt(document.getElementById('tb-fk-taker').value) || null;
        let cornerTakerId = parseInt(document.getElementById('tb-cor-taker').value) || null;
        savedTeams.push({ name, color, logo, manager, stadium, squad, captainId, penaltyTakerId, freeKickTakerId, cornerTakerId });
        localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
        cancelTeamForm();
        renderSavedTeams();
    }

    function renderSavedTeams() {
        const list = document.getElementById('saved-teams-list');
        if(savedTeams.length === 0) { list.innerHTML = "<p style='color:var(--text-muted);'>Henüz kayıtlı takım yok.</p>"; return; }
        list.innerHTML = savedTeams.map((t, i) => `
            <div class="form-group flex-between" style="background:rgba(0,0,0,0.3); padding:14px 18px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    ${renderTeamCrestHTML(t, 38)}
                    <div><strong style="color:var(--primary); font-size:1.2rem; font-family:'Rajdhani';">${t.name}</strong> <span style="font-size:0.85rem; color:var(--text-muted);">(TD Güç: ${t.manager} | Std Güç: ${t.stadium})</span></div>
                </div>
                <button class="btn btn-danger" onclick="deleteTeam(${i})" style="padding:6px 16px; font-size:0.9rem;">Sil</button>
            </div>
        `).join('');
    }
    function deleteTeam(idx) {
        const team = savedTeams[idx];
        const name = team ? team.name : 'Bu takım';
        if (!confirm(`"${name}" takımını silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
        savedTeams.splice(idx, 1);
        // Savunmacı düzeltme: localStorage yazımı herhangi bir sebeple (kota, gizli sekme
        // kısıtlaması vb.) başarısız olursa eskiden fonksiyon burada sessizce çöküyor ve
        // renderSavedTeams() hiç çalışmıyordu - takım veriden silinmiş olsa bile ekranda hâlâ
        // duruyormuş gibi görünüyor, kullanıcı "silme çalışmıyor" sanıyordu. Artık ekran her
        // durumda güncelleniyor.
        try {
            localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
        } catch (e) {
            console.error('Takım silinirken kayıt hatası:', e);
        }
        renderSavedTeams();
    }

    let matchInterval = null;
    let eventOverlayActive = false;
    let matchSessionId = 0;
    let matchSpeedMultiplier = 1;
    const BASE_MATCH_DURATION_MS = 120000; // 1x hızda 90 dakikalık maç ~2 dakika sürer
    /* [len] MAÇ SÜRESİ AYARI (1x hızda bir maçın gerçek izleme süresi): 0 = Standart (motorun kendi temposu), 3 / 5 / 7 dk.
       Simülasyonun kendisi (oyuncu hareketleri, olay sayısı, istatistikler) DEĞİŞMEZ; yalnız oynatma temposu ayarlanır:
       - klasik (metin) motor: maç saati 1x'te tam bu sürede akar (½x/2x/4x bunun katlarıdır);
       - canlı 2B/3B motor: tempo eğrisi (tehlikede yavaşla, ölü topta hızlan) korunur, ortalama hız kalan süreye göre kapalı
         döngüyle ayarlanır (gol sevinci, tekrar, VAR, devre arası bu süreye sayılmaz). */
    const MATCH_LEN_KEY = 'ado_match_len_v1';
    function matchLenMin() { try { const v = +localStorage.getItem(MATCH_LEN_KEY); return v === 3 || v === 5 || v === 7 ? v : 0; } catch (e) { return 0; } }
    function syncMatchLenUI() {
        const v = String(matchLenMin());
        document.querySelectorAll('.mlen-seg button').forEach(b => { const on = b.getAttribute('data-v') === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        try { if (window.ado2d && ado2d.lenSync) ado2d.lenSync(); } catch (e) { }
    }
    function setMatchLen(v) { v = +v; try { localStorage.setItem(MATCH_LEN_KEY, String(v === 3 || v === 5 || v === 7 ? v : 0)); } catch (e) { } syncMatchLenUI(); }
    document.addEventListener('DOMContentLoaded', syncMatchLenUI);
    let matchData = { currentTimeMs: 0, totalDurationMs: BASE_MATCH_DURATION_MS, h:null, a:null, hStats:null, aStats:null, highlights:[], lastSimulatedMinute: -1, isTournamentMatch: false, currentHalf: 1, neutralVenue: false };

    function populateMatchDropdowns() {
        let options = savedTeams.map((t, i) => `<option value="${i}">${t.name}</option>`).join('');
        if(!options) options = "<option value=''>Önce Takım Oluşturun!</option>";
        document.getElementById('qm-home').innerHTML = options;
        document.getElementById('qm-away').innerHTML = options;
        // Varsayılan olarak farklı iki takım seçili gelsin (mümkünse) - kullanıcı ekranı ilk
        // açtığında iki kutunun da aynı takımı göstermesi kafa karıştırıcı olurdu.
        if (savedTeams.length >= 2) {
            document.getElementById('qm-home').value = 0;
            document.getElementById('qm-away').value = 1;
        }
    }

    function prepareMatch() {
        let hIdx = document.getElementById('qm-home').value;
        let aIdx = document.getElementById('qm-away').value;
        if(hIdx === "" || aIdx === "") { showAlert('qm-form-alert', 'Hata: Lütfen ev sahibi ve deplasman takımlarını seçin.'); return; }
        if(hIdx === aIdx) { showAlert('qm-form-alert', 'Hata: Aynı takım birbiriyle maç yapamaz! Lütfen farklı takımlar seçin.'); return; }
        
        matchData.h = savedTeams[hIdx];
        matchData.a = savedTeams[aIdx];
        matchData.isTournamentMatch = false;
        matchData.neutralVenue = document.getElementById('qm-neutral-venue').checked;
        
        setupMatchView();
    }

    function setupMatchView() {
        document.getElementById('name-home-text').innerText = matchData.h.name;
        document.getElementById('crest-home').innerHTML = renderTeamCrestHTML(matchData.h, 56, true);
        document.getElementById('name-away-text').innerText = matchData.a.name;
        document.getElementById('crest-away').innerHTML = renderTeamCrestHTML(matchData.a, 56, true);
        
        document.getElementById('stat-home-title').innerText = matchData.h.name;
        document.getElementById('stat-away-title').innerText = matchData.a.name;

        document.getElementById('lineup-home-title').innerHTML = renderTeamCrestHTML(matchData.h, 30) + `<span>${matchData.h.name} (İlk 11)</span>`;
        document.getElementById('lineup-away-title').innerHTML = renderTeamCrestHTML(matchData.a, 30) + `<span>${matchData.a.name} (İlk 11)</span>`;

        document.getElementById('neutral-venue-badge').style.display = matchData.neutralVenue ? 'inline-block' : 'none';

        resetMatchStats();
        renderLineups();
        showScreen('match-screen');
    }

    function initMatchRatings() {
        matchData.ratings = {};
        if (!matchData.h || !matchData.a) return;
        matchData.h.squad.forEach(id => matchData.ratings[id] = 6.5);
        matchData.a.squad.forEach(id => matchData.ratings[id] = 6.5);
    }

    function adjustRating(playerId, delta) {
        if (!matchData.ratings) return;
        if (matchData.ratings[playerId] === undefined) matchData.ratings[playerId] = 6.5;
        matchData.ratings[playerId] = Math.max(3.0, Math.min(10.0, matchData.ratings[playerId] + delta));
        renderLineups();
    }

    // Oyuncu bazlı maç içi istatistiği bir artırır (gol, asist, şut, isabetli şut, kurtarış, kart).
    function bumpPlayerStat(playerId, key, amount) {
        // ÖNEMLİ HATA DÜZELTMESİ: "if (!playerId)" kontrolü, id'si 0 olan oyuncuyu (veritabanındaki
        // ilk oyuncu, Mbappé) JavaScript'te "0 falsy'dir" kuralı yüzünden HER ZAMAN atlıyordu - o
        // oyuncunun golü/kartı asla işlenmiyordu. Artık sadece null/undefined kontrolü yapılıyor.
        if (playerId === undefined || playerId === null || !matchData.playerMatchStats) return;
        if (!matchData.playerMatchStats[playerId]) matchData.playerMatchStats[playerId] = { goals: 0, assists: 0, shots: 0, sot: 0, saves: 0, yellow: 0, red: 0 };
        matchData.playerMatchStats[playerId][key] += (amount === undefined ? 1 : amount);
    }

    function ratingClass(r) {
        if (r >= 7.5) return 'rating-great';
        if (r >= 6.5) return 'rating-good';
        if (r >= 5.5) return 'rating-avg';
        return 'rating-bad';
    }

    // Kadro listesinde oyuncunun yanında gösterilecek küçük ibareler: gol (⚽, 2+ golde "⚽2×" gibi
    // tek toptan sonra çarpan yazar - iki top yan yana göstermez), sarı kart, kırmızı kart.
    function renderPlayerEventBadges(id) {
        const stats = (matchData.playerMatchStats && matchData.playerMatchStats[id]) || {};
        let badges = '';
        if (stats.goals > 0) {
            badges += `<span class="lineup-badge" title="${stats.goals} gol">⚽${stats.goals > 1 ? `<sup class="lineup-badge-mult">${stats.goals}×</sup>` : ''}</span>`;
        }
        if (stats.yellow > 0) {
            badges += `<span class="lineup-badge" title="Sarı Kart">🟨</span>`;
        }
        if (stats.red > 0) {
            badges += `<span class="lineup-badge" title="Kırmızı Kart">🟥</span>`;
        }
        return badges;
    }

    function renderLineups() {
        let homeListHtml = '';
        matchData.h.squad.forEach(id => {
            let p = getPlayerFromId(id);
            if(p) {
                let rating = (matchData.ratings && matchData.ratings[id] !== undefined) ? matchData.ratings[id] : 6.5;
                let off = isSentOff(id);
                homeListHtml += `<div class="lineup-player-row" onclick="showPlayerMatchStats(${id})" style="cursor:pointer; ${off ? 'opacity:0.5;' : ''}">
                    <div><span class="pos-badge ${p.pos}">${p.pos}</span> <span style="${off ? 'text-decoration:line-through;' : ''}">${p.name}</span> ${renderPlayerEventBadges(id)}</div>
                    <span class="lineup-rating ${ratingClass(rating)}">${rating.toFixed(1)}</span>
                </div>`;
            }
        });
        document.getElementById('home-lineup-list').innerHTML = homeListHtml;

        let awayListHtml = '';
        matchData.a.squad.forEach(id => {
            let p = getPlayerFromId(id);
            if(p) {
                let rating = (matchData.ratings && matchData.ratings[id] !== undefined) ? matchData.ratings[id] : 6.5;
                let off = isSentOff(id);
                awayListHtml += `<div class="lineup-player-row" onclick="showPlayerMatchStats(${id})" style="cursor:pointer; ${off ? 'opacity:0.5;' : ''}">
                    <div><span class="pos-badge ${p.pos}">${p.pos}</span> <span style="${off ? 'text-decoration:line-through;' : ''}">${p.name}</span> ${renderPlayerEventBadges(id)}</div>
                    <span class="lineup-rating ${ratingClass(rating)}">${rating.toFixed(1)}</span>
                </div>`;
            }
        });
        document.getElementById('away-lineup-list').innerHTML = awayListHtml;
    }

    // Kadro listesinde bir oyuncuya tıklandığında, o maçtaki istatistiklerini (gol, asist, şut,
    // isabetli şut, kurtarış, kartlar) ve canlı reytingini gösteren küçük bir popup açar.
    function showPlayerMatchStats(id) {
        const p = getPlayerFromId(id);
        if (!p) return;
        const team = matchData.h.squad.includes(id) ? matchData.h : matchData.a;
        const stats = (matchData.playerMatchStats && matchData.playerMatchStats[id]) || { goals: 0, assists: 0, shots: 0, sot: 0, saves: 0, yellow: 0, red: 0 };
        const rating = (matchData.ratings && matchData.ratings[id] !== undefined) ? matchData.ratings[id] : 6.5;
        const off = isSentOff(id);
        const isCaptain = team.captainId === id;

        document.getElementById('pms-player-crest').innerHTML = renderTeamCrestHTML(team, 30);
        document.getElementById('pms-player-name').innerText = p.name + (isCaptain ? ' (C)' : '');
        document.getElementById('pms-player-meta').innerText = `${p.pos} • ${team.name}${off ? ' • 🟥 Oyun Dışı' : ''}`;
        document.getElementById('pms-rating-value').innerText = rating.toFixed(1);
        document.getElementById('pms-rating-value').className = 'pms-rating-big ' + ratingClass(rating);

        const rows = [
            ['⚽ Gol', stats.goals],
            ['🅰️ Asist', stats.assists],
            ['🎯 Toplam Şut', stats.shots],
            ['🎯 İsabetli Şut', stats.sot],
            ['🧤 Kurtarış', stats.saves],
            ['🟨 Sarı Kart', stats.yellow],
            ['🟥 Kırmızı Kart', stats.red]
        ].filter(r => p.pos !== 'KL' ? r[0] !== '🧤 Kurtarış' || stats.saves > 0 : true);

        document.getElementById('pms-stats-grid').innerHTML = rows.map(([label, val]) => `
            <div class="pms-stat-box">
                <div class="pms-stat-val">${val}</div>
                <div class="pms-stat-label">${label}</div>
            </div>
        `).join('');

        document.getElementById('player-match-stats-modal').style.display = 'flex';
    }

    function exitMatchToOrigin() {
        const matchInProgress = matchData.currentTimeMs > 0 && !matchData.isFinished;
        if (matchInProgress && !confirm('Maç henüz bitmedi. Şimdi ayrılırsan bu maçın sonucu kaydedilmeyecek. Emin misin?')) return;
        stopMatchInterval();
        matchSessionId++;
        eventOverlayActive = false;
        hideActionOverlay();
        hideInjuryBoard();
        document.getElementById('gol-overlay').classList.remove('active');
        document.getElementById('halftime-overlay').classList.remove('active');
        if(matchData.isTournamentMatch) {
            showScreen('tournament-screen');
        } else {
            showScreen('quick-match-screen');
        }
    }


    function getPlayerFromId(id) { return playerDatabase.find(p => p.id === id); }
    function calcTeamPower(teamObj, isHome, redCardCount, neutralVenue) {
        let playersPwr = teamObj.squad.reduce((sum, id) => sum + getOverall(getPlayerFromId(id)), 0) / 11;
        let fatiguePenalty = (teamObj.matchCount || 0) * 0.8; 
        // ÖNEMLİ: kırmızı kart sayısı artık dışarıdan parametre olarak geliyor (global matchData'dan
        // OKUNMUYOR). Eskiden burada doğrudan matchData.redCardCountH/A okunuyordu; bu da "Hızlı
        // Simülasyon" gibi matchData'ya hiç dokunmayan bağlamlarda, ÖNCEKİ canlı maçtan kalan kırmızı
        // kart sayısının, o maçla hiç ilgisi olmayan başka bir turnuva maçına sızmasına yol açıyordu.
        let redCardPenalty = (redCardCount || 0) * 9;
        // İç saha avantajı artık SADECE oyuncu gücüne uygulanır - TD ve stadyumun kattığı avantajın
        // üzerine bir kez daha eklenmiyor. Eskiden "basePwr * hWeight%" şeklindeydi; bu da TD+Stadyum+
        // Ev Sahibi üçlüsünün birbirini büyütüp oyuncu kalitesini gölgede bırakabilmesine yol açıyordu
        // (örn. sıradan bir oyuncu kadrosuna sahip ama elit TD+stadyumlu bir ev sahibi, çok daha güçlü
        // oyunculara sahip bir deplasman takımını güç hesabında geçebiliyordu). Artık sadece oyuncu
        // gücü bileşeni ev sahibi olmaktan bonus alıyor, TD/stadyum katkısı sabit kalıyor.
        // Tarafsız saha seçiliyse (neutralVenue) bu bonus tamamen sıfırlanır.
        let playersContrib = playersPwr * (settings.pWeight/100);
        let managerContrib = teamObj.manager * (settings.mWeight/100);
        let stadiumContrib = teamObj.stadium * (settings.sWeight/100);
        let homeBonus = (isHome && !neutralVenue) ? playersContrib * (settings.hWeight/100) : 0;
        let finalPwr = playersContrib + managerContrib + stadiumContrib + homeBonus - fatiguePenalty - redCardPenalty;
        return Math.max(25, finalPwr);
    }

    function recalcPowers() {
        if (!matchData.hStats || !matchData.aStats) return;
        matchData.hStats.power = calcTeamPower(matchData.h, true, matchData.redCardCountH, matchData.neutralVenue);
        matchData.aStats.power = calcTeamPower(matchData.a, false, matchData.redCardCountA, matchData.neutralVenue);
    }

    // Takımın kaptanını döner: açıkça bir kaptan atanmışsa ve hâlâ sahadaysa onu kullanır, aksi
    // halde (atanmamışsa veya kırmızı kart görmüşse) sahadaki en yüksek Liderlik değerine sahip
    // oyuncuyu otomatik kaptan sayar.
    function getTeamCaptain(team) {
        if (!team) return null;
        if (team.captainId && !isSentOff(team.captainId)) {
            const explicit = getPlayerFromId(team.captainId);
            if (explicit) return explicit;
        }
        const candidates = team.squad.filter(id => !isSentOff(id)).map(getPlayerFromId).filter(Boolean);
        if (!candidates.length) return null;
        candidates.sort((a, b) => getLeadership(b) - getLeadership(a));
        return candidates[0];
    }

    // Büyük bir karar/anın (gol, kırmızı kart, penaltı sonucu vb.) ardından ilgili takıma 5-10
    // dakika sürecek geçici bir moral etkisi uygular. amount pozitifse güç artışı, negatifse düşüş.
    // LİDERLİK: kötü bir an sonrası (negatif momentum) takımın kaptanı ne kadar liderse düşüş o
    // kadar hafif olur - "liderliği yüksek oyuncu, momentumu en az düşen futbolcu" kuralı burada.
    // İyi bir an sonrası (pozitif momentum) liderlik etkisiz kalır; liderlik yalnızca KRİZ anında
    // (kırmızı kart, kaçan penaltı, iptal edilen gol vb.) devreye girer.
    function applyMomentumShift(team, amount) {
        if (!team || !matchData.momentum) return;
        let finalAmount = amount;
        if (amount < 0) {
            const captain = getTeamCaptain(team);
            const leadScore = captain ? getLeadership(captain) : 50;
            // Liderlik 99'a yakınken düşüşü ~%55 azaltır, liderlik 20 ve altındayken hiç azaltmaz.
            const dampening = Math.max(0, Math.min(0.55, (leadScore - 20) / 145));
            finalAmount = amount * (1 - dampening);
        }
        const duration = Math.floor(Math.random() * 6) + 5; // 5-10 dakika
        const isHome = team === matchData.h;
        if (isHome) {
            matchData.momentum.h = finalAmount;
            matchData.momentum.hExpire = matchData.globalMinuteCounter + duration;
        } else {
            matchData.momentum.a = finalAmount;
            matchData.momentum.aExpire = matchData.globalMinuteCounter + duration;
        }
    }

    function checkMomentumExpiry() {
        if (!matchData.momentum) return;
        if (matchData.globalMinuteCounter > matchData.momentum.hExpire) matchData.momentum.h = 0;
        if (matchData.globalMinuteCounter > matchData.momentum.aExpire) matchData.momentum.a = 0;
    }

    // Kalıcı gücün üzerine geçici moral etkisini ekleyerek o anki EFEKTİF gücü döner - sadece
    // topa sahip olma paylaşımı ve şut kalitesi hesaplarında kullanılır, hStats.power'ı KALICI
    // olarak değiştirmez.
    function getEffectiveTeamPower(isHome) {
        checkMomentumExpiry();
        const base = isHome ? matchData.hStats.power : matchData.aStats.power;
        const momentum = matchData.momentum ? (isHome ? matchData.momentum.h : matchData.momentum.a) : 0;
        return base + momentum;
    }

    function setMatchSpeed(speed) {
        matchSpeedMultiplier = speed;
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active-speed'));
        document.getElementById(`speed-${speed}x`).classList.add('active-speed');
    }

    function resetMatchStats() {
        stopMatchInterval();
        matchSessionId++;
        matchData.currentTimeMs = 0;
        matchData.totalDurationMs = BASE_MATCH_DURATION_MS;
        matchData.lastSimulatedMinute = -1;
        matchData.highlights = [];
        matchData.injuryDecided = false;
        matchData.injuryMinutes = 0;
        matchData.isFinished = false;
        matchData.currentHalf = 1;
        matchData.globalMinuteCounter = 0;
        // Kararlar sonrası geçici moral/momentum etkisi: büyük bir anın (gol, kırmızı kart, penaltı
        // sonucu vb.) ardından 5-10 dakika süren küçük bir güç artışı/azalışı. Kalıcı güç hesabını
        // (calcTeamPower) DEĞİŞTİRMEZ, sadece o dakikalardaki topa sahip olma/şut kalitesi hesabına
        // geçici olarak eklenir.
        matchData.momentum = { h: 0, hExpire: 0, a: 0, aExpire: 0 };
        
        document.getElementById('live-ticker-text').innerText = "Maç hakemin ilk düdüğü ile başlamak üzere...";
        document.getElementById('fm-events-list').innerHTML = '<div class="fm-event-empty">Maç henüz başlamadı...</div>';
        
        matchData.sentOff = new Set();
        matchData.yellowCounts = {};
        matchData.redCardCountH = 0;
        matchData.redCardCountA = 0;
        // Oyuncu bazlı maç içi istatistikler - kadro listesinde bir oyuncuya tıklandığında
        // gösterilir (gol, asist, şut, isabetli şut, kurtarış, kart).
        matchData.playerMatchStats = {};
        [matchData.h, matchData.a].forEach(team => {
            team.squad.forEach(id => {
                matchData.playerMatchStats[id] = { goals: 0, assists: 0, shots: 0, sot: 0, saves: 0, yellow: 0, red: 0 };
            });
        });
        matchData.hStats = { goals:0, xg:0, shots:0, sot:0, pass:0, pos:50, corners:0, offsides:0, fouls:0, power:calcTeamPower(matchData.h, true, 0, matchData.neutralVenue), gk:getPlayerFromId(matchData.h.squad[0]) };
        matchData.aStats = { goals:0, xg:0, shots:0, sot:0, pass:0, pos:50, corners:0, offsides:0, fouls:0, power:calcTeamPower(matchData.a, false, 0, matchData.neutralVenue), gk:getPlayerFromId(matchData.a.squad[0]) };
        initMatchRatings();
        updateStatUI();
        document.getElementById('score-home').innerText = "0";
        document.getElementById('score-away').innerText = "0";
        document.getElementById('match-time').innerText = "00:00";
        document.getElementById('btn-start-match').style.display = 'inline-block';
        document.getElementById('btn-pause-match').style.display = 'none';
        document.getElementById('btn-start-match').innerText = "Maçı Başlat";
        eventOverlayActive = false;
        hideActionOverlay();
        hideInjuryBoard();
        document.getElementById('halftime-overlay').classList.remove('active');
    }


    function startMatch() {
        let isKickoff = matchData.currentTimeMs === 0;
        if(matchData.isFinished) { resetMatchStats(); isKickoff = true; }
        if (isKickoff) playWhistle();
        document.getElementById('btn-start-match').style.display = 'none';
        document.getElementById('btn-pause-match').style.display = 'inline-block';
        startMatchInterval();
    }

    let lastTickTime = null;
    function startMatchInterval() {
        lastTickTime = performance.now();
        matchInterval = setInterval(updateMatchLoop, 30);
        startCrowdAmbience();
    }

    function pauseMatch() {
        stopMatchInterval();
        document.getElementById('btn-start-match').style.display = 'inline-block';
        document.getElementById('btn-pause-match').style.display = 'none';
        document.getElementById('btn-start-match').innerText = "Devam Et";
    }

    function stopMatchInterval() {
        if(matchInterval !== null) { clearInterval(matchInterval); matchInterval = null; }
        lastTickTime = null;
        stopCrowdAmbience();
    }

    const MS_PER_GAME_MINUTE = BASE_MATCH_DURATION_MS / 90;
    const HALF_LENGTH_MINUTES = 45;

    function updateMatchLoop() {
        let now = performance.now();
        let delta = now - lastTickTime;
        lastTickTime = now;

        if (eventOverlayActive) return; // tehlikeli atak / VAR incelemesi / ilave süre tabelası sırasında maç saati donar

        matchData.currentTimeMs += delta * matchSpeedMultiplier * (matchLenMin() ? 2 / matchLenMin() : 1);      // [len] 1x'te maç seçilen sürede biter

        // rawMinute HER ZAMAN o anki devrenin kendi içindeki dakikasıdır (0-45 + ilave süre).
        // İkinci yarı başlarken currentTimeMs sıfırlanır, bu yüzden rawMinute de sıfırdan başlar.
        let rawMinute = Math.floor(matchData.currentTimeMs / MS_PER_GAME_MINUTE);

        // Devrenin 45. dakikasına ulaşılınca hakem tabelası çıkar, 1-9 dakika arası ilave süre belirlenir
        if (!matchData.injuryDecided && rawMinute >= HALF_LENGTH_MINUTES) {
            matchData.injuryDecided = true;
            matchData.injuryMinutes = Math.floor(Math.random() * 9) + 1;
            eventOverlayActive = true;
            showInjuryTimeBoard(matchData.injuryMinutes, matchSessionId, matchData.currentHalf);
            // ÖNEMLİ HATA DÜZELTMESİ: burada return edilmeden devam edilirse, bu tick'in geri kalanı
            // (aşağıdaki simulateMinuteAction çağrısı dahil) yine de çalışıyordu. Böylece hakem
            // tabelası animasyonu İLE aynı anda başka bir tehlikeli atak/VAR sahnesi eş zamanlı
            // başlayabiliyor, ikisi de kendi zamanlamasının sonunda eventOverlayActive'i bağımsız
            // olarak false yapmaya çalışıyor, biri diğerinin ortasında bunu erken sıfırlıyor ve maç
            // saati tutarsız bir durumda tamamen donup kalabiliyordu (örn. "45+5"de takılı kalma).
            return;
        }

        const finalMinuteInHalf = HALF_LENGTH_MINUTES + (matchData.injuryMinutes || 0);
        let rawMinuteCapped = Math.min(finalMinuteInHalf, rawMinute);
        let displayOffset = matchData.currentHalf === 2 ? HALF_LENGTH_MINUTES : 0;
        let displayMinute = displayOffset + rawMinuteCapped;

        // Devre bitti mi? (1. devre -> devre arası, 2. devre -> maç sonu)
        if (matchData.injuryDecided && rawMinute >= finalMinuteInHalf) {
            if (matchData.currentHalf === 1) {
                triggerHalfTime(finalMinuteInHalf);
            } else {
                triggerFullTime(displayOffset + finalMinuteInHalf);
            }
            return;
        }

        let secondsIntoMinute = Math.floor((matchData.currentTimeMs % MS_PER_GAME_MINUTE) / MS_PER_GAME_MINUTE * 60);
        let secStr = String(secondsIntoMinute).padStart(2, '0');
        let inInjury = rawMinuteCapped > HALF_LENGTH_MINUTES;
        let injuryN = inInjury ? rawMinuteCapped - HALF_LENGTH_MINUTES : 0;
        let halfBoundaryLabel = matchData.currentHalf === 2 ? 90 : 45;
        let minLabel = inInjury ? `${halfBoundaryLabel}+${injuryN}` : String(displayMinute).padStart(2, '0');
        document.getElementById('match-time').innerText = `${minLabel}:${secStr}`;

        // lastSimulatedMinute HER DEVRENİN KENDİ İÇİNDE artan bir sayaçtır (rawMinuteCapped bazlı) -
        // devre değişince sıfırlanır, böylece 1. devrenin ilave süre dakikaları (örn. 46,47) ile
        // 2. devrenin gerçek dakikaları çakışıp birbirini "zaten simüle edildi" sanıp atlamaz.
        if (rawMinuteCapped > matchData.lastSimulatedMinute) {
            matchData.lastSimulatedMinute = rawMinuteCapped;
            simulateMinuteAction(displayMinute);
        }
    }

    function triggerHalfTime(finalMinuteInHalf) {
        stopMatchInterval();
        document.getElementById('match-time').innerText = matchData.injuryMinutes ? `45+${matchData.injuryMinutes}:00` : '45:00';
        addTicker(`Hakem ilk yarıyı sonlandırdı${matchData.injuryMinutes ? ` (45+${matchData.injuryMinutes})` : ''}. Takımlar soyunma odasına gidiyor.`);
        if (sndPlay('WhistleLong', .65, 0, 1, 0)) sndPlay('Applause', .4, .5, 1, 0); else playWhistle();      // [ses] devre: uzun düdük + alkış
        document.getElementById('btn-start-match').style.display = 'none';
        document.getElementById('btn-pause-match').style.display = 'none';
        document.getElementById('halftime-score-text').innerText = `${matchData.h.name} ${matchData.hStats.goals} - ${matchData.aStats.goals} ${matchData.a.name}`;
        document.getElementById('halftime-overlay').classList.add('active');
    }

    function startSecondHalf() {
        document.getElementById('halftime-overlay').classList.remove('active');
        matchData.currentHalf = 2;
        matchData.currentTimeMs = 0;
        matchData.lastSimulatedMinute = -1;
        matchData.injuryDecided = false;
        matchData.injuryMinutes = 0;
        eventOverlayActive = false;
        addTicker('İkinci yarı başlıyor!');
        playWhistle();
        document.getElementById('btn-start-match').style.display = 'none';
        document.getElementById('btn-pause-match').style.display = 'inline-block';
        startMatchInterval();
    }

    function triggerFullTime(finalDisplayMinute) {
        matchData.isFinished = true;
        pauseMatch();
        document.getElementById('match-time').innerText = matchData.injuryMinutes ? `90+${matchData.injuryMinutes}:00` : '90:00';
        addTicker("Maç sona erdi. Hakem son düdüğü çalıyor.");
        if (sndPlay('Whistle2', .6, 0, 1, 0)) { sndPlay('Whistle2', .6, .55, 1, 0); sndPlay('WhistleLong', .65, 1.15, 1, 0); sndPlay('Applause', .55, 1.9, 1, 0); } else playWhistle();      // [ses] maç sonu: iki kısa + bir uzun düdük, alkış ([v140] aynı düdük, gerçek kayıt)

        if(matchData.isTournamentMatch && typeof window.onTournamentMatchEnd === 'function') {
            window.onTournamentMatchEnd(matchData.hStats.goals, matchData.aStats.goals);
        } else {
            showMatchSummary(null);
        }
    }

    function addTicker(text) {
        document.getElementById('live-ticker-text').innerText = text.replace(/<\/?[^>]+(>|$)/g, "");
    }

    const eventTypeIcons = { goal: '⚽', 'card-yellow': '🟨', 'card-red': '🟥', var: '🖥️', chance: '🧤', miss: '❌', penalty: '🎯', corner: '🚩', freekick: '🎯', offside: '🚩', buildup: '▶️', default: '📌' };

    // Bir olayın metnine bakarak (emoji/anahtar kelime) tipini tahmin eder - her çağrı noktasını
    // değiştirmek zorunda kalmadan makul bir ikon/renk seçilebilsin diye.
    function guessEventType(text) {
        if (text.includes('🟥')) return 'card-red';
        if (text.includes('🟨')) return 'card-yellow';
        if (text.includes('⚽')) return 'goal';
        if (text.includes('VAR') || text.includes('İptal')) return 'var';
        if (text.includes('Kurtar') || text.includes('🧤') || text.includes('Çıkardı')) return 'chance';
        if (text.includes('🚩') && text.toLowerCase().includes('korner')) return 'corner';
        if (text.includes('Frikik') || text.includes('🧱')) return 'freekick';
        if (text.includes('Ofsayt') || text.includes('🚩')) return 'offside';
        if (text.includes('Penaltı')) return 'penalty';
        if (text.includes('Dışarı') || text.includes('❌') || text.includes('Kaçırdı')) return 'miss';
        return 'default';
    }

    // "Kritik Anlar" paneli artık eski "Spiker Anlatım Arşivi" kutusunun yerinde - Football Manager
    // tarzı bir maç olayı akışı gibi: her satırda dakika, ikon, takım rengi ve kısa açıklama var.
    function renderHighlightsList() {
        const list = document.getElementById('fm-events-list');
        if (!list) return;
        if (!matchData.highlights.length) {
            list.innerHTML = '<div class="fm-event-empty">Henüz kritik bir an yaşanmadı...</div>';
            return;
        }
        list.innerHTML = matchData.highlights.map(h => {
            const icon = eventTypeIcons[h.type] || eventTypeIcons.default;
            return `<div class="fm-event-row type-${h.type}">
                <span class="fm-event-min">${h.min}'</span>
                <span class="fm-event-icon">${icon}</span>
                <span class="fm-event-text"><span class="fm-event-team-dot" style="background:${h.color};"></span><strong>${h.team}</strong> — ${h.detail}</span>
            </div>`;
        }).join('');
    }

    function addHighlight(teamObj, detailText, type, minOverride) {
        const min = (minOverride !== undefined && minOverride !== null) ? minOverride : matchData.lastSimulatedMinute;
        matchData.highlights.unshift({ min, team: teamObj.name, color: teamObj.color || '#fff', detail: detailText, type: type || guessEventType(detailText) });
        renderHighlightsList();
    }

    function isSentOff(id) { return matchData.sentOff && matchData.sentOff.has(id); }
    function getRandomFromRange(team, startIdx, count) {
        const rangeIds = [];
        for (let i = 0; i < count; i++) rangeIds.push(team.squad[startIdx + i]);
        let pool = rangeIds.filter(id => !isSentOff(id));
        if (!pool.length) pool = team.squad.filter((id, idx) => idx !== 0 && !isSentOff(id));
        if (!pool.length) pool = [team.squad[1]];
        return getPlayerFromId(pool[Math.floor(Math.random() * pool.length)]);
    }
    function getRandomAttacker(team) { return getRandomFromRange(team, 6, 5); }
    function getRandomMidfielder(team) { return getRandomFromRange(team, 5, 2); }
    function getRandomDefender(team) { return getRandomFromRange(team, 1, 4); }
    function pickFoulCommitter(team) {
        const onPitch = team.squad.filter((id, idx) => idx !== 0 && !isSentOff(id));
        if (!onPitch.length) return null;
        // Ağırlık artık ham faul eğilimi değil, onun küçük bir üssü (^0.6) - bu, yüksek eğilimli
        // birkaç oyuncunun bir maçta ART ARDA seçilip yapay şekilde ikinci sarı karta (dolayısıyla
        // gerçekçi olmayan yüksek kırmızı kart oranına) sürüklenmesini engelliyor, yine de agresif
        // oyuncular ortalamadan daha sık faul yapıyor. Ayrıca bir oyuncu zaten sarı kart görmüşse,
        // gerçek futbolda olduğu gibi maçın geri kalanında daha dikkatli oynar - ağırlığı belirgin
        // şekilde düşürülür (bu, canlı maç ile hızlı simülasyonda ORTAK matchData.yellowCounts
        // üzerinden işlediği için iki motorda da aynı şekilde uygulanır).
        const weighted = onPitch.map(id => {
            let w = Math.max(3, Math.pow(getFoulTendency(getPlayerFromId(id)), 0.6));
            if (matchData.yellowCounts && matchData.yellowCounts[id]) w *= 0.35;
            return { id, weight: w };
        });
        const total = weighted.reduce((s, w) => s + w.weight, 0);
        let r = Math.random() * total;
        for (const w of weighted) { r -= w.weight; if (r <= 0) return getPlayerFromId(w.id); }
        return getPlayerFromId(weighted[weighted.length - 1].id);
    }

    function sendOffPlayer(player, team, reasonText) {
        matchData.sentOff.add(player.id);
        if (team === matchData.h) matchData.redCardCountH = (matchData.redCardCountH || 0) + 1;
        else matchData.redCardCountA = (matchData.redCardCountA || 0) + 1;
        bumpPlayerStat(player.id, 'red');
        recalcPowers();
        addHighlight(team, `🟥 ${reasonText} - ${player.name}`);
        adjustRating(player.id, -1.5);
        addTicker(`<strong>${team.name}</strong> ${player.name} ile 10 kişi kalıyor! ${reasonText}.`);
        playCardSound();
        // Kırmızı kart hem kalıcı güç kaybına (calcTeamPower) hem de geçici bir moral çöküşüne yol
        // açar: kartlı takım birkaç dakika daha da düşük performans gösterir, rakip ise rahatlar.
        const opponent = team === matchData.h ? matchData.a : matchData.h;
        applyMomentumShift(team, -3);
        applyMomentumShift(opponent, 2.5);
    }

    // Sarı kart verir; aynı oyuncu ikinci sarısını görürse otomatik olarak kırmızı karta çevirir.
    // ÖNEMLİ: ikinci sarıdan gelen kırmızı kart artık HER ZAMAN ekranda dramatik bir animasyonla
    // gösterilir - eskiden sessizce gerçekleşiyordu, oyuncu bunu ancak kadro listesine bakınca
    // fark ediyordu. Async yapıldı ki maç saati bu kritik an boyunca donabilsin.
    async function giveYellowCard(player, team) {
        const sessionId = matchSessionId;
        matchData.yellowCounts[player.id] = (matchData.yellowCounts[player.id] || 0) + 1;
        if (matchData.yellowCounts[player.id] >= 2) {
            const wasOverlayAlreadyActive = eventOverlayActive;
            eventOverlayActive = true;
            showActionOverlay('🟨', 'İKİNCİ SARI KART!', `${player.name} (${team.name}) ikinci sarısını görüyor...`, 'outcome-neutral', team);
            playCardSound();
            await overlayWait(1700);
            if (sessionId !== matchSessionId) return;
            await playOutcomeReveal('🟥', 'KIRMIZI KART!', `${player.name} ikinci sarı karttan oyundan atılıyor! ${team.name} 10 kişi kalıyor.`, 'outcome-bad', 2000);
            if (sessionId !== matchSessionId) return;
            sendOffPlayer(player, team, 'İkinci Sarı Karttan Kırmızı Kart');
            if (!wasOverlayAlreadyActive) eventOverlayActive = false;
        } else {
            addTicker(getCommentary('yellowCard', { player: player.name, team: team.name }));
            addHighlight(team, `🟨 Sarı Kart - ${player.name}`);
            bumpPlayerStat(player.id, 'yellow');
            adjustRating(player.id, -0.4);
            playCardSound();
        }
    }
    function getAssistCandidate(team, excludeId) {
        const candidates = team.squad.filter(id => id !== excludeId && id !== team.squad[0] && !isSentOff(id));
        if (!candidates.length) return null;
        return getPlayerFromId(candidates[Math.floor(Math.random() * candidates.length)]);
    }

    function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    // Dramatik sahnelerin (tehlikeli atak / VAR) süresi maç hızından ETKİLENMEZ - her zaman aynı
    // heyecan verici uzunlukta kalır. Sadece maç saatinin akış hızı (dakikaların ilerlemesi)
    // 1x/2x/4x ayarına göre değişir; kritik anların görsel süresi sabittir.
    function overlayWait(ms) { return wait(ms); }

    // ------- SES EFEKTLERİ (Web Audio API ile sentezlenmiş sesler) -------
    let soundEnabled = true;
    let audioCtx = null;

    function ensureAudioCtx() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) { try { audioCtx = new AC(); } catch (e) { audioCtx = null; } }
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        localStorage.setItem('fm_sound_v16', soundEnabled ? '1' : '0');
        updateSoundButton();
        if (soundEnabled) {
            ensureAudioCtx();
            playTone(660, 0.12, 'sine', 0.15);
            if (matchInterval !== null) startCrowdAmbience();
            else { try { if (window.ado2d && ado2d.state && ado2d.state.running) startCrowdAmbience(); } catch (e) { } }      // [ses] 2B maç sürerken ses yeniden açıldı
        } else {
            stopCrowdAmbience();
        }
    }

    function updateSoundButton() {
        const btn = document.getElementById('btn-sound-toggle');
        if (btn) btn.innerText = soundEnabled ? '🔊' : '🔇';
    }

    function playTone(freq, duration, type, gainVal, startDelay) {
        if (!soundEnabled) return;
        const ctx = ensureAudioCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            const t0 = ctx.currentTime + (startDelay || 0);
            gain.gain.setValueAtTime(gainVal || 0.15, t0);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t0);
            osc.stop(t0 + duration + 0.05);
        } catch (e) {}
    }

    function playNoiseBurst(duration, gainVal, startDelay) {
        if (!soundEnabled) return;
        const ctx = ensureAudioCtx();
        if (!ctx) return;
        try {
            const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.value = gainVal || 0.2;
            src.connect(gain).connect(ctx.destination);
            src.start(ctx.currentTime + (startDelay || 0));
        } catch (e) {}
    }

    function playCrowdGasp() { if (sndPlay('CrowdOoh', .7, 0, 1, 1200)) return; playNoiseBurst(0.9, 0.16, 0); }

    function playGoalSound() {
        var gh = SND.goalTeam !== 1; SND.goalTeam = -1;                      // [ses] gol: file + tribün bağırışı (deplasman golünde misafir tribün, daha kısık) + coşku + tezahürat
        if (sndPlay('Net', .7, .05, 1, 0)) { sndPlay('CrowdRoar', gh ? 1 : .55, .12, 1, 0); sndBoost(gh ? .3 : .08, 9); if (gh) setTimeout(function () { sndChant(2); }, 6500); return; }
        // Bildirim çanı (maçkolik tarzı "gol geldi" bildirimi)
        playTone(1046.5, 0.11, 'sine', 0.22, 0);
        playTone(1318.5, 0.16, 'sine', 0.24, 0.1);
        // Tribün coşkusu ("yeaahh!")
        playNoiseBurst(1.4, 0.3, 0.22);
        playTone(523.25, 0.18, 'triangle', 0.22, 0.22);
        playTone(659.25, 0.18, 'triangle', 0.22, 0.4);
        playTone(783.99, 0.42, 'triangle', 0.27, 0.58);
    }

    function playDisappointment() {
        if (sndPlay('CrowdWhistle', .6, 0, 1, 1500)) { sndPlay('CrowdGroan', .5, .2, 1, 0); return; }      // [ses] [v140] yuhalama + hayal kırıklığı iç çekişi
        // Gol iptal edilince tribünden gelen "aaah!" hayal kırıklığı sesi
        playNoiseBurst(1.0, 0.16, 0);
        playTone(320, 0.5, 'sawtooth', 0.13, 0.05);
        playTone(220, 0.65, 'sawtooth', 0.13, 0.3);
    }

    function playSaveThud() { if (sndPlay('Applause', .4, .2, 1, 1800)) return; playTone(160, 0.22, 'sine', 0.18, 0); }

    function playCardSound() {
        if (sndPlay('CrowdWhistle', .5, .1, 1, 2500)) return;              // [ses]
        playTone(880, 0.12, 'square', 0.12, 0);
        playTone(660, 0.18, 'square', 0.12, 0.14);
    }

    function playWhistle() {
        if (sndWhistle('Whistle', .6, 0)) return;                           // [ses]
        playTone(2200, 0.22, 'square', 0.1, 0);
        playTone(2200, 0.22, 'square', 0.1, 0.3);
    }

    // Tribün uğultusu: maç akarken çalan sürekli/loop ortam sesi
    let crowdAmbienceNode = null;
    function startCrowdAmbience() {
        if (!soundEnabled) return;
        if (sndBedStart()) return;                                           // [ses] gerçek tribün uğultusu (stereo, tehlikeyle kabaran)
        const ctx = ensureAudioCtx();
        if (!ctx || crowdAmbienceNode) return;
        try {
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 380;
            filter.Q.value = 0.5;
            const gain = ctx.createGain();
            gain.gain.value = 0.03;
            src.connect(filter).connect(gain).connect(ctx.destination);
            src.start();
            crowdAmbienceNode = { src, gain };
        } catch (e) { crowdAmbienceNode = null; }
    }
    function stopCrowdAmbience() {
        sndBedStop(false);                                                   // [ses]
        if (crowdAmbienceNode) {
            try { crowdAmbienceNode.src.stop(); } catch (e) {}
            crowdAmbienceNode = null;
        }
    }
    /* [ses] FIFA TARZI STADYUM SESİ - [v140] gerçek ses örnekleri: Freesound'daki CC0 (kamu malı) lisanslı stadyum kayıtları
       (San Siro uğultusu, Şili tribününden davullu tezahürat, gol bağırışı, "ooo", iç çekiş, alkış, yuhalama; gerçek top vuruşu,
       file, direk, hakem düdüğü). Kaynaklar ve lisanslar: src/adoball/SESLER.md. 22,05 kHz mono MP3; ilk sesli etkileşimde
       decodeAudioData ile AudioBuffer'a çözülür. Vuruş, gol bağırışı, "ooo", düdük ve tezahüratın birden çok çeşidi rastgele çalar.
       Tribün: aynı döngünün kaydırılmış iki kopyasından stereo uğultu; şiddeti oyunun tehlikesine göre (atak ceza sahasına yaklaştıkça kabarır,
       ev sahibi atağında daha gür), son dakika gerginliği, gol sonrası coşku; ara ara tezahürat. Hızlı akışta yalnız uğultu ve büyük tepkiler.
       Örnekler çözülemezse eski sentez sesleri çalar. */
