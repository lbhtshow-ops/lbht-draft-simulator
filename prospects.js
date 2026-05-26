const PROSPECTS = [
  {
    name:"Jeremiah Smith", pos:"WR", school:"Ohio State", rank:1, grade:98,
    projection:"Top 5 Pick", comparison:"A.J. Green",
    summary:"Elite WR prospect with rare size, ball skills, and explosive playmaking ability.",
    strengths:["Elite catch radius","High-end ball tracking","Explosive vertical threat","Red-zone weapon"],
    weaknesses:["Can keep refining underneath route tempo","Will face heavy bracket coverage"]
  },
  {
    name:"Arch Manning", pos:"QB", school:"Texas", rank:2, grade:96,
    projection:"Top 10 Pick", comparison:"Eli Manning / Justin Herbert blend",
    summary:"Polished quarterback prospect with NFL bloodlines, arm talent, and strong pocket feel.",
    strengths:["Pocket awareness","Arm talent","Anticipation throws","Pro-style traits"],
    weaknesses:["Needs full-season production sample","Can speed up post-snap processing"]
  },
  {
    name:"Colin Simmons", pos:"EDGE", school:"Texas", rank:3, grade:95,
    projection:"Top 10 Pick", comparison:"Brian Burns",
    summary:"Explosive edge rusher with twitch, bend, and true pass-rush upside.",
    strengths:["First-step burst","Bend around the edge","Closing speed","High pressure rate upside"],
    weaknesses:["Can add strength at the point of attack","Run defense consistency"]
  },
  {
    name:"Caleb Downs", pos:"S", school:"Ohio State", rank:4, grade:94,
    projection:"Top 10 Pick", comparison:"Minkah Fitzpatrick",
    summary:"Do-it-all safety with range, instincts, tackling, and defensive leadership traits.",
    strengths:["Elite instincts","Range","Open-field tackling","Coverage versatility"],
    weaknesses:["Position value may impact draft slot","Can be moved around too much"]
  },
  {
    name:"Dante Moore", pos:"QB", school:"Oregon", rank:5, grade:93,
    projection:"Round 1", comparison:"C.J. Stroud-lite",
    summary:"Accurate rhythm passer with starter-level tools and strong developmental upside.",
    strengths:["Accuracy","Touch throws","Poise","Timing concepts"],
    weaknesses:["Needs more high-end production","Can improve pressure management"]
  },
  {
    name:"Francis Mauigoa", pos:"OT", school:"Miami", rank:6, grade:92,
    projection:"Round 1", comparison:"Penei Sewell-lite",
    summary:"Powerful tackle prospect with excellent size, strength, and movement ability.",
    strengths:["Power profile","Run blocking","Anchor strength","NFL frame"],
    weaknesses:["Pad level consistency","Can clean up hand timing"]
  },
  {
    name:"Rueben Bain Jr.", pos:"EDGE", school:"Miami", rank:7, grade:91,
    projection:"Round 1", comparison:"Cameron Jordan",
    summary:"Strong, versatile defensive front player with inside-out pass-rush ability.",
    strengths:["Power rush","Versatility","Motor","Run defense"],
    weaknesses:["Not the bendiest edge","Needs more pass-rush counters"]
  },
  {
    name:"Peter Woods", pos:"DL", school:"Clemson", rank:8, grade:90,
    projection:"Round 1", comparison:"Christian Wilkins",
    summary:"Interior disruptor with power, leverage, and three-down defensive line upside.",
    strengths:["Interior pressure","Power","Leverage","Block shedding"],
    weaknesses:["Can finish more consistently","Pass-rush plan still developing"]
  },
  {
    name:"Anthony Hill Jr.", pos:"LB", school:"Texas", rank:9, grade:89,
    projection:"Round 1", comparison:"Micah Parsons-lite",
    summary:"Explosive linebacker with downhill range, blitz ability, and defensive playmaking traits.",
    strengths:["Blitzing","Range","Physicality","Sideline-to-sideline speed"],
    weaknesses:["Coverage refinement","Over-pursuit at times"]
  },
  {
    name:"KJ Bolden", pos:"S", school:"Georgia", rank:10, grade:89,
    projection:"Round 1", comparison:"Brian Branch",
    summary:"Athletic defensive back with safety/nickel versatility and high football IQ.",
    strengths:["Coverage flexibility","Instincts","Ball skills","Athleticism"],
    weaknesses:["Still developing play strength","Role clarity will matter"]
  },
  {
    name:"Carnell Tate", pos:"WR", school:"Ohio State", rank:11, grade:88,
    projection:"Round 1-2", comparison:"Michael Pittman Jr.",
    summary:"Smooth receiver with size, strong hands, and reliable intermediate receiving ability.",
    strengths:["Hands","Body control","Route pacing","Contested catches"],
    weaknesses:["Not elite after catch","Can add more suddenness"]
  },
  {
    name:"TJ Parker", pos:"EDGE", school:"Clemson", rank:12, grade:88,
    projection:"Round 1-2", comparison:"Trey Hendrickson",
    summary:"High-motor edge defender with power, production, and strong run-game value.",
    strengths:["Motor","Power rush","Run defense","Hand usage"],
    weaknesses:["Average bend","Needs more explosive counters"]
  },
  {
    name:"Monroe Freeling", pos:"OT", school:"Georgia", rank:13, grade:87,
    projection:"Round 1-2", comparison:"Mike McGlinchey",
    summary:"Long tackle prospect with developmental upside and SEC-tested traits.",
    strengths:["Length","Pass protection upside","Frame","Movement skills"],
    weaknesses:["Needs more strength","Technique consistency"]
  },
  {
    name:"Zachariah Branch", pos:"WR", school:"Georgia", rank:14, grade:86,
    projection:"Round 1-2", comparison:"Zay Flowers",
    summary:"Electric slot and return weapon with game-changing speed and open-field ability.",
    strengths:["Acceleration","YAC ability","Return value","Separation"],
    weaknesses:["Size limitations","Contested catch profile"]
  },
  {
    name:"Olaivavega Ioane", pos:"IOL", school:"Penn State", rank:15, grade:85,
    projection:"Round 2", comparison:"Kevin Zeitler",
    summary:"Powerful interior offensive lineman with finishing ability and physical temperament.",
    strengths:["Power","Anchor","Finishing blocks","Run game fit"],
    weaknesses:["Lateral quickness","Pass protection range"]
  },
  {
    name:"Jermod McCoy", pos:"CB", school:"Tennessee", rank:16, grade:85,
    projection:"Round 2", comparison:"Jaylon Johnson",
    summary:"Smooth outside corner with ball skills, size, and man-coverage ability.",
    strengths:["Ball skills","Length","Man coverage","Fluidity"],
    weaknesses:["Can improve tackling consistency","Route anticipation"]
  },
  {
    name:"Kenyon Sadiq", pos:"TE", school:"Oregon", rank:17, grade:84,
    projection:"Round 2", comparison:"Evan Engram",
    summary:"Athletic receiving tight end with mismatch ability and vertical seam value.",
    strengths:["Athleticism","Receiving upside","Seam routes","YAC ability"],
    weaknesses:["Inline blocking","Play strength"]
  },
  {
    name:"Kadyn Proctor", pos:"OT", school:"Alabama", rank:18, grade:84,
    projection:"Round 2", comparison:"Orlando Brown Jr.",
    summary:"Massive offensive tackle with rare size, power, and high-end run-blocking ability.",
    strengths:["Size","Power","Run blocking","Anchor"],
    weaknesses:["Foot quickness","Speed rush recovery"]
  },
  {
    name:"Sonny Styles", pos:"LB", school:"Ohio State", rank:19, grade:83,
    projection:"Round 2", comparison:"Kyle Hamilton-lite",
    summary:"Hybrid defender with size, speed, and linebacker/safety versatility.",
    strengths:["Versatility","Range","Size/speed blend","Coverage potential"],
    weaknesses:["True positional home","Block deconstruction"]
  },
  {
    name:"Dillon Thieneman", pos:"S", school:"Oregon", rank:20, grade:83,
    projection:"Round 2", comparison:"Jordan Poyer",
    summary:"Instinctive safety with production, range, and reliable back-end awareness.",
    strengths:["Instincts","Ball production","Tackling","Range"],
    weaknesses:["Elite athletic traits are still a question","Man coverage"]
  }
];
