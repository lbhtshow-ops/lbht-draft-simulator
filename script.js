let state = {
  userTeam: "BAL",
  rounds: 3,
  order: [],
  current: 0,
  prospects: [],
  completed: [],
  tab: "ALL",
  trades: [],
  selectedUid: null,
  isSimulating: false,
  selectedRound: 1,
  started: false
};

const POSITIONS = ["ALL","QB","RB","WR","TE","OT","IOL","EDGE","DL","LB","CB","S"];

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function getTeam(abbr){ return TEAMS.find(t => t.abbr === abbr) || TEAMS[0]; }
function currentPickNumber(){ return state.current + 1; }
function currentRound(){ return Math.floor(state.current / 32) + 1; }
function currentTeam(){ return state.order[state.current]; }

function pickValue(pick){
  const slot = ((pick - 1) % 32) + 1;
  return PICK_VALUE[slot] || Math.max(1, 600 - pick * 4);
}

function buildOrder(){
  state.order = [];
  for(let r = 0; r < state.rounds; r++){
    state.order.push(...DEFAULT_ORDER);
  }
}

function makeProspects(){
  const base = clone(PROSPECTS).map((p, i) => ({ ...p, uid: `real-${i}` }));

  const positions = ["QB","RB","WR","TE","OT","IOL","EDGE","DL","LB","CB","S"];

  let rank = base.length + 1;

  while(base.length < state.rounds * 32 + 40){
    const pos = positions[rank % positions.length];

    base.push({
      uid: `auto-${rank}`,
      name: `Draft Prospect ${rank}`,
      pos,
      school: "College Football",
      rank,
      grade: Math.max(60, 82 - Math.floor(rank / 15)),
      projection: rank <= 32 ? "Round 1" : rank <= 96 ? "Day 2" : "Day 3",
      comparison: "Developmental NFL Prospect",
      summary: `Depth prospect at ${pos} used to keep the simulator running until your full database is added.`,
      strengths: ["Developmental upside", "Roster depth", "Scheme flexibility"],
      weaknesses: ["Needs more scouting detail", "Placeholder profile"]
    });

    rank++;
  }

  return base;
}

function resetDraft(){
  state.current = 0;
  state.completed = [];
  state.trades = [];
  state.tab = "ALL";
  state.selectedUid = null;
  state.selectedRound = 1;
  state.isSimulating = false;
  state.started = false;
  state.prospects = makeProspects();
  buildOrder();
  updateAll();
}

function startDraft(){
  if(state.isSimulating) return;

  state.userTeam = document.getElementById("teamSelect")?.value || "BAL";
  state.rounds = Number(document.getElementById("roundSelect")?.value || 3);

  state.current = 0;
  state.completed = [];
  state.trades = [];
  state.tab = "ALL";
  state.selectedUid = null;
  state.selectedRound = 1;
  state.started = true;
  state.prospects = makeProspects();

  buildOrder();
  updateAll();

  simToUser();
}

function draftByIndex(index, cpu = false){
  if(state.current >= state.order.length) return false;
  if(!state.prospects[index]) return false;

  const player = state.prospects.splice(index, 1)[0];

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

  if(!state.prospects.length){
    state.prospects = makeProspects();
  }

  const team = getTeam(currentTeam());
  const needs = team.needs || [];

  let idx = state.prospects.findIndex(p => needs.includes(p.pos));

  if(idx === -1 || Math.random() < 0.3){
    idx = 0;
  }

  return draftByIndex(idx, true);
}

function simToUser(){
  if(state.isSimulating) return;

  state.isSimulating = true;
  updateControls();

  function step(){
    if(state.current >= state.order.length){
      state.isSimulating = false;
      updateAll();
      return;
    }

    if(currentTeam() === state.userTeam){
      state.isSimulating = false;
      state.selectedRound = currentRound();
      updateAll();
      return;
    }

    let batch = 0;

    while(
      state.current < state.order.length &&
      currentTeam() !== state.userTeam &&
      batch < 6
    ){
      const ok = cpuPick();
      if(!ok) break;
      batch++;
    }

    updateClock();
    updateDraftOrder();
    updateResults();
    updateControls();

    setTimeout(step, 10);
  }

  step();
}

function finishDraft(){
  if(state.isSimulating) return;

  closeProfile();
  closeTrade();

  state.isSimulating = true;
  updateControls();

  function step(){
    let batch = 0;

    while(state.current < state.order.length && batch < 12){
      const ok = cpuPick();
      if(!ok) break;
      batch++;
    }

    updateClock();
    updateDraftOrder();
    updateResults();
    updateControls();

    if(state.current >= state.order.length){
      state.isSimulating = false;
      state.selectedRound = 1;
      updateAll();
      return;
    }

    setTimeout(step, 10);
  }

  step();
}

function draftPlayer(uid){
  if(state.isSimulating) return;

  if(currentTeam() !== state.userTeam){
    alert("It is not your pick yet. Click Sim To Pick.");
    return;
  }

  const index = state.prospects.findIndex(p => p.uid === uid);

  if(index === -1){
    alert("This player is no longer available.");
    closeProfile();
    updateProspects();
    return;
  }

  draftByIndex(index, false);
  closeProfile();
  updateAll();

  if(state.current < state.order.length){
    simToUser();
  }
}

function autoPick(){
  if(state.isSimulating) return;

  if(currentTeam() !== state.userTeam){
    alert("It is not your pick yet. Click Sim To Pick.");
    return;
  }

  const team = getTeam(state.userTeam);
  const needs = team.needs || [];

  let idx = state.prospects.findIndex(p => needs.includes(p.pos));
  if(idx === -1) idx = 0;

  draftByIndex(idx, false);
  updateAll();

  if(state.current < state.order.length){
    simToUser();
  }
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

function getFit(player, abbr = state.userTeam){
  const team = getTeam(abbr);
  const needs = team.needs || [];
  const pick = currentPickNumber();

  let score = 0;
  const valueGap = player.rank - pick;

  if(needs.includes(player.pos)) score += 45;
  if(valueGap <= -8) score += 35;
  else if(valueGap <= 4) score += 25;
  else if(valueGap <= 15) score += 10;
  else score -= 10;

  if(player.grade >= 92) score += 15;
  else if(player.grade >= 86) score += 8;

  if(score >= 70){
    return {
      label:"Elite Fit",
      css:"fit-elite",
      text:`${player.name} is an excellent fit for ${team.name}. He addresses a major need at ${player.pos} while also giving strong value.`
    };
  }

  if(score >= 45){
    return {
      label:"Good Fit",
      css:"fit-good",
      text:`${player.name} is a strong fit for ${team.name}. The position lines up with the team's needs and the value is solid.`
    };
  }

  return {
    label:"Low Fit",
    css:"fit-low",
    text:`${team.name} could draft ${player.name}, but ${player.pos} is not one of their listed top needs or the value may be less ideal here.`
  };
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

  state.selectedUid = uid;

  const team = getTeam(state.userTeam);
  const fit = getFit(player);
  const canPick = currentTeam() === state.userTeam && !state.isSimulating;

  const box = document.getElementById("profileContent");
  if(!box) return;

  box.innerHTML = `
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
        <p class="small">${fit.text}</p>
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
      <button onclick="draftPlayer('${player.uid}')" ${canPick ? "" : "disabled"}>
        Draft Player
      </button>
      <button class="secondary" onclick="closeProfile()">Close</button>
    </div>
  `;

  document.getElementById("profileModal").style.display = "block";
}

function closeProfile(){
  const modal = document.getElementById("profileModal");
  if(modal) modal.style.display = "none";
  state.selectedUid = null;
}

function openTrade(){
  if(state.isSimulating) return;
  if(state.current >= state.order.length) return;

  const modal = document.getElementById("tradeModal");
  if(!modal) return;

  modal.style.display = "block";
  renderTradeModal();
}

function closeTrade(){
  const modal = document.getElementById("tradeModal");
  if(modal) modal.style.display = "none";
}

function renderTradeModal(){
  const tradeTeam = document.getElementById("tradeTeam");
  if(!tradeTeam) return;

  tradeTeam.innerHTML = TEAMS
    .filter(t => t.abbr !== state.userTeam)
    .map(t => `<option value="${t.abbr}">${t.name}</option>`)
    .join("");

  updateTradeReceive();
}

function checked(id){
  return [...document.querySelectorAll(`#${id} input:checked`)].map(x => Number(x.value));
}

function updateTradeReceive(){
  const tradeTeam = document.getElementById("tradeTeam");
  const giveBox = document.getElementById("givePicks");
  const receiveBox = document.getElementById("receivePicks");

  if(!tradeTeam || !giveBox || !receiveBox) return;

  const target = tradeTeam.value;

  const myPicks = state.order
    .map((abbr, i) => ({ abbr, pick: i + 1 }))
    .filter(x => x.abbr === state.userTeam && x.pick > currentPickNumber());

  const theirPicks = state.order
    .map((abbr, i) => ({ abbr, pick: i + 1 }))
    .filter(x => x.abbr === target && x.pick >= currentPickNumber());

  giveBox.innerHTML = myPicks.length
    ? myPicks.map(x => `
      <label class="check">
        <input type="checkbox" value="${x.pick}" onchange="tradeMath()">
        Pick ${x.pick} - Round ${Math.floor((x.pick - 1) / 32) + 1}
      </label>
    `).join("")
    : `<div class="small">No future picks available.</div>`;

  receiveBox.innerHTML = theirPicks.length
    ? theirPicks.slice(0, 12).map(x => `
      <label class="check">
        <input type="checkbox" value="${x.pick}" onchange="tradeMath()">
        Pick ${x.pick} - Round ${Math.floor((x.pick - 1) / 32) + 1}
      </label>
    `).join("")
    : `<div class="small">No picks available from this team.</div>`;

  tradeMath();
}

function tradeMath(){
  const box = document.getElementById("tradeMath");
  if(!box) return;

  const give = checked("givePicks");
  const receive = checked("receivePicks");

  const giveValue = give.reduce((s,p) => s + pickValue(p), 0);
  const receiveValue = receive.reduce((s,p) => s + pickValue(p), 0);
  const diff = giveValue - receiveValue;

  let verdict = "Select picks to calculate value.";
  let css = "small";

  if(give.length && receive.length){
    if(giveValue >= receiveValue * 0.95){
      verdict = "Likely Accepted";
      css = "fit-elite";
    } else if(giveValue >= receiveValue * 0.85){
      verdict = "Borderline Offer";
      css = "fit-good";
    } else {
      verdict = "Likely Rejected";
      css = "reach";
    }
  }

  box.innerHTML = `
    <strong class="${css}">${verdict}</strong><br>
    You give: ${giveValue} pts | You receive: ${receiveValue} pts | Difference: ${diff} pts
  `;
}

function acceptTrade(){
  const tradeTeam = document.getElementById("tradeTeam");
  if(!tradeTeam) return;

  const target = tradeTeam.value;
  const give = checked("givePicks");
  const receive = checked("receivePicks");

  if(!give.length || !receive.length){
    alert("Select picks from both sides.");
    return;
  }

  const giveValue = give.reduce((s,p) => s + pickValue(p), 0);
  const receiveValue = receive.reduce((s,p) => s + pickValue(p), 0);

  if(giveValue < receiveValue * 0.85){
    alert("Trade rejected. Your offer is too light based on pick value.");
    return;
  }

  if(giveValue < receiveValue * 0.95 && Math.random() < 0.5){
    alert("Trade rejected. The other team wants more value.");
    return;
  }

  give.forEach(pick => {
    if(state.order[pick - 1] === state.userTeam) state.order[pick - 1] = target;
  });

  receive.forEach(pick => {
    if(state.order[pick - 1] === target) state.order[pick - 1] = state.userTeam;
  });

  state.trades.push(
    `${getTeam(state.userTeam).name} acquired pick(s) ${receive.join(", ")} from ${getTeam(target).name} for pick(s) ${give.join(", ")}.`
  );

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
          <div>
            <h2>Your Picks To Give</h2>
            <div id="givePicks" class="pickbox"></div>
          </div>

          <div>
            <h2>Picks To Receive</h2>
            <div id="receivePicks" class="pickbox"></div>
          </div>
        </div>

        <div id="tradeMath" class="summary" style="margin-top:12px;"></div>

        <div class="btn-row">
          <button onclick="acceptTrade()">Submit Trade</button>
          <button class="secondary" onclick="closeTrade()">Cancel</button>
        </div>
      </div>
    </div>

    <div id="profileModal" class="profile-modal" onclick="if(event.target.id==='profileModal') closeProfile()">
      <div class="profile-card">
        <div id="profileContent"></div>
      </div>
    </div>
  `;

  document.getElementById("teamSelect").innerHTML = TEAMS
    .map(t => `<option value="${t.abbr}" ${t.abbr === state.userTeam ? "selected" : ""}>${t.name}</option>`)
    .join("");
}

function updateControls(){
  const pill = document.getElementById("statusPill");
  if(pill) pill.textContent = state.isSimulating ? "Simulating..." : "● LBHT Draft War Room";

  ["teamSelect","roundSelect","startBtn","simBtn","finishBtn","tradeBtn"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.disabled = state.isSimulating;
  });

  const reset = document.getElementById("resetBtn");
  if(reset) reset.disabled = state.isSimulating;
}

function updateTeamCard(){
  const team = getTeam(state.userTeam);

  document.getElementById("teamCard").innerHTML = `
    <div class="team-card">
      <img class="logo" src="${team.logo}" loading="lazy" />
      <div>
        <strong>${team.name}</strong>
        <div class="small">Current team</div>
      </div>
    </div>
    <div class="needs">
      ${team.needs.map(n => `<span class="chip">${n}</span>`).join("")}
    </div>
  `;
}

function updateClock(){
  const box = document.getElementById("clockBox");

  if(state.current >= state.order.length){
    box.innerHTML = `
      <div class="clock">
        <strong>Draft Complete</strong>
        <button onclick="resetDraft()">Reset Draft</button>
      </div>
    `;
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
      <button onclick="autoPick()" ${currentTeam() === state.userTeam && !state.isSimulating ? "" : "disabled"}>
        Auto Pick
      </button>
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
  const box = document.getElementById("prospectList");

  box.innerHTML = visibleProspects().slice(0, 35).map(player => {
    const need = user.needs.includes(player.pos);
    const fit = getFit(player);

    return `
      <div class="prospect" onclick="openProfile('${player.uid}')">
        <div class="rank">${player.rank}</div>
        <div>
          <div class="player">${player.name} ${need ? `<span class="chip">Need</span>` : ""}</div>
          <div class="small">${player.school} • Grade ${player.grade} • <span class="${fit.css}">${fit.label}</span></div>
          <div class="small">${player.summary || ""}</div>
        </div>
        <div class="pos">${player.pos}</div>
      </div>
    `;
  }).join("");
}

function updateRoundDropdown(){
  const roundView = document.getElementById("roundView");
  if(!roundView) return;

  roundView.innerHTML = Array.from({ length: state.rounds }, (_, i) => `
    <option value="${i + 1}" ${state.selectedRound === i + 1 ? "selected" : ""}>Round ${i + 1}</option>
  `).join("");
}

function updateDraftOrder(){
  updateRoundDropdown();

  const start = (state.selectedRound - 1) * 32;
  const end = start + 32;

  document.getElementById("draftOrderList").innerHTML = state.order
    .slice(start, end)
    .map((abbr, offset) => {
      const i = start + offset;
      const team = getTeam(abbr);
      const made = state.completed.find(p => p.pick === i + 1);

      return `
        <div class="pick ${i === state.current ? "active-pick" : ""}">
          <strong>${i + 1}. ${team.abbr} - ${team.name}</strong>
          <div class="small">
            ${made ? `${made.player.name}, ${made.player.pos}, ${made.player.school}` : `Round ${Math.floor(i / 32) + 1}`}
          </div>
        </div>
      `;
    }).join("");
}

function updateResults(){
  const picks = state.completed.filter(p => p.team === state.userTeam);

  document.getElementById("resultsList").innerHTML = picks.length
    ? picks.map(p => `
      <div class="result">
        <strong>Pick ${p.pick}: ${p.player.name}</strong>
        <div class="small">${p.player.pos}, ${p.player.school} • Rank ${p.player.rank}</div>
      </div>
    `).join("")
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

document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    closeProfile();
    closeTrade();
  }
});

function init(){
  buildOrder();
  state.prospects = makeProspects();
  renderApp();
  updateAll();
}

init();
