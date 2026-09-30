import localforage from 'localforage';

export interface TriageTask {
    id: string;
    audioBase64: string;
    timestamp: number;
    status: 'pending' | 'synced' | 'failed';
}

const syncStore = localforage.createInstance({
    name: 'NodeBindingAI',
    storeName: 'triage_queue'
});

export const syncService = {
    async queueTriage(audioBase64: string) {
        const task: TriageTask = {
            id: crypto.randomUUID(),
            audioBase64,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        await syncStore.setItem(task.id, task);
        console.log(`[Offline-First] Queued triage ${task.id} to local SQLite/IndexedDB`);
        return task;
    },

    async flushQueue() {
        const keys = await syncStore.keys();
        const tasks: TriageTask[] = [];
        
        for (const key of keys) {
            const task = await syncStore.getItem<TriageTask>(key);
            if (task && task.status === 'pending') {
                tasks.push(task);
            }
        }

        const results = [];
        for (const task of tasks) {
            try {
                console.log(`[Delta Sync] Attempting to sync ${task.id}...`);
                const response = await fetch('http://localhost:8080/api/triage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audioBase64: task.audioBase64, mimeType: 'audio/webm' })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    task.status = 'synced';
                    await syncStore.removeItem(task.id);
                    console.log(`[Delta Sync] Successfully synced ${task.id}`);
                    results.push(data);
                }
            } catch (error) {
                console.error(`[Offline-First] Network unreachable, keeping ${task.id} in local cache`);
            }
        }
        return results;
    }
};
