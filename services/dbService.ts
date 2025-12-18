
import { StudyArea, Topic, Resource, StudyLog } from '../types';

/**
 * Nota: En un entorno real, estas funciones realizarían llamadas fetch() 
 * a un backend Node.js/PostgreSQL o usarían un cliente como Supabase.
 * Se implementa la interfaz de comunicación necesaria.
 */

const API_ENDPOINT = '/api';

export const dbService = {
  // Áreas
  async fetchAreas(): Promise<StudyArea[]> {
    const res = await fetch(`${API_ENDPOINT}/areas`);
    if (!res.ok) throw new Error('Failed to fetch areas');
    return res.json();
  },

  async saveArea(area: StudyArea): Promise<void> {
    const res = await fetch(`${API_ENDPOINT}/areas`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(area)
    });
    if (!res.ok) throw new Error('Failed to save area');
  },

  async deleteArea(id: string): Promise<void> {
    const res = await fetch(`${API_ENDPOINT}/areas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete area');
  },

  // Temas
  async updateTopic(topic: Topic): Promise<void> {
    const res = await fetch(`${API_ENDPOINT}/topics/${topic.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topic)
    });
    if (!res.ok) throw new Error('Failed to update topic');
  },

  // Recursos / Videos
  async syncResources(topicId: string, resources: Resource[]): Promise<void> {
    const res = await fetch(`${API_ENDPOINT}/topics/${topicId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resources)
    });
    if (!res.ok) throw new Error('Failed to sync resources');
  },

  // Logs / Heatmap
  async fetchLogs(): Promise<StudyLog[]> {
    const res = await fetch(`${API_ENDPOINT}/logs`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  }
};
