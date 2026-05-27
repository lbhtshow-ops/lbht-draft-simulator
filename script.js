let state = {
  userTeam: "BAL",
  rounds: 3,
  order: [],
  current: 0,
  prospects: [],
  completed: [],
  tab: "ALL",
  trades: [],
  selectedRound: 1,
  isSimulating: false
};

const POSITIONS = ["ALL","QB","RB","WR","TE","OT","IOL","EDGE","DL","LB","CB","S"];

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function getTeam(abbr){ return TEAMS.find(t => t.abbr === abbr) || TEAMS[0]; }
function currentPickNumber(){ return state.current + 1; }
function currentRound(){ return Math.floor(state.current / 32) + 1; }
function currentTeam(){ return state.order[state.current]; }

function buildOrder(){
  state.order = [];
  for(let r = 0; r < state.rounds; r++) state.order.push(...DEFAULT_ORDER);
}

function makeProspects(){
  let base = clone(PROSPECTS).map((p,i)=>({...p, uid:`real-${i}`}));
  const pos = ["QB","RB","WR","TE","OT","IOL","EDGE","DL","LB","CB","S"];
  let rank = base.length + 1;

  while(base.length < state.rounds * 32 + 75){
    base.push({
      uid:`auto-${rank}`,
      name:`Draft Prospect ${rank}`,
      pos:pos[rank % pos.length],
      school:"College Football",
      rank,
      grade:Math.max(60, 84 - Math.floor(rank / 12)),
      projection: rank <= 32 ? "Round 1" : rank <= 96 ? "Day 2" : "Day 3",
      comparison:"Developmental NFL Prospect",
      summary:"Placeholder prospect used until the full LBHT database is added.",
      strengths:["Developmental upside","Roster depth","Scheme flexibility"],
      weaknesses:["Needs scouting detail","Placeholder profile"]
    });
    rank++;
  }

  return base;
}

function init(){
  buildOrder();
  state.prospects = makeProspects();
  renderApp();
  updateAll();
}

function startDraft(){
  state.userTeam = document.getElementById("teamSelect")?.value || "BAL";
  state.rounds = Number(document.getElementById("roundSelect")?.value || 3);
  state.current = 0;
  state.completed = [];
  state.trades = [];
  state.tab = "ALL";
  state.selectedRound = 1;
  state.isSimulating = false;
  buildOrder();
  state.prospects = makeProspects();
  updateAll();
  simToUser();
}

function resetDraft(){
  state.current = 0;
  state.completed = [];
  state.trades = [];
  state.tab = "ALL";
  state.selectedRound = 1;
  state.isSimulating = false;
  buildOrder();
  state.prospects = makeProspects();
  closeProfile();
  closeTrade();
  updateAll();
}

function draftByIndex(index, cpu=false){
  if(state.current >= state.order.length) return false;
  if(index < 0 || !state.prospects[index]) return false;

  const player = state.prospects.splice(index,1)[0];

  state.completed.push({
    pick: currentPickNumber(),
    round: currentRound(),
    team: currentTeam(),
    player,
    cpu
  });

  state.current++;
  return true;
}

function cpuPick(){
  if(state.current >= state.order.length) return false;

  if(!state.prospects.length) state.prospects = makeProspects();

  const t = getTeam(currentTeam());
  const needs = t.needs || [];
  let idx = state.prospects.findIndex(p => needs.includes(p.pos));

  if(idx === -1 || Math.random() < .3) idx = 0;

  return draftByIndex(idx, true);
}

function runSimulation(stopAtUserPick){
  if(state.isSimulating) return;

  state.isSimulating = true;
  updateAll();

  let safety = 0;

  function chunk(){
    let batch = 0;

    while(state.current < state.order.length && batch < 10 && safety < 1000){
      if(stopAtUserPick && currentTeam() === state.userTeam) break;

      const ok = cpuPick();
      if(!ok) break;

      batch++;
      safety++;
    }

    state.selectedRound = Math.min(state.rounds, Math.max(1, currentRound()));
    updateAll();

    const done = state.current >= state.order.length;
    const atUser = stopAtUserPick && currentTeam() === state.userTeam;

    if(done || atUser || safety >= 1000){
      state.isSimulating = false;
      updateAll();
      return;
    }

    requestAnimationFrame(chunk);
  }

  requestAnimationFrame(chunk);
}

function simToUser(){
  runSimulation(true);
}

function finishDraft(){
  closeProfile();
  closeTrade();
  runSimulation(false);
}

function draftPlayer(uid){
  if(state.isSimulating) return;

  if(currentTeam() !== state.userTeam){
    alert("It is not your pick yet. Click Sim To Pick.");
    return;
  }

  const idx = state.prospects.findIndex(p => p.uid === uid);

  if(idx === -1){
    alert("That player is no longer available.");
    updateProspects();
    return;
  }

  draftByIndex(idx, false);
  closeProfile();
  updateAll();

  if(state.current < state.order.length) simToUser();
}

function autoPick(){
  if(state.isSimulating) return;

  if(currentTeam() !== state.userTeam){
    alert("It is not your pick yet. Click Sim To Pick.");
    return;
  }

  const needs = getTeam(state.userTeam).needs || [];
  let idx = state.prospects.findIndex(p => needs.includes(p.pos));
  if(idx === -1) idx = 0;

  draftByIndex(idx, false);
  updateAll();

  if(state.current < state.order.length) simToUser();
}

function setTab(tab){
  state.tab = tab;
  updateTabs();
  updateProspects();
}

function setRound(round){
  state.selectedRound = Number(round);
  updateDraftOrder();
}

function visibleProspects(){
  const q = (document.getElementById("searchBox")?.value || "").toLowerCase();

  return state.prospects.filter(p => {
    const tabMatch = state.tab === "ALL" || p.pos === state.tab;
    const searchMatch = `${p.name} ${p.school} ${p.pos}`.toLowerCase().includes(q);
    return tabMatch && searchMatch;
  });
}

function getFit(player){
  const team = getTeam(state.userTeam);
  const needs = team.needs || [];
  const pick = currentPickNumber();
  let score = 0;
  const gap = player.rank - pick;

  if(needs.includes(player.pos)) score += 45;
  if(gap <= -8) score += 35;
  else if(gap <= 4) score += 25;
  else if(gap <= 15) score += 10;
  else score -= 10;

  if(player.grade >= 92) score += 15;
  else if(player.grade >= 86) score += 8;

  if(score >= 70) return {label:"Elite Fit", css:"fit-elite"};
  if(score >= 45) return {label:"Good Fit", css:"fit-good"};
  return {label:"Low Fit", css:"fit-low"};
}

function gradeDraft(){
  const picks = state.completed.filter(p => p.team === state.userTeam);
  if(!picks.length) return "N/A";

  const needs = getTeam(state.userTeam).needs || [];
  let score = 0;

  picks.forEach(p => {
    let value = 100 - Math.abs(p.player.rank - p.pick) * 1.5;
    if(needs.includes(p.player.pos)) value += 8;
    score += value;
  });

  const avg = score / picks.length;
  if(avg >= 104) return "A+";
  if(avg >= 96) return "A";
  if(avg >= 90) return "A-";
  if(avg >= 84) return "B+";
  if(avg >= 78) return "B";
  if(avg >= 72) return "B-";
  return "C+";
}

function shareText(){
  const picks = state.completed.filter(p => p.team === state.userTeam);
  const team = getTeam(state.userTeam);

  if(!picks.length) return "Your mock draft results will appear here.";

  return `LBHT Mock Draft Result
Team: ${team.name}
Grade: ${gradeDraft()}

${picks.map(p => `Pick ${p.pick}: ${p.player.name}, ${p.player.pos}, ${p.player.school}`).join("\n")}

Run your own mock at lbhtshow.com`;
}

function copyShare(){
  navigator.clipboard.writeText(shareText());
  alert("Mock draft copied!");
}

function openProfile(uid){
  if(state.isSimulating) return;

  const player = state.prospects.find(p => p.uid === uid);
  if(!player) return;

  const team = getTeam(state.userTeam);
  const fit = getFit(player);
  const canPick = currentTeam() === state.userTeam && !state.isSimulating;

  document.getElementById("profileContent").innerHTML = `
    <button class="modal-close" onclick="closeProfile()">×</button>

    <div class="profile-top">
      <div>
        <div class="profile-name">${player.name}</div>
        <div class="profile-sub">${player.pos} • ${player.school} • Rank #${player.rank} • ${player.projection || "Draft Prospect"}</div>
        <div class="profile-sub">Player comparison: ${player.comparison || "N/A"}</div>
      </div>
      <div class="profile-grade">Grade<br><span style="font-size:26px;">${player.grade}</span></div>
    </div>

    <div class="profile-grid">
      <div class="profile-box">
        <h3>Scouting Summary</h3>
        <p class="small">${player.summary || ""}</p>
      </div>

      <div class="profile-box">
        <h3>Draft Fit For ${team.name}</h3>
        <p class="${fit.css}">${fit.label}</p>
        <p class="small">${player.name} is evaluated against ${team.name}'s current team needs.</p>
      </div>

      <div class="profile-box">
        <h3>Strengths</h3>
        <ul>${(player.strengths || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>

      <div class="profile-box">
        <h3>Weaknesses</h3>
        <ul>${(player.weaknesses || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>
    </div>

    <div class="btn-row" style="margin-top:14px;">
      <button onclick="draftPlayer('${player.uid}')" ${canPick ? "" : "disabled"}>Draft Player</button>
      <button class="secondary" onclick="closeProfile()">Close</button>
    </div>
  `;

  document.getElementById("profileModal").style.display = "block";
}

function closeProfile(){
  const modal = document.getElementById("profileModal");
  if(modal) modal.style.display = "none";
}

function openTrade(){
  if(state.isSimulating) return;
  if(state.current >= state.order.length) return;

  document.getElementById("tradeModal").style.display = "block";
  renderTradeModal();
}

function closeTrade(){
  const modal = document.getElementById("tradeModal");
  if(modal) modal.style.display = "none";
}

function checked(id){
  return [...document.querySelectorAll(`#${id} input:checked`)].map(x => Number(x.value));
}

function renderTradeModal(){
  const tradeTeam = document.getElementById("tradeTeam");

  tradeTeam.innerHTML = TEAMS
    .filter(t => t.abbr !== state.userTeam)
    .map(t => `<option value="${t.abbr}">${t.name}</option>`)
    .join("");

  updateTradeReceive();
}

function updateTradeReceive(){
  const target = document.getElementById("tradeTeam").value;

  const myPicks = state.order.map((abbr,i)=>({abbr,pick:i+1}))
    .filter(x => x.abbr === state.userTeam && x.pick > currentPickNumber());

  const theirPicks = state.order.map((abbr,i)=>({abbr,pick:i+1}))
    .filter(x => x.abbr === target && x.pick >= currentPickNumber());

  document.getElementById("givePicks").innerHTML = myPicks.length
    ? myPicks.map(x => `<label class="check"><input type="checkbox" value="${x.pick}" onchange="tradeMath()"> Pick ${x.pick}</label>`).join("")
    : `<div class="small">No future picks available.</div>`;

  document.getElementById("receivePicks").innerHTML = theirPicks.length
    ? theirPicks.slice(0,12).map(x => `<label class="check"><input type="checkbox" value="${x.pick}" onchange="tradeMath()"> Pick ${x.pick}</label>`).join("")
    : `<div class="small">No picks available.</div>`;

  tradeMath();
}

function tradeMath(){
  const give = checked("givePicks");
  const receive = checked("receivePicks");

  const giveValue = give.reduce((s,p)=>s+pickValue(p),0);
  const receiveValue = receive.reduce((s,p)=>s+pickValue(p),0);

  let verdict = "Select picks to calculate value.";
  let css = "small";

  if(give.length && receive.length){
    if(giveValue >= receiveValue * .95){ verdict = "Likely Accepted"; css = "fit-elite"; }
    else if(giveValue >= receiveValue * .85){ verdict = "Borderline Offer"; css = "fit-good"; }
    else { verdict = "Likely Rejected"; css = "reach"; }
  }

  document.getElementById("tradeMath").innerHTML = `
    <strong class="${css}">${verdict}</strong><br>
    You give: ${giveValue} pts | You receive: ${receiveValue} pts
  `;
}

function acceptTrade(){
  const target = document.getElementById("tradeTeam").value;
  const give = checked("givePicks");
  const receive = checked("receivePicks");

  if(!give.length || !receive.length){
    alert("Select picks from both sides.");
    return;
  }

  const giveValue = give.reduce((s,p)=>s+pickValue(p),0);
  const receiveValue = receive.reduce((s,p)=>s+pickValue(p),0);

  if(giveValue < receiveValue * .85){
    alert("Trade rejected. Your offer is too light.");
    return;
  }

  if(giveValue < receiveValue * .95 && Math.random() < .5){
    alert("Trade rejected. The other team wants more value.");
    return;
  }

  give.forEach(p => {
    if(state.order[p-1] === state.userTeam) state.order[p-1] = target;
  });

  receive.forEach(p => {
    if(state.order[p-1] === target) state.order[p-1] = state.userTeam;
  });

  state.trades.push(`${getTeam(state.userTeam).name} acquired pick(s) ${receive.join(", ")} for pick(s) ${give.join(", ")}.`);
  closeTrade();
  updateAll();
  alert("Trade accepted!");
}

function renderApp(){
  document.getElementById("app").innerHTML = `
    <div class="header">
      <div>
        <h1>LBHT NFL Draft Simulator</h1>
        <p>Make picks, trade up/down, build your team, and share your mock.</p>
      </div>
      <div id="statusPill" class="pill">● LBHT Draft War Room</div>
    </div>

    <div class="layout">
      <aside class="panel">
        <h2>Setup</h2>

        <label>Select Team</label>
        <select id="teamSelect"></select>

        <label>Rounds</label>
        <select id="roundSelect">
          <option value="1">1 Round</option>
          <option value="3" selected>3 Rounds</option>
          <option value="7">7 Rounds</option>
        </select>

        <button id="startBtn" onclick="startDraft()" style="width:100%;">Start Draft</button>

        <div class="btn-row">
          <button id="simBtn" class="secondary" onclick="simToUser()">Sim To Pick</button>
          <button id="finishBtn" class="secondary" onclick="finishDraft()">Finish</button>
        </div>

        <button id="resetBtn" class="secondary" onclick="resetDraft()" style="width:100%;">Reset Draft</button>

        <div id="teamCard"></div>

        <button id="tradeBtn" onclick="openTrade()" style="width:100%;">Propose Trade</button>

        <h2 style="margin-top:16px;">Draft Order</h2>
        <label>View Round</label>
        <select id="roundView" onchange="setRound(this.value)"></select>
        <div id="draftOrderList" class="list"></div>
      </aside>

      <main class="panel">
        <div id="clockBox"></div>
        <div id="tabs" class="tabs"></div>
        <input id="searchBox" placeholder="Search prospects..." oninput="updateProspects()" />
        <div id="prospectList" class="list"></div>
      </main>

      <aside class="panel">
        <h2>Your Draft</h2>
        <div id="resultsList" class="list"></div>

        <h2 style="margin-top:16px;">Draft Grade</h2>
        <div id="gradeBox" class="summary"></div>

        <h2 style="margin-top:16px;">Share Result</h2>
        <div id="shareBox" class="summary"></div>
        <button onclick="copyShare()" style="width:100%;">Copy Share Text</button>

        <h2 style="margin-top:16px;">Trades</h2>
        <div id="tradesBox"></div>
      </aside>
    </div>

    <div id="tradeModal" class="modal" onclick="if(event.target.id==='tradeModal') closeTrade()">
      <div class="modal-card">
        <button class="modal-close" onclick="closeTrade()">×</button>
        <h2>Propose Trade</h2>
        <label>Trade With</label>
        <select id="tradeTeam" onchange="updateTradeReceive()"></select>
        <div class="trade-grid">
          <div><h2>Your Picks To Give</h2><div id="givePicks" class="pickbox"></div></div>
          <div><h2>Picks To Receive</h2><div id="receivePicks" class="pickbox"></div></div>
        </div>
        <div id="tradeMath" class="summary" style="margin-top:12px;"></div>
        <div class="btn-row">
          <button onclick="acceptTrade()">Submit Trade</button>
          <button class="secondary" onclick="closeTrade()">Cancel</button>
        </div>
      </div>
    </div>

    <div id="profileModal" class="profile-modal" onclick="if(event.target.id==='profileModal') closeProfile()">
      <div class="profile-card"><div id="profileContent"></div></div>
    </div>
  `;

  document.getElementById("teamSelect").innerHTML = TEAMS
    .map(t => `<option value="${t.abbr}" ${t.abbr === state.userTeam ? "selected" : ""}>${t.name}</option>`)
    .join("");
}

function updateControls(){
  document.getElementById("statusPill").textContent = state.isSimulating ? "Simulating..." : "● LBHT Draft War Room";

  ["teamSelect","roundSelect","startBtn","simBtn","finishBtn","tradeBtn"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.disabled = state.isSimulating;
  });
}

function updateTeamCard(){
  const team = getTeam(state.userTeam);

  document.getElementById("teamCard").innerHTML = `
    <div class="team-card">
      <img class="logo" src="${team.logo}" loading="lazy" />
      <div><strong>${team.name}</strong><div class="small">Current team</div></div>
    </div>
    <div class="needs">${team.needs.map(n => `<span class="chip">${n}</span>`).join("")}</div>
  `;
}

function updateClock(){
  const box = document.getElementById("clockBox");

  if(state.current >= state.order.length){
    box.innerHTML = `<div class="clock"><strong>Draft Complete</strong><button onclick="resetDraft()">Reset Draft</button></div>`;
    return;
  }

  const team = getTeam(currentTeam());

  box.innerHTML = `
    <div class="clock">
      <div class="clock-left">
        <img class="logo" src="${team.logo}" loading="lazy" />
        <div>
          <strong>Pick ${currentPickNumber()} - Round ${currentRound()}</strong>
          <div class="small">${team.name} are on the clock</div>
        </div>
      </div>
      <button onclick="autoPick()" ${currentTeam() === state.userTeam && !state.isSimulating ? "" : "disabled"}>Auto Pick</button>
    </div>
  `;
}

function updateTabs(){
  document.getElementById("tabs").innerHTML = POSITIONS
    .map(t => `<button class="tab ${state.tab === t ? "active" : ""}" onclick="setTab('${t}')">${t}</button>`)
    .join("");
}

function updateProspects(){
  const user = getTeam(state.userTeam);
  const canDraft = currentTeam() === state.userTeam && !state.isSimulating;

  document.getElementById("prospectList").innerHTML = visibleProspects().slice(0,35).map(player => {
    const need = user.needs.includes(player.pos);
    const fit = getFit(player);

    return `
      <div class="prospect">
        <div class="rank">${player.rank}</div>
        <div onclick="openProfile('${player.uid}')" style="cursor:pointer;">
          <div class="player">${player.name} ${need ? `<span class="chip">Need</span>` : ""}</div>
          <div class="small">${player.school} • Grade ${player.grade} • <span class="${fit.css}">${fit.label}</span></div>
          <div class="small">${player.summary || ""}</div>
        </div>
        <div>
          <div class="pos">${player.pos}</div>
          <button class="draft-mini" onclick="draftPlayer('${player.uid}')" ${canDraft ? "" : "disabled"}>Draft</button>
        </div>
      </div>
    `;
  }).join("");
}

function updateRoundDropdown(){
  document.getElementById("roundView").innerHTML = Array.from({length:state.rounds},(_,i)=>`
    <option value="${i+1}" ${state.selectedRound === i+1 ? "selected" : ""}>Round ${i+1}</option>
  `).join("");
}

function updateDraftOrder(){
  updateRoundDropdown();

  const start = (state.selectedRound - 1) * 32;
  const end = start + 32;

  document.getElementById("draftOrderList").innerHTML = state.order.slice(start,end).map((abbr,offset)=>{
    const i = start + offset;
    const team = getTeam(abbr);
    const made = state.completed.find(p => p.pick === i + 1);

    return `
      <div class="pick ${i === state.current ? "active-pick" : ""}">
        <strong>${i+1}. ${team.abbr} - ${team.name}</strong>
        <div class="small">${made ? `${made.player.name}, ${made.player.pos}, ${made.player.school}` : `Round ${Math.floor(i/32)+1}`}</div>
      </div>
    `;
  }).join("");
}

function updateResults(){
  const picks = state.completed.filter(p => p.team === state.userTeam);

  document.getElementById("resultsList").innerHTML = picks.length
    ? picks.map(p => `<div class="result"><strong>Pick ${p.pick}: ${p.player.name}</strong><div class="small">${p.player.pos}, ${p.player.school}</div></div>`).join("")
    : `<div class="small">No picks yet.</div>`;

  document.getElementById("gradeBox").innerHTML = `<strong>${gradeDraft()}</strong>`;
  document.getElementById("shareBox").textContent = shareText();

  document.getElementById("tradesBox").innerHTML = state.trades.length
    ? state.trades.map(t => `<div class="trade-log small">${t}</div>`).join("")
    : `<div class="small">No trades yet.</div>`;
}

function updateAll(){
  updateControls();
  updateTeamCard();
  updateClock();
  updateTabs();
  updateProspects();
  updateDraftOrder();
  updateResults();
}

document.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    closeProfile();
    closeTrade();
  }
});

init();
