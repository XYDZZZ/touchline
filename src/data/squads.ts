/** Predefined popular squad players for common clubs and national teams in eFootball/FC.
 *  Used as quick-selection chips when recording goal scorers.
 *  Users can always type any custom player name. */
export const TEAM_SQUADS: Record<string, string[]> = {
  // Spain
  barcelona: [
    "Raphinha",
    "R. Lewandowski",
    "Lamine Yamal",
    "Dani Olmo",
    "Ferran Torres",
    "Pedri",
    "Gavi",
    "Fermín López",
    "Pau Víctor",
  ],
  "real-madrid": [
    "K. Mbappé",
    "Vinícius Júnior",
    "J. Bellingham",
    "Rodrygo",
    "F. Valverde",
    "Endrick",
    "L. Modrić",
    "Brahim Díaz",
    "A. Güler",
  ],
  "atletico-madrid": [
    "A. Griezmann",
    "J. Álvarez",
    "A. Sørloth",
    "Á. Correa",
    "R. De Paul",
    "Marcos Llorente",
    "S. Lino",
  ],
  "real-betis": [
    "G. Lo Celso",
    "Vitor Roque",
    "P. Fornals",
    "A. Ezzalzouli",
    "Chimy Ávila",
    "Isco",
    "Juanmi",
  ],
  "athletic-club": ["Nico Williams", "I. Williams", "O. Sancet", "G. Guruzeta", "Berenguer"],
  "real-sociedad": ["M. Oyarzabal", "T. Kubo", "B. Méndez", "O. Óskarsson", "S. Becker"],
  villarreal: ["A. Pérez", "G. Moreno", "N. Pépé", "Á. Baena", "T. Barry"],
  sevilla: ["I. Romero", "D. Lukébakio", "S. Iheanacho", "Suso", "Saúl"],

  // England
  arsenal: [
    "B. Saka",
    "K. Havertz",
    "Gabriel Martinelli",
    "M. Ødegaard",
    "L. Trossard",
    "Gabriel Jesus",
    "R. Sterling",
    "D. Rice",
  ],
  "manchester-city": [
    "E. Haaland",
    "P. Foden",
    "K. De Bruyne",
    "Bernardo Silva",
    "J. Doku",
    "J. Grealish",
    "İ. Gündoğan",
    "Savinho",
  ],
  liverpool: [
    "M. Salah",
    "L. Díaz",
    "D. Núñez",
    "C. Gakpo",
    "Diogo Jota",
    "D. Szoboszlai",
    "A. Mac Allister",
    "F. Chiesa",
  ],
  chelsea: [
    "C. Palmer",
    "N. Jackson",
    "C. Nkunku",
    "N. Madueke",
    "J. Sancho",
    "Pedro Neto",
    "E. Fernández",
    "J. Félix",
  ],
  "manchester-united": [
    "B. Fernandes",
    "M. Rashford",
    "R. Højlund",
    "A. Garnacho",
    "J. Zirkzee",
    "Antony",
    "A. Diallo",
    "Casemiro",
  ],
  tottenham: [
    "Son Heung-min",
    "D. Solanke",
    "J. Maddison",
    "B. Johnson",
    "D. Kulusevski",
    "Richarlison",
    "T. Werner",
  ],
  "newcastle": [
    "A. Isak",
    "A. Gordon",
    "H. Barnes",
    "Joelinton",
    "B. Guimarães",
    "C. Wilson",
  ],
  "aston-villa": [
    "O. Watkins",
    "J. Durán",
    "L. Bailey",
    "M. Rogers",
    "E. Buendía",
    "J. McGinn",
  ],

  // Germany
  bayern: [
    "H. Kane",
    "J. Musiala",
    "M. Olise",
    "L. Sané",
    "S. Gnabry",
    "T. Müller",
    "K. Coman",
    "M. Tel",
    "L. Goretzka",
  ],
  "borussia-dortmund": [
    "S. Guirassy",
    "J. Brandt",
    "D. Malen",
    "K. Adeyemi",
    "M. Sabitzer",
    "J. Bynoe-Gittens",
    "M. Beier",
  ],
  "bayer-leverkusen": [
    "F. Wirtz",
    "V. Boniface",
    "P. Schick",
    "J. Frimpong",
    "Á. Grimaldo",
    "A. Adli",
    "G. Xhaka",
  ],
  "rb-leipzig": ["L. Openda", "B. Šeško", "X. Simons", "C. Baumgartner", "A. Nusa"],

  // Italy
  inter: [
    "L. Martínez",
    "M. Thuram",
    "H. Çalhanoğlu",
    "N. Barella",
    "M. Taremi",
    "M. Arnautović",
    "F. Dimarco",
  ],
  "ac-milan": [
    "R. Leão",
    "Á. Morata",
    "C. Pulisic",
    "T. Abraham",
    "T. Reijnders",
    "S. Chukwueze",
    "N. Okafor",
  ],
  juventus: [
    "D. Vlahović",
    "K. Yıldız",
    "T. Koopmeiners",
    "F. Conceição",
    "N. González",
    "T. Weah",
    "A. Milik",
  ],
  napoli: [
    "K. Kvaratskhelia",
    "R. Lukaku",
    "S. McTominay",
    "M. Politano",
    "G. Raspadori",
    "G. Simeone",
    "David Neres",
  ],
  "as-roma": [
    "P. Dybala",
    "A. Dovbyk",
    "L. Pellegrini",
    "M. Soulé",
    "S. El Shaarawy",
    "T. Baldanzi",
  ],
  atalanta: ["M. Retegui", "A. Lookman", "C. De Ketelaere", "M. Pašalić", "L. Samardžić"],
  como: ["A. Belotti", "P. Cutrone", "G. Strefezza", "N. Paz", "A. Fadera", "M. Kempf"],

  // France
  psg: [
    "O. Dembélé",
    "B. Barcola",
    "R. Kolo Muani",
    "M. Asensio",
    "Vitinha",
    "Gonçalo Ramos",
    "Lee Kang-in",
    "D. Doué",
  ],
  marseille: ["M. Greenwood", "E. Wahi", "A. Harit", "L. Henrique", "J. Rowe"],
  monaco: ["B. Embolo", "F. Balogun", "T. Minamino", "M. Akliouche", "A. Golovin"],

  // National Teams
  brazil: ["Vinícius Júnior", "Rodrygo", "Raphinha", "Endrick", "Richarlison", "Gabriel Martinelli", "Savinho"],
  argentina: ["L. Messi", "L. Martínez", "J. Álvarez", "Á. Di María", "P. Dybala", "A. Mac Allister", "N. González"],
  france: ["K. Mbappé", "O. Dembélé", "B. Barcola", "A. Griezmann", "R. Kolo Muani", "M. Thuram", "K. Coman"],
  england: ["H. Kane", "J. Bellingham", "B. Saka", "P. Foden", "C. Palmer", "O. Watkins", "A. Gordon"],
  spain: ["Lamine Yamal", "Á. Morata", "Nico Williams", "Dani Olmo", "Pedri", "Ferran Torres", "M. Oyarzabal"],
  germany: ["J. Musiala", "F. Wirtz", "K. Havertz", "N. Füllkrug", "L. Sané", "S. Gnabry", "D. Undav"],
  portugal: ["Cristiano Ronaldo", "B. Fernandes", "Bernardo Silva", "R. Leão", "Diogo Jota", "João Félix", "Pedro Neto"],
};

/** Get squad suggestion list for a given teamId or teamName */
export function getTeamSquad(teamId?: string, teamName?: string): string[] {
  if (teamId && TEAM_SQUADS[teamId.toLowerCase()]) {
    return TEAM_SQUADS[teamId.toLowerCase()];
  }
  if (teamName) {
    const normalized = teamName.toLowerCase().replace(/[\s_.-]+/g, "-");
    for (const [key, players] of Object.entries(TEAM_SQUADS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return players;
      }
    }
  }
  return [];
}
