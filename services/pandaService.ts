/**
 * Panda Video Frontend Service
 * Handles API calls to Panda Video via the Backend routes (/api/panda-videos, /api/panda-explorer)
 */

export const pandaService = {
  /**
   * List videos from Panda Video (via Backend)
   * @param search Optional search term
   * @returns List of videos
   */
  async listVideos(search: string = '') {
    try {
      const url = `/api/panda-videos?search=${encodeURIComponent(search)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Backend: ${response.status}`);
      }

      const data = await response.json();
      return data.videos || [];
    } catch (error) {
      console.error("Erro ao listar vídeos do Panda:", error);
      throw error;
    }
  },

  /**
   * List folders and videos from Panda Video (Explorer via Backend)
   * @param folderId Optional folder ID
   * @returns Folders and videos
   */
  async explorer(folderId: string | null = null) {
    try {
      let url = '/api/panda-explorer';
      if (folderId && folderId !== 'root' && folderId !== 'null') {
        url += `?folderId=${folderId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Backend: ${response.status}`);
      }

      const data = await response.json();
      return {
        folders: data.folders || [],
        videos: data.videos || []
      };
    } catch (error) {
      console.error("Erro no Explorer do Panda:", error);
      throw error;
    }
  }
};
