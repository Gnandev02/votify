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
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td class="px-8 py-6 font-bold text-sidebar">${u.name}</td>
                    <td class="px-8 py-6 text-slate-500 text-sm font-medium">${u.email}</td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">${u.role}</span>
                    </td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1 ${u.verified ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-amber-100 text-amber-600 border-amber-200'} text-[10px] font-black uppercase tracking-widest rounded-full border">
                            ${u.verified ? 'Verified' : 'Pending'}
                        </span>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="4" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest italic">No users found</td></tr>';
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
                <div class="admin-card !p-0 overflow-hidden reveal-up">
                    <div class="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                        <div>
                            <h4 class="text-xl font-black text-sidebar mb-1">${e.title}</h4>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Reference: #${e.id}</p>
                        </div>
                        <div class="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                            Total: ${totalVotes} Votes
                        </div>
                    </div>
                    <div class="p-8 space-y-8">
                        ${results.length ? results.map(c => {
                            const percent = totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : 0;
                            return `
                                <div>
                                    <div class="flex justify-between items-end mb-3">
                                        <p class="text-sm font-bold text-sidebar">${c.name}</p>
                                        <p class="text-xs font-black text-primary">${c.vote_count} <span class="text-slate-400 font-bold">(${percent}%)</span></p>
                                    </div>
                                    <div class="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                                        <div class="h-full bg-primary rounded-full shadow-sm transition-all duration-1000" style="width: ${percent}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Waiting for voter telemetry</p>'}
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    } catch (err) {
        console.error('Results Load Error:', err);
    }
}
