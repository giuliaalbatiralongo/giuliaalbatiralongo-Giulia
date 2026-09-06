-- Com'erano gli esami e le date PRIMA di caricare il manifesto UniGe
-- (6 settembre 2026). Serve solo se qualcosa va storto: rimette i nomi
-- come li aveva scritti Giulia. Le date non si toccano: nessuna riga di
-- date_esame viene cancellata dal caricamento.
update esami set nome='Farmacologia 2',                             anno=4,    semestre=1    where id=4;
update esami set nome='Gastroenterologia',                          anno=4,    semestre=1    where id=10;
update esami set nome='Malattie infettive e microbiologia clinica', anno=4,    semestre=1    where id=11;
update esami set nome='Anatomia patologica 2',                      anno=4,    semestre=1    where id=17;
update esami set nome='Organi di senso',                            anno=4,    semestre=1    where id=18;
update esami set nome='Cardiopneumo',                               anno=3,    semestre=2    where id=20;
update esami set nome='Anatopato 1',                                anno=3,    semestre=2    where id=21;
update esami set nome='Semeiotica',                                 anno=3,    semestre=1    where id=22;
update esami set nome='Endonefro',                                  anno=3,    semestre=2    where id=23;
update esami set nome='Farmacologia 1',                             anno=3,    semestre=2    where id=24;
update esami set nome='DIR',                                        anno=3,    semestre=2    where id=25;
update esami set nome='Fisiopatologia',                             anno=3,    semestre=1    where id=26;
update esami set nome='Anatomia patologica',                        anno=null, semestre=null where id=29;
update esami set cfu=null where id in (4,10,11,17,18,20,21,22,23,24,25,26,29);
-- e via le voci nuove, riconoscibili dalla nota
delete from esami where note like '%[manifesto UniGe 2026/2027]%';
