/**
 * Votify Voting Logic
 */

let selectedCandidateId = null;

async function loadBallot(electionId) {
    try {
        const elections = await api.get('/elections');
        const election = elections.find(e => e.id == electionId);
        if (!election) throw new Error('Session invalid');
        
        document.getElementById('electionTitle').textContent = election.title;
        
        const candidates = await api.get(`/elections?election_id=${electionId}`);
        const list = document.getElementById('candidatesList');
        
        list.innerHTML = candidates.map(c => `
            <div onclick="selectCandidate(${c.id})" id="candidate-${c.id}" class="candidate-card saas-card p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all border-2 border-transparent">
                <div class="flex items-center gap-6">
                    <div class="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                        <i data-lucide="user" class="text-slate-300 w-8 h-8"></i>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-slate-900 group-hover:text-saas-blue transition-colors">${c.name}</h4>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Participant</p>
                    </div>
                </div>
                <div class="check-mark w-8 h-8 border-2 border-slate-200 rounded-full flex items-center justify-center transition-all">
                    <i data-lucide="check" class="w-5 h-5 opacity-0 group-[.selected]:opacity-100"></i>
                </div>
            </div>
        `).join('') || '<p class="text-center py-10 text-slate-400 font-bold uppercase tracking-widest">No candidates found</p>';
        lucide.createIcons();
    } catch (err) {
        alert(err.message);
        window.location.href = 'dashboard.html';
    }
}

function selectCandidate(id) {
    selectedCandidateId = id;
    document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`candidate-${id}`).classList.add('selected');
    
    const btn = document.getElementById('submitVote');
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
}

async function castVote(electionId) {
    const btn = document.getElementById('submitVote');
    try {
        btn.disabled = true;
        btn.innerHTML = 'Broadcasting Ballot...';
        await api.post('/votes?action=submit', { election_id: electionId, candidate_id: selectedCandidateId });
        alert('Ballot cast and cryptographically sealed. Thank you for participating.');
        window.location.href = 'results.html';
    } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.innerHTML = 'Cast Encrypted Ballot';
    }
}
