/**
 * Votify Dashboard & Stats Logic
 */

async function loadElections(targetId = 'electionsList') {
    try {
        const elections = await api.get('/elections');
        const list = document.getElementById(targetId);
        if (!list) return;

        list.innerHTML = elections.map(e => `
            <div class="saas-card p-8 bg-[#112947] border border-white/10 rounded-2xl shadow-xl hover:border-teal-500/50 transition-all group">
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 bg-teal-600/20 text-teal-400 flex items-center justify-center rounded-xl border border-teal-500/20">
                        <i data-lucide="archive" class="w-6 h-6"></i>
                    </div>
                    <span class="px-3 py-1 bg-teal-600/10 text-teal-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-teal-500/20">${e.status}</span>
                </div>
                <h3 class="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">${e.title}</h3>
                <p class="text-slate-400 text-sm mb-8 line-clamp-2">${e.description || 'Secure election session currently active for authorized participants.'}</p>
                <a href="${e.status === 'active' ? 'vote.html?id=' + e.id : '#'}" class="w-full inline-flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-teal-600 text-white rounded-xl transition-all font-bold text-sm border border-white/5 hover:border-teal-500 shadow-sm">
                    ${e.status === 'active' ? 'Enter Ballot Room' : 'View Parameters'} <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </a>
            </div>
        `).join('') || '<div class="col-span-full py-12 text-center text-slate-500 font-bold uppercase tracking-widest italic">No registry packets found</div>';
        lucide.createIcons();
    } catch (err) {
        console.error('Election Load Error:', err);
    }
}

async function loadAdminDashboard() {
    try {
        const data = await api.get('/dashboard');
        document.getElementById('totalElections').textContent = data.stats.elections;
        document.getElementById('totalVoters').textContent = data.stats.users;
        document.getElementById('totalVotes').textContent = data.stats.votes;
        
        // Render Users Table if present
        const userTable = document.getElementById('usersTable');
        if (userTable && data.users) {
            userTable.innerHTML = data.users.map(u => `
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td class="px-8 py-6 font-bold text-white">${u.name}</td>
                    <td class="px-8 py-6 text-slate-400 text-sm">${u.email}</td>
                    <td class="px-8 py-6 text-slate-400 text-xs font-bold uppercase">${u.role}</td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1 ${u.verified ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-600/10 text-amber-400 border-amber-500/20'} text-[10px] font-bold uppercase tracking-widest rounded-full border">
                            ${u.verified ? 'Verified' : 'Pending'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
        lucide.createIcons();
    } catch (err) {
        console.error('Admin Load Error:', err);
    }
}

async function loadResults() {
    try {
        const elections = await api.get('/elections');
        const grid = document.getElementById('resultsGrid');
        if (!grid) return;

        const resultsPromises = elections.map(e => api.get(`/dashboard?action=analytics&election_id=${e.id}`).catch(() => []));
        const allResults = await Promise.all(resultsPromises);
        
        grid.innerHTML = elections.map((e, idx) => {
            const results = allResults[idx].results || [];
            const totalVotes = results.reduce((acc, c) => acc + (c.vote_count || 0), 0);
            
            return `
                <div class="saas-card bg-[#112947] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                    <div class="p-8 border-b border-white/5 flex justify-between items-start">
                        <div>
                            <h4 class="text-xl font-extrabold text-white mb-1">${e.title}</h4>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Encryption status: Verified</p>
                        </div>
                        <div class="px-4 py-1.5 bg-teal-600/10 rounded-full border border-teal-500/20 text-[10px] font-bold uppercase tracking-widest text-teal-400">
                            Total: ${totalVotes} Votes
                        </div>
                    </div>
                    <div class="p-8 space-y-6">
                        ${results.length ? results.map(c => {
                            const percent = totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : 0;
                            return `
                                <div>
                                    <div class="flex justify-between items-end mb-3">
                                        <p class="text-sm font-bold text-slate-200">${c.name}</p>
                                        <p class="text-xs font-black text-teal-400">${c.vote_count} <span class="text-slate-500 font-bold">(${percent}%)</span></p>
                                    </div>
                                    <div class="h-3 bg-[#0E2340] rounded-full overflow-hidden border border-white/5">
                                        <div class="h-full bg-teal-600 transition-all duration-1000" style="width: ${percent}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="text-center py-6 text-slate-500 text-xs font-bold uppercase tracking-widest italic">Waiting for telemetry data</p>'}
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    } catch (err) {
        console.error('Results Load Error:', err);
    }
}
