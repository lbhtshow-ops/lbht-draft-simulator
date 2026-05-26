const TEAMS = [
  ["ARI","Arizona Cardinals","ari",["EDGE","OT","CB","WR","DL"]],
  ["ATL","Atlanta Falcons","atl",["EDGE","CB","WR","LB","S"]],
  ["BAL","Baltimore Ravens","bal",["EDGE","OT","CB","WR","IOL"]],
  ["BUF","Buffalo Bills","buf",["WR","CB","DL","S","EDGE"]],
  ["CAR","Carolina Panthers","car",["EDGE","WR","CB","TE","IOL"]],
  ["CHI","Chicago Bears","chi",["OT","EDGE","DL","WR","CB"]],
  ["CIN","Cincinnati Bengals","cin",["DL","EDGE","IOL","CB","TE"]],
  ["CLE","Cleveland Browns","cle",["QB","OT","WR","DL","RB"]],
  ["DAL","Dallas Cowboys","dal",["RB","WR","DL","CB","IOL"]],
  ["DEN","Denver Broncos","den",["WR","TE","DL","LB","RB"]],
  ["DET","Detroit Lions","det",["EDGE","CB","WR","IOL","DL"]],
  ["GB","Green Bay Packers","gb",["CB","WR","EDGE","IOL","DL"]],
  ["HOU","Houston Texans","hou",["IOL","WR","DL","CB","RB"]],
  ["IND","Indianapolis Colts","ind",["TE","CB","S","LB","WR"]],
  ["JAX","Jacksonville Jaguars","jax",["CB","DL","IOL","WR","S"]],
  ["KC","Kansas City Chiefs","kc",["OT","WR","CB","DL","RB"]],
  ["LV","Las Vegas Raiders","lv",["QB","OT","CB","WR","DL"]],
  ["LAC","Los Angeles Chargers","lac",["WR","TE","DL","CB","IOL"]],
  ["LAR","Los Angeles Rams","lar",["CB","OT","EDGE","QB","LB"]],
  ["MIA","Miami Dolphins","mia",["IOL","DL","S","OT","CB"]],
  ["MIN","Minnesota Vikings","min",["CB","DL","IOL","S","RB"]],
  ["NE","New England Patriots","ne",["WR","OT","EDGE","CB","RB"]],
  ["NO","New Orleans Saints","no",["QB","OT","EDGE","WR","DL"]],
  ["NYG","New York Giants","nyg",["QB","OT","CB","WR","IOL"]],
  ["NYJ","New York Jets","nyj",["OT","WR","S","DL","TE"]],
  ["PHI","Philadelphia Eagles","phi",["EDGE","CB","LB","IOL","S"]],
  ["PIT","Pittsburgh Steelers","pit",["QB","CB","DL","WR","RB"]],
  ["SF","San Francisco 49ers","sf",["OT","IOL","CB","DL","WR"]],
  ["SEA","Seattle Seahawks","sea",["IOL","LB","DL","TE","CB"]],
  ["TB","Tampa Bay Buccaneers","tb",["EDGE","LB","CB","IOL","WR"]],
  ["TEN","Tennessee Titans","ten",["OT","WR","EDGE","CB","IOL"]],
  ["WSH","Washington Commanders","wsh",["OT","EDGE","CB","WR","S"]]
].map(t => ({
  abbr: t[0],
  name: t[1],
  logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${t[2]}.png`,
  needs: t[3]
}));

const DEFAULT_ORDER = [
  "TEN","CLE","NYG","NE","JAX","LV","NYJ","CAR",
  "NO","CHI","SF","DAL","MIA","IND","ARI","ATL",
  "CIN","SEA","TB","DEN","PIT","LAC","GB","MIN",
  "HOU","LAR","BAL","DET","BUF","WSH","PHI","KC"
];

const PICK_VALUE = {
  1:3000,2:2600,3:2200,4:1800,5:1700,6:1600,7:1500,8:1400,
  9:1350,10:1300,11:1250,12:1200,13:1150,14:1100,15:1050,16:1000,
  17:950,18:900,19:875,20:850,21:800,22:780,23:760,24:740,
  25:720,26:700,27:680,28:660,29:640,30:620,31:600,32:590
};
