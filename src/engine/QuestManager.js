import { QUESTS } from '../data/quests.js';

export class QuestManager {
    constructor(game) {
        this.game = game;
        this.activeQuests = [];
        this.completedQuestIds = new Set();
        this.load();
    }

    isQuestCompletedOrActive(questId) {
        return this.completedQuestIds.has(questId) || this.activeQuests.some(q => q.id === questId);
    }

    isQuestCompleted(questId) {
        return this.completedQuestIds.has(questId);
    }

    acceptQuest(questId) {
        if (this.completedQuestIds.has(questId)) return;
        if (this.activeQuests.find(q => q.id === questId)) return;

        const questTemplate = QUESTS[questId];
        if (!questTemplate) return;

        // Clone the quest template to track progress
        const quest = JSON.parse(JSON.stringify(questTemplate));
        this.activeQuests.push(quest);

        // Active Hail Trigger
        if (quest.hail && this.game.hud) {
            const sender = questId.startsWith('tut_') ? "TUTORIAL COMMANDER" : questId.startsWith('story_') ? "GHOST COMPANION" : "MISSION CONTROL";
            this.game.hud.triggerHail(sender, quest.hail);
        } else if (this.game.hud) {
            this.game.hud.addCommsMessage({ 
                sender: "MISSION CONTROL", 
                text: `New Objective: ${quest.title}. ${quest.description}`,
                entity: "system" 
            });
        }
        
        this.save();
    }

    notify(type, data) {
        let changed = false;
        // Loop backwards to safely handle potential removal
        for (let i = this.activeQuests.length - 1; i >= 0; i--) {
            const quest = this.activeQuests[i];
            let questChanged = false;

            for (const obj of quest.objectives) {
                if (obj.type === type && obj.current < obj.count) {
                    if (this._checkConditions(obj, data, quest)) {
                        // For 'boost' or 'input', we might want to count differently
                        if (type === 'boost') {
                            obj.current += 1; // 1 frame of boost
                        } else if (data.amount !== undefined) {
                            obj.current += data.amount;
                        } else {
                            obj.current++;
                        }
                        questChanged = true;
                        changed = true;
                        
                        if (obj.current >= obj.count) {
                            obj.complete = true;
                        }
                    }
                }
            }
            
            if (quest.objectives.every(o => o.current >= o.count)) {
                this.completeQuest(quest.id);
            }
        }

        if (changed) {
            this.save();
            if (this.game.hud) this.game.hud.update(this.game.player);
        }
    }

    _checkConditions(obj, data, quest) {
        if (obj.type === 'input') {
            return data.key === obj.key || (obj.key === 'a' && data.key === 'd'); // Group turn keys
        }
        if (obj.type === 'boost') {
            return data.active === true;
        }
        if (obj.type === 'science') {
            if (obj.target && data.target !== obj.target) return false;
            // Also check region if the quest has one
            const requiredRegion = obj.region || quest?.regionId;
            if (requiredRegion && data.region !== requiredRegion) return false;
            return data.success === true;
        }
        if (obj.type === 'reach') {
            if (obj.targetType && data.targetType !== obj.targetType) return false;
            if (obj.target && data.target !== obj.target) return false;
            if (obj.region && data.region !== obj.region) return false;
            return true;
        }

        // Generic target check
        if (obj.target && data.target !== obj.target && data.type !== obj.target) return false;

        // Regional enforcement: check if objective OR parent quest specifies a region
        const questRegion = obj.region || quest?.regionId;
        if (questRegion && data.region !== questRegion) return false;

        return true;
    }

    completeQuest(questId) {
        const index = this.activeQuests.findIndex(q => q.id === questId);
        if (index === -1) return;

        const questTemplate = QUESTS[questId];
        const quest = this.activeQuests[index];
        this.activeQuests.splice(index, 1);
        this.completedQuestIds.add(questId);

        // Apply rewards
        if (quest.rewards) {
            if (quest.rewards.gems) {
                this.game.player.gems += quest.rewards.gems;
                this.game.player.totalGemsCollected += quest.rewards.gems;
            }
            if (quest.rewards.sci) {
                this.game.player.sciencePoints += quest.rewards.sci;
            }
        }

        if (this.game.hud) {
            this.game.hud.addCommsMessage({
                sender: questId.startsWith('tut_') ? "TUTORIAL COMMANDER" : questId.startsWith('story_') ? "GHOST COMPANION" : "MISSION CONTROL",
                text: quest.completionMessage || `Objective ${quest.title} completed!`,
                entity: "system"
            });
            this.game.hud.showQuestComplete(quest);
            this.game.hud.update(this.game.player);
        }

        this.save();

        // Chain to next quest if applicable
        if (questTemplate && questTemplate.nextQuest) {
            this.acceptQuest(questTemplate.nextQuest);
        }
    }

    save() {
        const data = {
            activeQuests: this.activeQuests,
            completedQuestIds: Array.from(this.completedQuestIds)
        };
        localStorage.setItem('space_explorer_quests', JSON.stringify(data));
    }

    load() {
        const saved = localStorage.getItem('space_explorer_quests');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.activeQuests = data.activeQuests || [];
                this.completedQuestIds = new Set(data.completedQuestIds || []);
            } catch (e) {
                console.error("Failed to load quests:", e);
            }
        }
    }
}
