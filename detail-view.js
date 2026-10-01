/* In-app batch page: Subjects -> Lectures, Notes, About. Data comes from cds-data.json. */
(function () {
  const DATA_URL = "cds-data.json";
  let dataPromise = null;
  let root = null;
  let state = { batch: null, tab: "lectures", subject: null };

  const esc = (v = "") => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const ICON_VIDEO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const ICON_CHEV = '<svg class="cxbv-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  const ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>';

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch(DATA_URL).then((r) => {
        if (!r.ok) throw new Error("Lecture data unavailable");
        return r.json();
      }).catch((e) => { dataPromise = null; throw e; });
    }
    return dataPromise;
  }

  function ensureRoot() {
    if (root) return root;
    root = document.createElement("div");
    root.id = "cxBatchView";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    document.body.appendChild(root);
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    return root;
  }

  function shell(title, bodyHtml) {
    return `<div class="cxbv-bar"><button class="cxbv-back" type="button" data-act="back" aria-label="Back">${ICON_BACK}</button><div class="cxbv-bar-title">${esc(title)}</div></div><div class="cxbv-wrap">${bodyHtml}</div>`;
  }

  function hero(b) {
    const img = b.previewImage
      ? `<img class="cxbv-banner" src="${esc(b.previewImage)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=\\'cxbv-banner-ph\\'>${esc(b.tag || "BATCH")}</div>'">`
      : `<div class="cxbv-banner-ph">${esc(b.tag || "BATCH")}</div>`;
    return `<div class="cxbv-hero">${img}<div class="cxbv-hero-body"><h1 class="cxbv-title">${esc(b.name)}</h1><p class="cxbv-sub">${esc(b.byName || "")}</p><div class="cxbv-chips"><span class="cxbv-chip accent">Recorded</span>${b.tag ? `<span class="cxbv-chip">${esc(b.tag)}</span>` : ""}</div></div></div>`;
  }

  function tabs() {
    return `<div class="cxbv-tabs">${["lectures", "notes", "about"].map((t) => `<button class="cxbv-tab${state.tab === t ? " active" : ""}" type="button" data-tab="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>`;
  }

  function render(content) {
    const b = state.batch;
    root.innerHTML = shell(b.name, hero(b) + tabs() + `<div id="cxbvContent">${content}</div>`);
  }

  function skeleton() {
    return '<div class="cxbv-list"><div class="cxbv-skel"></div><div class="cxbv-skel"></div><div class="cxbv-skel"></div></div>';
  }

  function subjectsHtml(info) {
    if (!info.subjects.length) return '<div class="cxbv-state"><b>No subjects yet</b>Is batch mein abhi koi subject nahi hai.</div>';
    return `<div class="cxbv-list">${info.subjects.map((s, i) => `<button class="cxbv-row" type="button" data-subject="${i}"><span class="cxbv-ico">${ICON_VIDEO}</span><span class="cxbv-row-main"><span class="cxbv-row-title">${esc(s.name)}</span><span class="cxbv-row-sub">${s.lectures.length} lectures</span></span>${ICON_CHEV}</button>`).join("")}</div>`;
  }

  function lecturesHtml(sub, query = "") {
    const q = query.trim().toLowerCase();
    const items = sub.lectures.map((l, i) => ({ l, i })).filter((x) => !q || x.l[0].toLowerCase().includes(q));
    const search = sub.lectures.length > 12 ? `<input class="cxbv-find" id="cxbvFind" type="search" placeholder="Search lectures…" value="${esc(query)}" autocomplete="off">` : "";
    const list = items.length
      ? `<div class="cxbv-list" id="cxbvLectures">${items.map(({ l, i }) => `<button class="cxbv-row" type="button" data-lecture="${i}"><span class="cxbv-num">${String(i + 1).padStart(2, "0")}</span><span class="cxbv-row-main"><span class="cxbv-row-title">${esc(l[0])}</span></span><span class="cxbv-ico" style="width:40px;height:40px">${ICON_PLAY}</span></button>`).join("")}</div>`
      : '<div class="cxbv-state"><b>No lectures found</b>Kuch aur search karke dekho.</div>';
    return `<div class="cxbv-crumb">${esc(sub.name)} · ${sub.lectures.length} lectures</div>${search}${list}`;
  }

  function notesHtml() {
    return '<div class="cxbv-state"><b>Notes abhi available nahi hain</b>Is batch ke notes jaise hi milenge yahin dikhenge.</div>';
  }

  function aboutHtml(info) {
    const total = info.subjects.reduce((n, s) => n + s.lectures.length, 0);
    const b = state.batch;
    const facts = [["Batch", b.name], ["Details", b.byName || "—"], ["Exam", b.tag || "—"], ["Mode", "Recorded"], ["Language", b.language || "Hinglish"], ["Subjects", info.subjects.length], ["Lectures", total]];
    return `<div class="cxbv-facts">${facts.map(([k, v]) => `<div class="cxbv-fact"><span>${esc(k)}</span><span>${esc(String(v))}</span></div>`).join("")}</div>`;
  }

  async function paint() {
    const b = state.batch;
    if (state.tab === "notes") { render(notesHtml()); return; }
    render(skeleton());
    try {
      const all = await loadData();
      if (state.batch !== b) return;
      const info = all[b._id];
      if (!info) { render('<div class="cxbv-state"><b>Batch data not found</b>Ye batch abhi available nahi hai.</div>'); return; }
      state.info = info;
      if (state.tab === "about") render(aboutHtml(info));
      else if (state.subject != null && info.subjects[state.subject]) {
        const sub = info.subjects[state.subject];
        root.innerHTML = shell(sub.name, lecturesHtml(sub));
      } else render(subjectsHtml(info));
    } catch (e) {
      render('<div class="cxbv-state"><b>Lectures load nahi ho paye</b>Internet check karke dobara try karo.<br><button class="cxbv-retry" type="button" data-act="retry">Retry</button></div>');
    }
  }

  function onInput(e) {
    if (e.target.id !== "cxbvFind") return;
    const sub = state.info && state.info.subjects[state.subject];
    if (!sub) return;
    const pos = e.target.selectionStart;
    root.querySelector(".cxbv-wrap").innerHTML = lecturesHtml(sub, e.target.value);
    const f = document.getElementById("cxbvFind");
    if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (_) {} }
  }

  function onClick(e) {
    const t = e.target.closest("[data-act],[data-tab],[data-subject],[data-lecture]");
    if (!t) return;
    if (t.dataset.act === "back") { history.back(); return; }
    if (t.dataset.act === "retry") { paint(); return; }
    if (t.dataset.tab) { state.tab = t.dataset.tab; state.subject = null; paint(); return; }
    if (t.dataset.subject != null) {
      state.subject = Number(t.dataset.subject);
      history.pushState({ cxbv: "subject" }, "");
      root.scrollTo(0, 0);
      paint();
      return;
    }
    if (t.dataset.lecture != null) {
      const sub = state.info.subjects[state.subject];
      const lec = sub && sub.lectures[Number(t.dataset.lecture)];
      if (lec && lec[1]) window.open(lec[1], "_blank", "noopener,noreferrer");
    }
  }

  function open(batch) {
    ensureRoot();
    state = { batch, tab: "lectures", subject: null, info: null };
    document.body.classList.add("cxbv-open");
    root.classList.add("open");
    root.scrollTo(0, 0);
    history.pushState({ cxbv: "batch", id: batch._id }, "");
    paint();
  }

  function close() {
    if (!root) return;
    root.classList.remove("open");
    root.innerHTML = "";
    document.body.classList.remove("cxbv-open");
    state = { batch: null, tab: "lectures", subject: null };
  }

  window.addEventListener("popstate", (e) => {
    if (!root || !root.classList.contains("open")) return;
    const s = e.state;
    if (s && s.cxbv === "subject") return;
    if (s && s.cxbv === "batch") { state.subject = null; paint(); return; }
    close();
  });

  window.CXBatchView = { open, close };
})();
