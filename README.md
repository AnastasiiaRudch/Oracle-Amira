TODO:
1. The text in cards is not full
2. Add x button in search to remove fast everything that was in the search block.
3. Add login and DB - to save layout(rozklad)
4. Add above every card question(So it will be comfortable in layout to understand question-card)
5. Add ability to save every layout with name, read, edit, delete, share(read access only)
6. Додати готові розклади - на негатив, на чакри і т.д.



When cards and their text worked correctly:
After this build https://github.com/AnastasiiaRudch/Oracle-Amira/actions/runs/38147274644 
(Як виправлено: кожна картка тепер визначається за своїм заголовком у PDF, а текст обрізається на маркері "Ответ: да/нет" — жодних перетікань між картками. Всі 158 карток містять "Ответ:" в кінці опису.)


Dobavit voprosu
Razbivat ih po blokam - 3 stroki , v kazhdoi po 5 kart, ili 1 stroka 3 kartu, 2 stroka 2 kartu, I t.d.
I chtobu mozhno bulo ih peretaskivat, menyat kolichestvo blokov I kart(strok I stolbcov v nih)


Zrobutu taky programy, v yaky bylo b zrychno zasovyvatu pdf knuzhku kolodu bud-yakoi, I shob vin avtomatuchno robuv taky programy dlya kart



Super, teper nas chekae dodavannya she odnogo krytogo funkcionaly - Add above every card or a few cards question(So it will be comfortable in layout to understand question-card). V rozkladah kozhna karta vidpovidae na yakes zaputannya abo dekilka kart vidpovidayut na zaputannya. Napruklad 1 Glubunna pruchuna - karta, 2 Hto zrobuv karta, i t.d. Abo tak - magichnui negatuv - 5 kart, pobytovui negatuv - 5 kart, rodovui negatuv - 3 karty. Tak nam treba ce yakos realizyvatu. Dumayu, bylo b zruchno yaksho b putannya bylo b nad kartoyu abo nad kilkoma kartamu. 


Treba she potim zrobutu tak shob na main branch ishov build, a v dev branch ya robula zminu, pereviryala I tilku potim ih dodavala na main branch, I takozh shob kolu ya pracyvala na dev - sait na main pracyvav bez zmin v stable version.


takzhe ya bu hotela chtobu bula vozmozhost bloki peremeshat mezhdy soboi mestami - drag and drop tozhe kak kartu. 

Drag and Drop mezhdy kartami rabotaet necorrectno - kogda ttyanesh s pervoi levoi kartu na pravuyu vtoruyu - nichego ne proishodit, ne menyaetsya. kogda ttyanesh s pervoi levoi kartu na pravuyu tretyu - to pervaia stanovitsya na mesto vtoroi a ne tretiei. A vot sprava nalevo kogda tyanesh - vse rabotaet horosho. 

V Zberezhenuh dodatu knopky Novui Rozklad

Perevesti vse na ukrainsky I kartinki tozhe - ili sdelat 2 versii tem y kogo koloda na rus, I tem y kogo koloda na ukrainskom

Dobavit vozmozhnost Share Rozklad(chtobu tot mog tolko read)


Super, vse otlichno, spasibo) Teper smotri, hochu eshe odno dobavlenie -
To chto y nas uzhe est Mitka - ya bu nazvala eto blokom. Poskolky, vidish, tam y nas mozhet but po neskolko kart(foto 1), a vot teper smotri, naprimer y menya est takoi rasklad na chakru - tam mne ydobno podpisat kazhduyu karty kak 1 chakra (foto 2), no eto ne ydobno chto mne nado derzhat v kazhdom bloke po odnoi karte i potom listat, ya bu dobavila takoi funkcional kak Podpis(ili vot eto kak raz bu ya nazvala Mitka naprimer ili sam pridymai kak), chto nezavisimo ot blokov, nad kazhdoi(nad 1 kartoi 1 podpis) kartoi ya mogy dobavit podpis, ponyal da kak ya hochu?

Vnuzy tam de mu dodaemo novui block - knopka mae nazvy ＋ Нова мітка , davai pereimenyemo v + Novui Block, shob bylo zrozymilishe. I v ✨ Мій розклад I v 🔮 Збережені розклади 

