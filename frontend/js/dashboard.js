/**
 * Votify Dashboard & Stats Logic (Dark SaaS Sync)
 */

async function loadElections(targetId = 'electionsList') {
    try {
        const elections = await api.get('/elections');
        const list = document.getElementById(targetId);
        if (!list) return;

        list.innerHTML = elections.map(e => `
            <div class="admin-card !bg-sidebar p-8 border border-white/5 rounded-2xl shadow-xl hover:border-primary/50 transition-all group">
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl border border-primary/20">
                        <i data-lucide="archive" class="w-6 h-6"></i>
                    </div>
                    <span class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">${e.status}</span>
                </div>
                <h3 class="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">${e.title}</h3>
                <p class="text-text-secondary text-sm mb-8 line-clamp-2">${e.description || 'Secure election session currently active for authorized participants.'}</p>
                <a href="${e.status === 'active' ? 'vote.html?id=' + e.id : '#'}" class="w-full inline-flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-primary hover:text-sidebar text-text-primary rounded-xl transition-all font-bold text-sm border border-white/5 hover:border-primary shadow-sm">
                    ${e.status === 'active' ? 'Enter Ballot Room' : 'View Parameters'} <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </a>
            </div>
        `).join('') || '<div class="col-span-full py-12 text-center text-text-secondary font-bold uppercase tracking-widest italic">No registry packets found</div>';
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
                <tr>
                    <td class="px-8 py-6 font-bold text-text-primary">${u.name}</td>
                    <td class="px-8 py-6 text-text-secondary text-sm font-medium">${u.email}</td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1 bg-white/5 text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5">${u.role}</span>
                    </td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1 ${u.verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} text-[10px] font-black uppercase tracking-widest rounded-full border">
                            ${u.verified ? 'Verified' : 'Pending'}
                        </span>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="4" class="px-8 py-12 text-center text-text-secondary font-bold uppercase tracking-widest italic">No users found</td></tr>';
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
                    <div class="p-8 border-b border-white/5 flex justify-between items-start bg-white/2">
                        <div>
                            <h4 class="text-xl font-black text-text-primary mb-1">${e.title}</h4>
                            <p class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Commission Reference: #${e.id}</p>
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
                                        <p class="text-sm font-bold text-text-primary">${c.name}</p>
                                        <p class="text-xs font-black text-primary">${c.vote_count} <span class="text-text-secondary font-bold">(${percent}%)</span></p>
                                    </div>
                                    <div class="activity-bar w-full">
                                        <div class="activity-progress transition-all duration-1000" style="width: ${percent}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="text-center py-10 text-text-secondary text-[10px] font-black uppercase tracking-widest italic">Waiting for voter telemetry</p>'}
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    } catch (err) {
        console.error('Results Load Error:', err);
    }
}
